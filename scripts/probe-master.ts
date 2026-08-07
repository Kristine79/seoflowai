/**
 * PROBE — live перепроверка submissionUrl для всех 75 площадок master-списка.
 *
 * Запуск (stealth, headed по умолчанию; для авто-режима можно --headless):
 *   npx tsx scripts/probe-master.ts [--headless] [--force] [--only <name>]
 *
 * Для каждой площадки:
 *   1. stealth open submissionUrl (fallback url)
 *   2. ждать ухода Cloudflare challenge до 60с
 *   3. если всё ещё CF -> CF_BLOCKED
 *   4. detect captcha -> CAPTCHA (probe не решает)
 *   5. detect login form -> LOGIN_REQUIRED
 *   6. extract form fields (input/select/textarea не hidden)
 *      - >=3 полей с listing-кейвордами -> FORM_READY (формы подачи найдена)
 *      - >=5 полей -> FORM_LIKELY
 *      - иначе EMPTY/SEARCH -> NOT_APPLICABLE (probe)
 *   7. screenshot -> probe-out/<slug>.png
 *
 * Результат: probe-results.json (resumable; --force перепробивает всё).
 * НЕ сабмитит. Цель — обновить классификацию и найти реальные submissionUrl.
 */

import "dotenv/config";
import { MASTER_LIST, PlatformEntry } from "../src/lib/directories/MASTER_LIST";
import {
  launchStealthContext,
  closeStealthContext,
  isCloudflareChallenge,
  waitForCloudflareClear,
  detectCaptcha,
  screenshotToFile,
  stealthGoto,
} from "../src/lib/automation/stealth";
import type { BrowserContext } from "playwright";
import fs from "fs";
import path from "path";

type ProbeVerdict =
  | "FORM_READY"      // >=3 полей + listing keywords (форма подачи найдена)
  | "FORM_LIKELY"     // >=5 полей, но без очевидных listing keywords
  | "LOGIN_REQUIRED"
  | "CAPTCHA"         // капча блокирует доступ к форме (probe не решает)
  | "CF_BLOCKED"
  | "DEAD"            // таймаут / unreachable
  | "EMPTY"           // <3 полей, не форма подачи
  | "NOT_APPLICABLE"; // явно не каталог (по содержимому: subscribe/search only)

interface ProbeResult {
  name: string;
  url: string;
  attemptedUrl: string;
  finalUrl: string;
  verdict: ProbeVerdict;
  fields: number;
  hasListingKW: boolean;
  cloudflare: boolean;
  captcha: string;
  formAction: string | null;
  screenshot: string | null;
  error: string | null;
  probeAt: string;
}

const OUT_DIR = path.resolve(process.cwd(), "probe-out");
const RESULTS_FILE = path.resolve(process.cwd(), "probe-results.json");

const LISTING_KW = /add (your )?(business|listing|company)|submit (your )?(listing|company|agency)|list (your )?business|claim (your )?(business|listing|company)|get listed|register (your |a )?(business|company|agency)|add a new business|become a partner|become a bark|partner application/i;
const LOGIN_KW = /\b(sign in|log in|login|create account|sign up|register)\b/i;
// явный сигнал "не каталог" — только подписка/поиск
const NOT_LISTING_KW = /\b(subscribe to our newsletter|sitemap|jobs near you|claims processing|sales intelligence|enterprise data)\b/i;

function loadExisting(): Record<string, ProbeResult> {
  if (fs.existsSync(RESULTS_FILE)) {
    try { return JSON.parse(fs.readFileSync(RESULTS_FILE, "utf8")); } catch { return {}; }
  }
  return {};
}

