/**
 * QUICK SUBMIT — автономные SUBMIT-попытки по кандидатам, которые
 * не проходят через headless browser.ts (медленные/CF) или ожили после DEAD.
 * Использует stealth-харнесс (headless по умолчанию, --headed для ручного CF/captcha).
 *
 *   npx tsx scripts/quick-submit.ts --only Local.com
 *   npx tsx scripts/quick-submit.ts --only "G2,ActiveCampaign,Bark.com"
 *   npx tsx scripts/quick-submit.ts --headed --only Opendi   # человек решает CF
 *
 * Результат: quick-submit-out/<slug>/*.png + .log; статусы пишет в консоль.
 */
import "dotenv/config";
import OpenAI from "openai";
import {
  launchStealthContext,
  stealthGoto,
  isCloudflareChallenge,
  waitForCloudflareClear,
  detectCaptcha,
  screenshotToFile,
} from "../src/lib/automation/stealth";
import { extractFormStructure } from "../src/lib/automation/form-analyzer";
import { mapFieldsWithAI } from "../src/lib/automation/field-mapper";
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
  timeout: 15000,
  maxRetries: 1,
});

const TARGETS: Record<string, { url: string; note: string }> = {
  "Local.com": { url: "https://www.local.com/claim-listing", note: "claim-listing; ожил после DEAD" },
  "G2": { url: "https://www.g2.com/claim-listing", note: "claim-listing; ожил после DEAD" },
  "ActiveCampaign": { url: "https://www.activecampaign.com/partners/become-a-partner", note: "partner form; ожил после DEAD" },
  "Bark.com": { url: "https://www.bark.com/en/us/business/", note: "SPA signup; PREVIEW 35f/4" },
  "Opendi": { url: "https://service.opendi.us/listings", note: "create a free listing; 4f, no captcha" },
  "GoodFirms": { url: "https://www.goodfirms.co/list-your-company", note: "CF turnstile на /get-listed" },
  "TopSEOs": { url: "https://www.topseos.com/registration", note: "Drupal form[first_name..phone]; старый /vendor-registration = 404" },
  "Business2Community": { url: "https://www.business2community.com/contribute", note: "contributor form; submit button после логина" },
  "DigitalAgencyNet": { url: "https://digitalagencynetwork.com/add-agency/", note: "нужна регистрация перед add-agency" },
};

