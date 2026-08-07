/**
 * SUBMIT POOL — прогон существующего submission-runner (AI field-mapping)
 * на confirmed-SUCCESS_CANDIDATE пуле из probe-results.
 *
 * Без аргументов  -> PREVIEW (заполняет, НЕ отправляет; скриншоты + логи).
 *   npx tsx scripts/submit-pool.ts            # PREVIEW всех кандидатов
 *   npx tsx scripts/submit-pool.ts --submit   # реальная отправка (needs коррекции по отчёту)
 *   npx tsx scripts/submit-pool.ts --only GoodFirms
 *
 * Существующий submission-runner/browser.ts НЕ трогаются — используются через импорт.
 * Headless (browser.ts), т.к. PREVIEW не требует manual-captcha. Для SUBMIT на CityLocalPro
 * запускайте отдельный headed-адаптер (adaptбер для капчи — отдельный шаг).
 */

import "dotenv/config";
import OpenAI from "openai";
import { runSubmission, type SubmissionMode } from "../src/lib/automation/submission-runner";
import { closeBrowser } from "../src/lib/automation/browser";
import { MASTER_LIST } from "../src/lib/directories/MASTER_LIST";
import fs from "fs";
import path from "path";

const COMPANY_DATA: Record<string, string> = {
  name: "ITllect",
  legalName: "ITllect Consulting Inc.",
  website: "https://itllect.com",
  email: "info@itllect.com",
  phone: "(123) 636-4087",
  address: "100 N University Dr",
  city: "Coral Springs",
  state: "FL",
  zip: "33071",
  country: "US",
  description: "ITllect is a technology consulting firm specializing in AI, cloud infrastructure, and digital transformation solutions for enterprise clients.",
  services: "AI Consulting, Cloud Infrastructure, Digital Transformation, Enterprise IT Solutions, Web Design & Development, SEO & Digital Marketing",
  keywords: "AI consulting, cloud infrastructure, digital transformation, technology consulting, enterprise IT, SEO, digital marketing, web design",
  category: "Digital Marketing Agency",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  timeout: 12000,
  maxRetries: 1,
});

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// пул SUCCESS_CANDIDATE из probe-results (FORM_READY) — берём finalUrl реальной формы,
// иначе submissionUrl из master.
const probe: Record<string, any> = JSON.parse(
  fs.readFileSync("./probe-results.json", "utf8")
);
// площадки, явно не подходящие для listing (исключаем из submission-pool)
const GENUINELY_NA_POOL = new Set([
  "FL SBDC Network", "City of Plantation", "Broward County Biz",
  "SBA.gov Business", "FL DEO Business", "SCORE Mentor Network",
  "Spoke", "South FL Biz Journal", "Data Axle", "HubSpot Agency Dir",
]);

const ACCEPTED_VERDICTS = new Set(["FORM_READY", "FORM_LIKELY"]);
const POOL = MASTER_LIST.filter((p: any) => {
  const pr = probe[slug(p.name)];
  return pr && ACCEPTED_VERDICTS.has(pr.verdict) && !GENUINELY_NA_POOL.has(p.name);
}).map((p: any) => {
  const pr = probe[slug(p.name)];
  return {
    name: p.name,
    url: pr.finalUrl && !pr.finalUrl.startsWith("chrome-error") ? pr.finalUrl : p.submissionUrl,
    method: p.method,
    type: p.type,
  };
});

interface PoolResult {
  name: string; url: string; mode: string;
  success: boolean; status: "SUCCESS" | "NEEDS_MANUAL" | "FAILED";
  error: string | null; fieldCount: number; filledCount: number;
  duration: number; screenshotFile: string | null; logFile: string | null;
}

function classifyStatus(r: { success: boolean; error?: string }): PoolResult["status"] {
  if (r.success) return "SUCCESS";
  const err = (r.error || "").toLowerCase();
  if (err.includes("captcha") || err.includes("авторизация") || err.includes("login") ||
      err.includes("email") || err.includes("модерац") || err.includes("verification") ||
      err.includes("подтверд") || err.includes("cloudflare")) return "NEEDS_MANUAL";
  return "FAILED";
}