async function probe(entry: PlatformEntry, context: BrowserContext, sidewaysLogs: string[]): Promise<ProbeResult> {
  const attemptedUrl = entry.submissionUrl || entry.url;
  // persistent context восстанавливает прошлые вкладки — закрыть их, открыть свежую
  for (const p of context.pages()) { try { await p.close(); } catch {} }
  const page = await context.newPage();
  const res: ProbeResult = {
    name: entry.name, url: entry.url, attemptedUrl, finalUrl: "",
    verdict: "DEAD", fields: 0, hasListingKW: false, cloudflare: false, captcha: "none",
    formAction: null, screenshot: null, error: null,
    probeAt: new Date().toISOString(),
  };

  try {
    // одно retry навигации при chrome-error (network/socket нестабильность)
    for (let navAttempt = 1; navAttempt <= 2; navAttempt++) {
      await stealthGoto(page, attemptedUrl, 45000);
      await page.waitForTimeout(3000);
      const cur = page.url();
      if (!cur.startsWith("chrome-error://") && !cur.startsWith("about:blank")) break;
      if (navAttempt === 2) {
        res.error = `navigation failed (${cur})`;
        res.finalUrl = cur;
        res.verdict = "DEAD";
        try { res.screenshot = await shot(page, entry.name); } catch {}
        await page.close();
        return res;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }

    // Cloudflare wait
    if (await isCloudflareChallenge(page)) {
      res.cloudflare = true;
      sidewaysLogs.push(`${entry.name}: CF challenge, waiting...`);
      const cleared = await waitForCloudflareClear(page, 30000);
      if (!cleared) {
        res.verdict = "CF_BLOCKED";
        res.screenshot = await shot(page, entry.name);
        await page.close();
        return res;
      }
      res.cloudflare = false;
      sidewaysLogs.push(`${entry.name}: CF cleared`);
    }

    // ещё раз подождать SPA
    await page.waitForTimeout(2000);
    res.finalUrl = page.url();

    // captcha
    const cap = await detectCaptcha(page);
    res.captcha = cap.kind;
    if (cap.kind !== "none") {
      // kap4a вирта — пробер не решает; но проверим, есть ли позади неё форма
    }

    const info = await page.evaluate(({ listingSrc, loginSrc, notListingSrc }) => {
      const RX_LISTING = new RegExp(listingSrc, "i");
      const RX_LOGIN = new RegExp(loginSrc, "i");
      const RX_NOT_LISTING = new RegExp(notListingSrc, "i");
      const inputs = document.querySelectorAll(
        "input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]), select, textarea"
      );
      const pageText = (document.body?.innerText || "").toLowerCase();
      const hasPw = !!document.querySelector('input[type="password"]');
      const form = document.querySelector("form");
      const action = form ? form.getAttribute("action") : null;
      return {
        fields: inputs.length,
        hasListingKW: RX_LISTING.test(pageText),
        hasLoginKW: RX_LOGIN.test(pageText),
        hasNotListingOnly: RX_NOT_LISTING.test(pageText) && !RX_LISTING.test(pageText),
        hasPw,
        sampleText: pageText.slice(0, 240),
        action,
      };
    }, {
      listingSrc: LISTING_KW.source,
      loginSrc: LOGIN_KW.source,
      notListingSrc: NOT_LISTING_KW.source,
    });

    res.fields = info.fields;
    res.hasListingKW = info.hasListingKW;
    res.formAction = info.action;

    if (info.hasPw && info.hasLoginKW && !info.hasListingKW && info.fields < 5) {
      res.verdict = "LOGIN_REQUIRED";
    } else if (cap.kind === "recaptcha_v2" || cap.kind === "hcaptcha" || cap.kind === "turnstile") {
      // captcha-форма: probe отмечает CAPTCHA (form может быть готова позади, но без решения не подать)
      // если уже >=3 полей с listing kw — это форма подачи c капчей (важный сигнал)
      if (info.hasListingKW || info.fields >= 3) {
        res.verdict = info.fields >= 3 && info.hasListingKW ? "FORM_READY" : "FORM_LIKELY";
        // captcha=true уточняет причину NEEDS_MANUAL дальше
      } else {
        res.verdict = "CAPTCHA";
      }
    } else if (info.fields >= 3 && info.hasListingKW) {
      res.verdict = "FORM_READY";
    } else if (info.fields >= 5) {
      res.verdict = "FORM_LIKELY";
    } else if (info.hasNotListingOnly || (info.fields <= 2 && !info.hasListingKW)) {
      res.verdict = info.hasLoginKW ? "LOGIN_REQUIRED" : "NOT_APPLICABLE";
    } else if (info.fields === 0) {
      res.verdict = "EMPTY";
    } else {
      res.verdict = "FORM_LIKELY";
    }

    res.screenshot = await shot(page, entry.name);
  } catch (e) {
    res.error = e instanceof Error ? e.message.slice(0, 200) : String(e);
    res.verdict = "DEAD";
    try { res.screenshot = await shot(page, entry.name); } catch {}
  } finally {
    try { await page.close(); } catch {}
  }
  return res;
}

async function shot(page: import("playwright").Page, name: string): Promise<string> {
  const p = path.join(OUT_DIR, `${slug(name)}.png`);
  await screenshotToFile(page, p);
  return p;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const args = process.argv.slice(2);
  const headless = args.includes("--headless");
  const force = args.includes("--force");
  const onlyIdx = args.indexOf("--only");
  const onlyName = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
  const concIdx = args.indexOf("--workers");
  const workers = concIdx >= 0 ? Math.max(1, parseInt(args[concIdx + 1], 10) || 3) : 3;

  const existing = loadExisting();

  let list = MASTER_LIST;
  if (onlyName) list = list.filter((p) => slug(p.name) === slug(onlyName));
  else if (!force) list = list.filter((p) => !existing[slug(p.name)] || existing[slug(p.name)].verdict === "DEAD");

  console.log(`\nPROBE: ${list.length} площадок (headless=${headless}, workers=${workers}, force=${force}, only=${onlyName || "-"}).\n`);

  let idx = 0;
  const total = list.length;

  async function worker(workerId: number) {
    while (true) {
      const i = idx++;
      if (i >= total) return;
      const entry = list[i];
      const tag = `[${i + 1}/${total} w${workerId}]`;
      console.log(`${tag} ${entry.name.padEnd(22)} ${entry.type} ${attempt(entry)}`);
      const t0 = Date.now();
      let context: BrowserContext | null = null;
      try {
        // retry запуск на случай Windows-крашей при конкурентном старте
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            context = await launchStealthContext({ profile: slug(entry.name), headless });
            break;
          } catch (e) {
            if (attempt === 3) throw e;
            await new Promise((r) => setTimeout(r, 2000 * attempt));
          }
        }
        if (!context) throw new Error("context null");
        const r = await probe(entry, context, []);
        existing[slug(entry.name)] = r;
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(existing, null, 2));
        const secs = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`     -> ${r.verdict.padEnd(14)} fields=${r.fields} cf=${r.cloudflare} cap=${r.captcha} ${secs}s ${r.finalUrl.slice(0, 60)}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message.slice(0, 160) : String(e);
        console.log(`     -> ERROR ${msg}`);
        existing[slug(entry.name)] = {
          name: entry.name, url: entry.url, attemptedUrl: entry.submissionUrl || entry.url, finalUrl: "",
          verdict: "DEAD", fields: 0, hasListingKW: false, cloudflare: false, captcha: "none",
          formAction: null, screenshot: null, error: msg, probeAt: new Date().toISOString(),
        };
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(existing, null, 2));
      } finally {
        try { if (context) await context.close(); } catch {}
      }
    }
  }

  const pool = Array.from({ length: workers }, (_, i) => worker(i + 1));
  await Promise.all(pool);

  // Свод
  const tally: Record<string, number> = {};
  for (const v of Object.values(existing)) tally[v.verdict] = (tally[v.verdict] || 0) + 1;
  console.log("\n=== PROBE SUMMARY ===");
  for (const k of Object.keys(tally).sort()) console.log(`  ${k.padEnd(16)} ${tally[k]}`);
  console.log(`  total probed: ${Object.keys(existing).length} / ${MASTER_LIST.length}`);

  await closeStealthContext();
}

function attempt(entry: PlatformEntry): string {
  return (entry.submissionUrl || entry.url).slice(0, 60);
}

main().catch((e) => {
  console.error("FATAL:", e);
  closeStealthContext().catch(() => {});
  process.exit(1);
});