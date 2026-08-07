/**
 * generate-client-report.ts — клиентский отчёт по заказу размещения ITllect.
 *
 * Источники (НЕ запускает аудит заново):
 *  - src/lib/directories/MASTER_LIST.ts  (75 площадок клиента, авторитетный список)
 *  - human-queue.json                    (итоговые статусы после прогонов)
 *  - probe-results.json                  (live-проверки форм)
 *
 * Клиентские статусы (без технических терминов):
 *  Размещено (подтверждено) / Заявка отправлена / Аккаунт создан /
 *  Требуется ручное действие / Не удалось выполнить / Не подходит для размещения.
 *
 * Выход: client-report/ (CSV + XLSX с 5 листами + MD, priority-top10 MD).
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import ExcelJS from "exceljs";
import { MASTER_LIST } from "../src/lib/directories/MASTER_LIST";
import {
  loadQueue,
  loadProbes,
  shortReason,
  techStatusOf,
  techResultOf,
  clientStatusOf,
  clientResultOf,
  clientNextOf,
  clientReasonOf,
  NA_CATEGORY,
  NA_CATEGORY_LABELS,
  NA_CATEGORY_SHORT,
  NA_COMMENTS,
  PROFILE_URL_TEXT,
} from "./lib/client-data";
import { buildClientSummarySheet, styleTable } from "./lib/client-excel";

const OUT_DIR = "client-report";

const queue = loadQueue();
const probes = loadProbes();

interface Row {
  Directory: string;
  URL: string;
  Type: string;
  Category: string;
  Priority: string;
  Status: string;
  Result: string;
  Next: string;
  Reason: string;
  ProfileURL: string;
  techStatus: string;
  queueStatus: string;
  techResult: string;
  techReason: string;
  notes: string;
}

const CLIENT_COLS = [
  "Каталог",
  "URL",
  "Категория",
  "Тип",
  "Приоритет",
  "Статус",
  "Результат",
  "Следующий шаг",
  "Причина статуса",
  "Ссылка на профиль",
];

function buildRows(): Row[] {
  return MASTER_LIST.map((m) => {
    const q = queue.find((e) => e.name === m.name);
    if (!q) return null;
    const status = clientStatusOf(q);
    return {
      Directory: m.name,
      URL: m.url,
      Type: m.type,
      Category: m.clientCategory,
      Priority: m.priority,
      Status: status,
      Result: clientResultOf(q, probes),
      Next: clientNextOf(status),
      Reason: clientReasonOf(status),
      ProfileURL: PROFILE_URL_TEXT[m.name] || "—",
      techStatus: techStatusOf(q),
      queueStatus: q.status,
      techResult: techResultOf(q, probes),
      techReason: shortReason(q, probes),
      notes: q.notes || "",
    };
  }).filter(Boolean) as Row[];
}

function summarize(rows: Row[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.Status] = (counts[r.Status] || 0) + 1;
  return counts;
}

const TOP10: Array<{ p: string; name: string; url: string; reason: string; difficulty: string; expected: string }> = [
  { p: "P1", name: "Semfirms", url: "https://www.semfirms.com/add-listing", reason: "VERIFIED_SUCCESS 07.08: profile https://www.semfirms.com/profile/itllect-llc (Drupal; поле title требует полное юр. название 'Itllect LLC')", difficulty: "Средняя", expected: "VERIFIED_SUCCESS" },
  { p: "P1", name: "FindUsHere", url: "https://www.find-us-here.com/register.php", reason: "VERIFIED_SUCCESS 07.08: profile https://www.find-us-here.com/businesses/Itllect-LLC-Plantation-Florida-USA/34578398/ (без CAPTCHA и email-verify)", difficulty: "Низкая", expected: "VERIFIED_SUCCESS" },
  { p: "P2", name: "Brownbook", url: "https://www.brownbook.net/add-business", reason: "SUBMITTED 07.08: заявка отправлена, профиль НЕ опубликован (поиск: Results Found 0) — проверить email info@itllect-agency.com (activation) / дождаться модерации", difficulty: "Низкая", expected: "VERIFIED_SUCCESS possible" },
  { p: "P2", name: "CityLocalPro", url: "https://www.citylocalpro.com/add-your-business", reason: "SUBMITTED 07.08: заявка отправлена (reCAPTCHA v2 решена вручную), профиль НЕ опубликован (поиск: No result) — ожидать модерации", difficulty: "Средняя", expected: "VERIFIED_SUCCESS possible" },
  { p: "P2", name: "TopSEOs", url: "https://www.topseos.com/registration", reason: "Форма /registration жива (Drupal, 18f); заполнение проходит автоматически, остался шаг submit (OAuth только для входа)", difficulty: "Средняя", expected: "SUBMITTED possible" },
  { p: "P2", name: "Ft Lauderdale Chamber", url: "https://www.ftlchamber.com/membership", reason: "Заявка на членство (форма за логином)", difficulty: "Средняя", expected: "SUBMITTED possible" },
  { p: "P2", name: "The Manifest", url: "https://themanifest.com/listings/list-your-company", reason: "Регистрация → listing (Clutch); форма не детектится автоматически", difficulty: "Средняя", expected: "REGISTERED possible" },
  { p: "P2", name: "ActiveCampaign", url: "https://www.activecampaign.com/partners/become-a-partner", reason: "Сайт ожил; partner-форма 21f заполнена частично — дозаполнить и отправить вручную", difficulty: "Средняя", expected: "SUBMITTED possible" },
  { p: "P3", name: "Yellow Pages / Hotfrog / Manta", url: "https://www.yellowpages.com", reason: "BLOCKED: Cloudflare/anti-bot 403 — только ручной заход через обычный браузер", difficulty: "Высокая", expected: "MANUAL REQUIRED" },
];

const P3_NOTES = [
  "Yellow Pages / Hotfrog / Manta — BLOCKED (Cloudflare 403 \"Performing security verification\" / \"Sorry, you have been blocked\"): только ручной заход через обычный браузер",
  "Opendi / G2 — EXTERNAL BLOCK (Cloudflare/IP-reputation): сайты показывают \"Sorry, you have been blocked\"; без другого IP/VPN не открывать",
  "Superpages / EZlocal / Agency Spotter / Sortlist / South FL Biz Journal / Stack Overflow — Cloudflare challenge: только headed-сессия с ручным решением, медленно и нестабильно",
  "ProvenExpert — ERR_CONNECTION_CLOSED (блокировка соединения); Merchant Circle / HubPages — все URL регистрации 404/403: ручная проверка",
  "Sitejabber — CAPTCHA + ошибка запуска браузера; аккаунт создавался ранее, нужна ручная проверка",
  "Local.com — claim-listing отдаёт 404, форма нерабочая (площадка фактически мёртвая)",
  "n49 — 403 без stealth",
  "Awwwards / CSS Design Awards — платная подача",
  "Twitter/X, Nextdoor, Foursquare — верификация по телефону/открытке",
  "Stripe / Mailchimp / Webflow / HubSpot / Semrush / WooCommerce — партнёрские заявки с ручным ревью",
  "Business2Community — форма оказалась email-сборщиком (Aweber), не для подачи статей",
  "Уже отработаны (SUBMITTED/REGISTERED): GoodFirms, Plantation Chamber, DesignRush, Digital Agency Net, Crunchbase, Medium, Shopify, YouTube",
];

function buildMd(rows: Row[], counts: Record<string, number>) {
  const L: string[] = [];
  L.push("# Отчёт по размещению ITllect в каталогах");
  L.push("");
  L.push(`> Дата отчёта: ${new Date().toISOString().slice(0, 10)}`);
  L.push("> Компания: ITllect (https://itllect.com)");
  L.push("> Источник: список клиента `87catalogs.xlsx` (87 строк: 75 реальных площадок + 12 строк-заголовков секций) + 1 доп. площадка (FindUsHere)");
  L.push("");
  L.push("## Сводка");
  L.push("");
  L.push("| Статус | Кол-во |");
  L.push("|---|---|");
  L.push(`| Всего площадок | **76** (75 из списка клиента + FindUsHere) |`);
  L.push(`| Размещено (подтверждено) | **${counts["Размещено (подтверждено)"] || 0}** |`);
  L.push(`| Заявка отправлена | **${counts["Заявка отправлена"] || 0}** |`);
  L.push(`| Аккаунт создан | **${counts["Аккаунт создан"] || 0}** |`);
  L.push(`| Требуется ручное действие | **${counts["Требуется ручное действие"] || 0}** |`);
  L.push(`| Не удалось выполнить | **${counts["Не удалось выполнить"] || 0}** |`);
  L.push(`| Не подходит для размещения | **${counts["Не подходит для размещения"] || 0}** |`);
  L.push("");
  L.push(
    "**Итого результативных шагов: " +
      (counts["Размещено (подтверждено)"] + counts["Заявка отправлена"] + counts["Аккаунт создан"]) +
      " из 76.**"
  );
  L.push("");
  L.push("## Все площадки");
  L.push("");
  L.push("| Каталог | URL | Категория | Статус | Результат | Следующий шаг | Причина статуса |");
  L.push("|---|---|---|---|---|---|---|");
  for (const r of rows) {
    L.push(`| ${r.Directory} | ${r.URL} | ${r.Category} | ${r.Status} | ${r.Result.replace(/\|/g, "\\|")} | ${r.Next} | ${r.Reason} |`);
  }
  L.push("");
  L.push("## Служебные строки списка клиента (12, не площадки)");
  L.push("");
  L.push("Заголовки секций: GENERAL BUSINESS DIRECTORIES, AGENCY & B2B DIRECTORIES, LOCAL FLORIDA DIRECTORIES, LOCAL GOVERNMENT & OFFICIAL REGISTRATIONS, TOOL & PLATFORM PARTNER APPLICATIONS, PORTFOLIO & TECH DIRECTORIES, SOCIAL & PROFESSIONAL PROFILES, CONTENT PLATFORMS, REVIEW PLATFORMS — PROFILE SETUP ONLY, CITATION AGGREGATORS + строка заголовка таблицы + строка названия листа.");
  L.push("");
  return L.join("\n");
}

function buildTop10Md() {
  const L: string[] = [];
  L.push("# Приоритизация каталогов — TOP 10 для быстрого результата");
  L.push("");
  L.push("Критерии: P1 — открытая форма, без регистрации/CF/капчи; P2 — регистрация/email-подтверждение (IMAP-поток работает); P3 — Cloudflare/капча/платно/партнёрки.");
  L.push("");
  L.push("| Priority | Directory | URL | Reason | Estimated difficulty | Expected result |");
  L.push("|---|---|---|---|---|---|");
  for (const t of TOP10) {
    L.push(`| ${t.p} | ${t.name} | ${t.url} | ${t.reason} | ${t.difficulty} | ${t.expected} |`);
  }
  L.push("");
  L.push("## P3 — низкий приоритет (не фокусироваться сейчас)");
  L.push("");
  for (const n of P3_NOTES) L.push(`- ${n}`);
  L.push("");
  L.push("## План P1");
  L.push("");
  L.push("1. **Brownbook / CityLocalPro** — SUBMITTED 07.08: заявки отправлены, профили не опубликованы. Проверить email info@itllect-agency.com (Brownbook activation), дождаться модерации; при появлении профиля — зафиксировать URL и статус VERIFIED_SUCCESS.");
  L.push("2. **TopSEOs** — /registration: заполнение уже проходит автоматически; довести submit до конца (ручной клик при зависании). Ожидание: SUBMITTED.");
  L.push("3. **Opendi** — недоступен: EXTERNAL BLOCK (Cloudflare/IP fingerprint, turnstile). Нужен другой IP/VPN или ручной заход, иначе не открывать.");
  L.push("4. Затем P2 через email-assisted регистрацию (рабочий паттерн: Semfirms, FindUsHere): Ft Lauderdale Chamber → The Manifest → ActiveCampaign.");
  L.push("5. Правило: если площадка не даёт прогресса за 15 минут — остановиться и перейти к следующей P1.");
  L.push("");
  return L.join("\n");
}

function buildXlsx(rows: Row[]) {
  const wb = new ExcelJS.Workbook();

  buildClientSummarySheet(wb);

  const wsAll = wb.addWorksheet("Все площадки");
  wsAll.addRows([
    CLIENT_COLS,
    ...rows.map((r) => [
      r.Directory,
      r.URL,
      r.Category,
      r.Type,
      r.Priority,
      r.Status,
      r.Result,
      r.Next,
      r.Reason,
      r.ProfileURL,
    ]),
  ]);
  styleTable(wsAll, 1, CLIENT_COLS.length, [26, 50, 34, 6, 10, 26, 70, 40, 60, 34]);

  const ACTION_STATUSES = ["Заявка отправлена", "Аккаунт создан", "Требуется ручное действие"];
  const actionCols = ["Каталог", "URL", "Статус", "Результат", "Следующий шаг"];
  const wsAction = wb.addWorksheet("Требуется действие");
  wsAction.addRows([
    actionCols,
    ...rows
      .filter((r) => ACTION_STATUSES.includes(r.Status))
      .map((r) => [r.Directory, r.URL, r.Status, r.Result, r.Next]),
  ]);
  styleTable(wsAction, 1, actionCols.length, [26, 50, 26, 70, 40]);

  const naCols = ["Каталог", "URL", "Причина", "Пояснение"];
  const wsNA = wb.addWorksheet("Не подходит для размещения");
  wsNA.addRows([
    naCols,
    ...rows
      .filter((r) => r.Status === "Не подходит для размещения")
      .map((r) => {
        const cat = NA_CATEGORY[r.Directory] || 4;
        return [
          r.Directory,
          r.URL,
          NA_CATEGORY_SHORT[cat],
          NA_COMMENTS[r.Directory] || NA_CATEGORY_LABELS[cat].explanation,
        ];
      }),
  ]);
  styleTable(wsNA, 1, naCols.length, [26, 50, 34, 90]);

  const techCols = ["Каталог", "URL", "Системный статус", "Статус в очереди", "Результат (технический)", "Причина", "Примечания"];
  const wsTech = wb.addWorksheet("Технические данные");
  wsTech.addRows([
    techCols,
    ...rows.map((r) => [r.Directory, r.URL, r.techStatus, r.queueStatus, r.techResult, r.techReason, r.notes]),
  ]);
  styleTable(wsTech, 1, techCols.length, [26, 50, 20, 16, 90, 26, 40]);

  return wb;
}

function buildCsv(rows: Row[]): string {
  const header = CLIENT_COLS.join(",");
  const lines = rows.map((r) =>
    [r.Directory, r.URL, r.Category, r.Type, r.Priority, r.Status, r.Result, r.Next, r.Reason, r.ProfileURL]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...lines].join("\n");
}

function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const rows = buildRows();
  if (rows.length !== MASTER_LIST.length) {
    console.error(`Ожидалось ${MASTER_LIST.length} строк, получено ${rows.length} — есть расхождения с human-queue.json`);
  }
  const counts = summarize(rows);
  const order = ["Размещено (подтверждено)", "Заявка отправлена", "Аккаунт создан", "Требуется ручное действие", "Не удалось выполнить", "Не подходит для размещения"];

  writeFileSync(`${OUT_DIR}/client-directory-report.csv`, buildCsv(rows), "utf8");
  writeFileSync(`${OUT_DIR}/client-directory-report.md`, buildMd(rows, counts), "utf8");
  writeFileSync(`${OUT_DIR}/client-priority-top10.md`, buildTop10Md(), "utf8");

  const wb = buildXlsx(rows);
  const outFile = `${OUT_DIR}/client-directory-report.xlsx`;
  wb.xlsx.writeFile(outFile).then(
    () => {
      console.log("=== CLIENT DIRECTORY REPORT ===");
      console.log(`Rows: ${rows.length} (${MASTER_LIST.length} в MASTER_LIST)`);
      for (const k of order) console.log(`${k}: ${counts[k] || 0}`);
      console.log("Sheets: " + wb.worksheets.map((s) => s.name).join(", "));
      console.log("Files:");
      console.log(`  ${OUT_DIR}/client-directory-report.csv`);
      console.log(`  ${outFile}`);
      console.log(`  ${OUT_DIR}/client-directory-report.md`);
      console.log(`  ${OUT_DIR}/client-priority-top10.md`);
    },
    (err: Error) => {
      console.error("Не удалось записать XLSX:", (err as Error & { code?: string }).code, err.message);
      console.error("Файл может быть открыт в Excel — закройте его и перезапустите.");
      process.exitCode = 1;
    }
  );
}

main();
