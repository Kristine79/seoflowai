/**
 * GENERATE FINAL REPORT — финальный отчёт по 75 площадкам клиента.
 *
 * Объединяет:
 *   - MASTER_LIST (тип A/B/C/D/E, метод, категория клиента)
 *   - probe-results (live-вердикт, поля, captcha, cloudflare, finalUrl)
 *
 * Спускаем probe-вердикт в клиентский статус по правилам задачи:
 *   FORM_READY          -> SUCCESS_CANDIDATE (готова к submit сейчас)
 *   FORM_LIKELY         -> NEEDS_MANUAL (требует до-проверки формы/многошаг)
 *   LOGIN_REQUIRED      -> NEEDS_MANUAL (регистрация аккаунта на info@itllect.com)
 *   CAPTCHA             -> NEEDS_MANUAL (ручная капча)  [stealth + headed]
 *   CF_BLOCKED          -> NEEDS_MANUAL (headed + stealth + manual CF) — НЕ FAILED
 *   EMPTY               -> NEEDS_MANUAL (форма не на угаданном URL; нужен ручной поиск пути)
 *   NOT_APPLICABLE      -> NEEDS_MANUAL КРОМЕ случаев, где контент явно не-каталог
 *                          (Government mentor/PR newsroom/Aggregator-enterprise) -> NOT_APPLICABLE
 *   DEAD                -> FAILED (unreachable после retry)
 *
 * Выход: final-report-75.md + final-report-75.csv
 */

import { MASTER_LIST, PlatformType } from "../src/lib/directories/MASTER_LIST";
import fs from "fs";

interface ProbeRow {
  name: string;
  url: string;
  attemptedUrl: string;
  finalUrl: string;
  verdict: string;
  fields: number;
  hasListingKW: boolean;
  cloudflare: boolean;
  captcha: string;
  error: string | null;
}

const probe: Record<string, ProbeRow> = JSON.parse(
  fs.readFileSync("./probe-results.json", "utf8")
);

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** площадки, для которых "не-каталог" подтверждено контентом/категорией клиента */
const GENUINELY_NA = new Set([
  "FL SBDC Network", "City of Plantation", "Broward County Biz",
  "SBA.gov Business", "FL DEO Business", "SCORE Mentor Network",
  "Spoke", "South FL Biz Journal", "Data Axle", "HubSpot Agency Dir",
  "Semrush Agency Partners", "Webflow Partner",
  "Neustar Localeze", "Express Update USA", "Foursquare Business",
  "Nextdoor Business", "Expertise.com",
]);

const TYPE_NAME: Record<PlatformType, string> = {
  A: "Business directory",
  B: "Reviews",
  C: "Agency marketplace",
  D: "Content/Profile",
  E: "Partner program",
};

interface ReportRow {
  platform: string;
  type: string;
  method: string;
  status: Status;
  link: string;
  required: string;
  typeLetter: PlatformType;
  priority: string;
}

type Status = "SUCCESS_CANDIDATE" | "NEEDS_MANUAL" | "FAILED" | "NOT_APPLICABLE";

function requiredAction(type: PlatformType, pr: ProbeRow | undefined): string {
  if (!pr) return "Не пробировано — повторить probe.";
  const bits: string[] = [];
  if (pr.cloudflare) bits.push("Cloudflare (headed stealth)");
  if (pr.captcha && pr.captcha !== "none") bits.push(`captcha: ${pr.captcha} (manual)`);
  switch (pr.verdict) {
    case "FORM_READY":
      bits.unshift("Fill form + submit");
      break;
    case "FORM_LIKELY":
      bits.unshift("До-проверить форму (multi-step / SPA), затем submit");
      break;
    case "LOGIN_REQUIRED":
      bits.unshift("Регистрация аккаунта на info@itllect.com + email verify");
      break;
    case "CAPTCHA":
      bits.unshift("Headed maual capcha + submit");
      break;
    case "CF_BLOCKED":
      bits.unshift("Headed stealth + ручной Cloudflare challenge + submit");
      break;
    case "EMPTY":
      bits.unshift("Ручной поиск пути подачи (claim/add-business)");
      break;
    case "DEAD":
      bits.unshift("Unreachable — перепроверить SPF/DNS/прокси");
      break;
    case "NOT_APPLICABLE":
    default:
      bits.unshift("Уточнить путь подачи / partner application");
      break;
  }
  // type-specific extra
  switch (type) {
    case "B": bits.push("company claim + domain/email verification"); break;
    case "C": bits.push("agency profile: услуги + описание + портфолио"); break;
    case "D": bits.push("profile + контент (публикация/draft)"); break;
    case "E": bits.push("partner application + manual review"); break;
  }
  return bits.filter(Boolean).join("; ");
}

function dispatchStatus(pr: ProbeRow | undefined, name: string): Status {
  if (!pr) return "NEEDS_MANUAL";
  switch (pr.verdict) {
    case "FORM_READY": return "SUCCESS_CANDIDATE";
    case "FORM_LIKELY": return "NEEDS_MANUAL";
    case "LOGIN_REQUIRED": return "NEEDS_MANUAL";
    case "CAPTCHA": return "NEEDS_MANUAL";
    case "CF_BLOCKED": return "NEEDS_MANUAL";
    case "EMPTY": return "NEEDS_MANUAL";
    case "DEAD": return "FAILED";
    case "NOT_APPLICABLE":
      // пробер пометил N/A —专场 проверяем, реально ли сайт не-каталог
      return "NEEDS_MANUAL";
    default:
      return "NEEDS_MANUAL";
  }
}