const OUT_DIR = path.resolve("quick-submit-out");
const SUCCESS_SIGNALS = [
  "thank you", "submitted", "success", "received", "we will review", "congratulations",
  "your listing", "profile created", "added", "your submission", "has been sent",
  "we appreciate", "look forward",
];

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function quickSubmit(name: string, headed: boolean) {
  const target = TARGETS[name];
  if (!target) { console.error(`Unknown target: ${name}`); return; }
  const outDir = path.join(OUT_DIR, slug(name));
  fs.mkdirSync(outDir, { recursive: true });
  const logs: string[] = [];
  const log = (m: string) => { logs.push(m); console.log(`  ${m}`); };

  console.log(`\n=== QUICK SUBMIT: ${name} (${headed ? "headed" : "headless"}) ===`);
  let ctx: any = null;
  try {
    ctx = await launchStealthContext({ profile: `quick-${slug(name)}`, headless: !headed });
    const page = await ctx.newPage();

    log(`Navigating to ${target.url}...`);
    await stealthGoto(page, target.url, 90000);
    await page.waitForTimeout(4000);
    log(`Final URL: ${page.url().slice(0, 90)}`);
    log(`Title: ${(await page.title().catch(() => "")).slice(0, 60)}`);

    const cf = await isCloudflareChallenge(page);
    if (cf) {
      if (headed) {
        log("Cloudflare — waiting up to 120s for manual solve...");
        const cleared = await waitForCloudflareClear(page, 120000);
        if (!cleared) { log("CF not cleared"); await screenshotToFile(page, path.join(outDir, "cf-blocked.png")); }
        else log("Cloudflare cleared ✓");
      } else {
        log("Cloudflare detected (headless) — NEEDS_MANUAL");
        await screenshotToFile(page, path.join(outDir, "cf-blocked.png"));
        log(`Screenshot: ${path.join(outDir, "cf-blocked.png")}`);
        return { name, status: "NEEDS_MANUAL", error: "Cloudflare" };
      }
    }

    const cap = await detectCaptcha(page);
    if (cap.kind !== "none") {
      if (headed) {
        log(`Captcha (${cap.kind}) — waiting up to 180s for manual solve...`);
        const start = Date.now();
        while (Date.now() - start < 180000) {
          if ((await detectCaptcha(page).catch(() => ({ kind: "none" }))).kind === "none") break;
          await page.waitForTimeout(2000);
        }
      } else {
        log(`Captcha (${cap.kind}) detected (headless) — NEEDS_MANUAL`);
        await screenshotToFile(page, path.join(outDir, "captcha.png"));
        return { name, status: "NEEDS_MANUAL", error: `${cap.kind} captcha` };
      }
    }

    // Если на лендинге (мало полей) — ищем ссылку add/submit
    let navUrl = target.url;
    const info = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]), select, textarea");
      const text = document.body?.innerText?.toLowerCase() || "";
      return { fieldCount: inputs.length, hasListingKW: /add your business|add a business|get listed|list your company|submit|claim|register/i.test(text) };
    }).catch(() => ({ fieldCount: 0, hasListingKW: false }));
    if (info.fieldCount < 3) {
      const link = await page.evaluate(() => {
        const kw = ["add your business", "add a business", "get listed", "list your company", "claim your business", "claim your listing", "submit your listing", "add business", "claim"];
        for (const k of kw) {
          for (const el of Array.from(document.querySelectorAll<HTMLElement>("a, button, [role=button]"))) {
            const t = (el.textContent || "").trim().toLowerCase();
            if (t.startsWith(k) || t === k || t.includes(k)) {
              const href = el.getAttribute("href");
              if (href && !href.startsWith("javascript")) return { found: true, href, text: t.slice(0, 50) };
            }
          }
        }
        return { found: false, href: "", text: "" };
      }).catch(() => ({ found: false, href: "", text: "" }));
      if (link.found) {
        navUrl = link.href.startsWith("http") ? link.href : new URL(link.href, page.url()).href;
        log(`Navigating via link "${link.text}" → ${navUrl}`);
        await page.goto(navUrl, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
        await page.waitForTimeout(3000);
        log(`Now on: ${page.url().slice(0, 90)}`);
      }
    }

    const form = await extractFormStructure(page);
    log(`Form fields: ${form.fields.length}`);
    if (form.fields.length === 0) {
      await screenshotToFile(page, path.join(outDir, "noform.png"));
      return { name, status: "NEEDS_MANUAL", error: "No form found" };
    }

    let mapping: Record<string, string> = {};
    try {
      mapping = await mapFieldsWithAI(openai, COMPANY_DATA, form.fields);
      log(`AI mapping: ${Object.keys(mapping).length} fields`);
    } catch (e) {
      log(`AI mapping failed: ${e instanceof Error ? e.message.slice(0, 100) : e}`);
      for (const f of form.fields) {
        const l = (f.label || f.placeholder || "").toLowerCase();
        if (l.includes("name") || l.includes("company") || l.includes("business")) mapping[f.selector] = COMPANY_DATA.name;
        else if (l.includes("email")) mapping[f.selector] = COMPANY_DATA.email;
        else if (l.includes("phone")) mapping[f.selector] = COMPANY_DATA.phone;
        else if (l.includes("website") || l.includes("url") || l.includes("site")) mapping[f.selector] = COMPANY_DATA.website;
        else if (l.includes("address")) mapping[f.selector] = COMPANY_DATA.address;
        else if (l.includes("city")) mapping[f.selector] = COMPANY_DATA.city;
        else if (l.includes("state")) mapping[f.selector] = COMPANY_DATA.state;
        else if (l.includes("zip") || l.includes("postal")) mapping[f.selector] = COMPANY_DATA.zip;
        else if (l.includes("description") || l.includes("about") || l.includes("message")) mapping[f.selector] = COMPANY_DATA.description;
        else if (l.includes("services") || l.includes("category") || l.includes("industry")) mapping[f.selector] = COMPANY_DATA.services;
      }
      log(`Fallback mapping: ${Object.keys(mapping).length}`);
    }

    let filled = 0, failed = 0;
    for (const [sel, val] of Object.entries(mapping)) {
      if (!val) continue;
      const fi = form.fields.find((f) => f.selector === sel);
      const lbl = fi?.label || fi?.placeholder || sel;
      try {
        const el = await page.$(sel).catch(() => null);
        if (!el) { failed++; continue; }
        const tag = await el.evaluate((e: Element) => e.tagName.toLowerCase()).catch(() => "");
        const ro = await el.evaluate((e: Element) => !!(e as HTMLInputElement).readOnly).catch(() => false);
        if (tag === "select" || ro) {
          await page.click(sel).catch(() => {});
          await page.waitForTimeout(400);
          await page.keyboard.type(val, { delay: 25 });
          await page.waitForTimeout(1200);
          await page.keyboard.press("Escape");
          filled++;
        } else if (tag === "input" || tag === "textarea") {
          await page.fill(sel, val);
          filled++;
        } else { failed++; continue; }
        log(`  ✓ "${lbl}"`);
      } catch { failed++; }
    }
    log(`Filled: ${filled}/${form.fields.length} (${failed} failed)`);

    await screenshotToFile(page, path.join(outDir, "presubmit.png"));

    // Submit
    const btnTexts = ["submit", "Submit", "Send", "Register", "Add Listing", "Claim", "continue", "Next", "Sign Up"];
    let clicked = false;
    for (const bt of btnTexts) {
      try {
        const btn = page.locator(`button:has-text("${bt}"), input[type=submit][value*="${bt}" i], a:has-text("${bt}")`).first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click({ timeout: 8000 });
          clicked = true;
          log(`Clicked submit: "${bt}"`);
          break;
        }
      } catch {}
    }
    if (!clicked) { log("No submit button found — NEEDS_MANUAL"); return { name, status: "NEEDS_MANUAL", error: "No submit button" }; }

    await page.waitForTimeout(6000);
    await screenshotToFile(page, path.join(outDir, "postsubmit.png"));

    const text = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "").catch(() => "");
    const success = SUCCESS_SIGNALS.some((s) => text.includes(s));
    const status = success ? "SUCCESS" : "NEEDS_MANUAL";
    log(`${status} — url=${page.url().slice(0, 90)}`);
    return { name, status, error: success ? null : "Submit clicked, waiting for review/verification" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log(`ERROR: ${msg.slice(0, 200)}`);
    return { name, status: "FAILED", error: msg.slice(0, 200) };
  } finally {
    if (ctx) try { await ctx.close(); } catch {}
    fs.writeFileSync(path.join(outDir, "quick-submit.log"), logs.join("\n"), "utf-8");
  }
}

async function main() {
  const args = process.argv.slice(2);
  const headed = args.includes("--headed");
  const onlyIdx = args.indexOf("--only");
  const names = onlyIdx >= 0 ? args[onlyIdx + 1].split(",").map((s) => s.trim()) : Object.keys(TARGETS);
  const results: { name: string; status: string; error: string | null }[] = [];
  for (const n of names) {
    const r = await quickSubmit(n, headed);
    if (r) results.push(r);
  }
  console.log("\n=== RESULTS ===");
  for (const r of results) console.log(`| ${r.name.padEnd(16)} | ${(r.status || "?").padEnd(12)} | ${r.error || ""} |`);
}

main().catch(console.error);