async function main() {
  const args = process.argv.slice(2);
  const submitFlag = args.includes("--submit");
  const mode: SubmissionMode = submitFlag ? "SUBMIT" : "PREVIEW";
  const onlyIdx = args.indexOf("--only");
  const onlyName = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

  let pool = POOL;
  if (onlyName) {
    const onlyList = onlyName.split(",").map((s) => slug(s.trim()));
    pool = pool.filter((p) => onlyList.some((o) => slug(p.name).includes(o) || p.name.toLowerCase().includes(o)));
  }
  // --skip "A,B" пропускает перечисленные по успеху ранее
  const skipIdx = args.indexOf("--skip");
  if (skipIdx >= 0) {
    const skipList = (args[skipIdx + 1] || "").split(",").map((s) => slug(s.trim()));
    pool = pool.filter((p) => !skipList.includes(slug(p.name)));
  }

  const outDir = path.resolve(mode === "SUBMIT" ? "pool-submit" : "pool-preview");
  fs.mkdirSync(outDir, { recursive: true });

  console.log("==================================================");
  console.log(`  POOL ${mode}: SUCCESS_CANDIDATE (${pool.length})`);
  console.log(`  Company: ${COMPANY_DATA.name} (${COMPANY_DATA.website})`);
  console.log("==================================================\n");

  const results: PoolResult[] = [];

  for (let i = 0; i < pool.length; i++) {
    const dir = pool[i];
    if (i > 0) await new Promise((r) => setTimeout(r, 12000));
    console.log(`\n[${i + 1}/${pool.length}] ${dir.name} — ${dir.url}`);
    console.log("─".repeat(60));
    const t0 = Date.now();
    const logCapture: string[] = [];
    const logLine = (m: string) => logCapture.push(m);
    try {
      const r = await runSubmission(dir.url, COMPANY_DATA, openai, mode, null, logLine);
      const duration = ((Date.now() - t0) / 1000).toFixed(1);
      const status = classifyStatus(r);
      const screenshotFile = r.screenshot
        ? path.join(outDir, `${slug(dir.name)}-${mode.toLowerCase()}.png`)
        : null;
      if (screenshotFile && r.screenshot) {
        fs.writeFileSync(screenshotFile, Buffer.from(r.screenshot, "base64"));
      }
      const logFile = path.join(outDir, `${slug(dir.name)}-${mode.toLowerCase()}.log`);
      fs.writeFileSync(logFile, r.logs.join("\n"), "utf-8");
      const filled = Object.values(r.fieldMapping || {}).filter((v) => v && v.length > 0).length;
      const fieldsFound = r.formStructure?.fields?.length || 0;
      const res: PoolResult = {
        name: dir.name, url: dir.url, mode, success: r.success, status,
        error: r.error || null, fieldCount: fieldsFound, filledCount: filled,
        duration: parseFloat(duration), screenshotFile, logFile,
      };
      results.push(res);
      const icon = status === "SUCCESS" ? "✅" : status === "NEEDS_MANUAL" ? "🔶" : "❌";
      console.log(`  ${icon} ${status} | ${duration}s | fields ${fieldsFound} → filled ${filled}`);
      if (r.error) console.log(`  Err: ${r.error}`);
      if (screenshotFile) console.log(`  Shot: ${screenshotFile}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const duration = ((Date.now() - t0) / 1000).toFixed(1);
      results.push({
        name: dir.name, url: dir.url, mode, success: false, status: "FAILED",
        error: `Script error: ${msg}`, fieldCount: 0, filledCount: 0,
        duration: parseFloat(duration), screenshotFile: null, logFile: null,
      });
      console.log(`  ❌ FAILED — ${msg}`);
    }
  }

  // отчёт
  const repPath = path.join(outDir, "pool-report.md");
  const body = results.map((r) =>
    `| ${r.name} | ${r.mode} | ${r.status === "SUCCESS" ? "✅ SUCCESS" : r.status === "NEEDS_MANUAL" ? "🔶 NEEDS_MANUAL" : "❌ FAILED"} | ${r.fieldCount} | ${r.filledCount} | ${r.duration}s | ${r.error || "—"} |`
  ).join("\n");
  const counts = { SUCCESS: 0, NEEDS_MANUAL: 0, FAILED: 0 };
  for (const r of results) counts[r.status]++;
  const md = `# POOL ${mode} — SUCCESS_CANDIDATE\n\nДата: ${new Date().toISOString().slice(0,10)}\nCompany: ${COMPANY_DATA.name}\n\n| Status | Count |\n|---|--:|\n| SUCCESS | ${counts.SUCCESS} |\n| NEEDS_MANUAL | ${counts.NEEDS_MANUAL} |\n| FAILED | ${counts.FAILED} |\n\n| Directory | Mode | Status | Fields | Filled | Time | Error |\n|---|---|---|--:|--:|--:|---|\n${body}\n`;
  fs.writeFileSync(repPath, md, "utf-8");

  console.log("\n==================================================");
  console.log("  POOL RESULTS");
  console.log("==================================================");
  for (const r of results) {
    const icon = r.status === "SUCCESS" ? "✅" : r.status === "NEEDS_MANUAL" ? "🔶" : "❌";
    console.log(`| ${r.name.padEnd(20)} | ${icon} ${r.status.padEnd(13)} | f=${r.fieldCount}/${r.filledCount} | ${r.duration}s |`);
  }
  console.log(`\nSUCCESS ${counts.SUCCESS} | NEEDS_MANUAL ${counts.NEEDS_MANUAL} | FAILED ${counts.FAILED}`);
  console.log(`Report: ${repPath}`);

  await closeBrowser();
}

main().catch((e) => {
  console.error("FATAL:", e);
  closeBrowser().catch(() => {});
  process.exit(1);
});