/** Переопределение явный NOT_APPLICABLE (по контенту/категории) поверх probe. */
function applyGenuineNa(name: string, st: Status): Status {
  if (GENUINELY_NA.has(name)) {
    // government mentor / SBA-resource / aggregator-enterprise / SPA не-каталог остаются NOT_APPLICABLE
    return "NOT_APPLICABLE";
  }
  return st;
}

const rows: ReportRow[] = MASTER_LIST.map((p: any) => {
  const pr = probe[slug(p.name)];
  let st = dispatchStatus(pr, p.name);
  st = applyGenuineNa(p.name, st);
  const link = pr?.finalUrl && !pr.finalUrl.startsWith("chrome-error") && !pr.finalUrl.startsWith("about")
    ? pr.finalUrl
    : (p.submissionUrl || p.url);
  return {
    platform: p.name,
    type: TYPE_NAME[p.type as PlatformType],
    method: p.method,
    status: st,
    link,
    required: requiredAction(p.type, pr),
    typeLetter: p.type,
    priority: p.priority,
  };
});

// упорядочить: SUCCESS_CANDIDATE → NEEDS_MANUAL → FAILED → NOT_APPLICABLE, внутри по типу
const order: Record<Status, number> = {
  SUCCESS_CANDIDATE: 0, NEEDS_MANUAL: 1, FAILED: 2, NOT_APPLICABLE: 3,
};
rows.sort((a, b) =>
  order[a.status] - order[b.status] ||
  a.typeLetter.localeCompare(b.typeLetter) ||
  a.platform.localeCompare(b.platform)
);

// своды
const tally: Record<string, number> = {};
const byTypeStatus: Record<string, Record<string, number>> = {};
for (const r of rows) {
  tally[r.status] = (tally[r.status] || 0) + 1;
  byTypeStatus[r.typeLetter] ||= {};
  byTypeStatus[r.typeLetter][r.status] = (byTypeStatus[r.typeLetter][r.status] || 0) + 1;
}

// ── Markdown ──
const md: string[] = [];
md.push(`# Final Submission Report — ITllect (75 площадок клиента)`);
md.push("");
md.push(`Дата: ${new Date().toISOString().slice(0, 10)}`);
md.push(`Источник списка: public/87catalogs.xlsx (75 реальных площадок)`);
md.push(`Классификация: A=Business dir, B=Reviews, C=Agency marketplace, D=Content/Profile, E=Partner`);
md.push("");
md.push(`## Summary`);
md.push("");
md.push("| Статус | Кол-во |");
md.push("|--------|-------:|");
for (const k of ["SUCCESS_CANDIDATE", "NEEDS_MANUAL", "FAILED", "NOT_APPLICABLE"]) {
  md.push(`| ${k} | ${tally[k] || 0} |`);
}
md.push("");
md.push(`## Свод по типам`);
md.push("");
md.push("| Тип | SUCCESS_CANDIDATE | NEEDS_MANUAL | FAILED | NOT_APPLICABLE |");
md.push("|-----|-----------------:|-------------:|-------:|---------------:|");
for (const t of ["A", "B", "C", "D", "E"] as PlatformType[]) {
  const s = byTypeStatus[t] || {};
  md.push(`| ${t} | ${s["SUCCESS_CANDIDATE"] || 0} | ${s["NEEDS_MANUAL"] || 0} | ${s["FAILED"] || 0} | ${s["NOT_APPLICABLE"] || 0} |`);
}
md.push("");
md.push(`## Полный каталог`);
md.push("");
md.push("| # | Каталог | Тип | Метод | Статус | Ссылка | Что требуется |");
md.push("|---|---------|-----|-------|--------|--------|---------------|");
rows.forEach((r, i) => {
  md.push(
    `| ${i + 1} | ${r.platform} | ${r.typeLetter} | ${escMd(r.method)} | ${r.status} | ${escMd(r.link)} | ${escMd(r.required)} |`
  );
});
md.push("");
md.push(`_SUCCESS_CANDIDATE_ — форма подачи доступна сразу; готов к SUBMIT (после guard-check).  
_NEEDS_MANUAL_ — требует человек-в-цикле: регистрация аккаунта/верификация email / Cloudflare / капча / поиск реально- го пути подачи.  
_FAILED_ — unreachable после retry (часть можно реанимировать переключением сети/прокси).  
_NOT_APPLICABLE_ — площадка не подходит для размещения компании (гос.ресурс / PR newsroom / энтерпрайз-агрегатор).`);

fs.writeFileSync("final-report-75.md", md.join("\n"), "utf-8");

// ── CSV (по spec: Каталог | Тип | Метод | Статус | Ссылка | Что требуется) ──
const csv = [
  ["Каталог", "Тип", "Метод", "Статус", "Ссылка", "Что требуется"],
  ...rows.map((r) => [r.platform, r.type, r.method, r.status, r.link, r.required]),
].map(arr => arr.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
fs.writeFileSync("final-report-75.csv", "\uFEFF" + csv, "utf-8");

console.log(`Report written: final-report-75.md / .csv  (${rows.length} rows)`);
console.log("Summary:", JSON.stringify(tally));
console.log("By type:", JSON.stringify(byTypeStatus, null, 0));

function escMd(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}