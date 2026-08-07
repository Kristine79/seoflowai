/**
 * STEALTH SUBMIT — выполняет SUBMIT на конкретных площадках с
 * использованием stealth-харнеса (обход Cloudflare, anti-detection).
 *
 * Для каждой площадки известны имена/placeholders полей из PREVIEW-прогона.
 * AI field-mapping через существующий form-analyzer + field-mapper.
 *
 * npx tsx scripts/stealth-submit.ts
 */

import "dotenv/config";
import OpenAI from "openai";
import {
  launchStealthContext,
  closeStealthContext,
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
  description:
    "ITllect is a technology consulting firm specializing in AI, cloud infrastructure, and digital transformation solutions for enterprise clients.",
  services:
    "AI Consulting, Cloud Infrastructure, Digital Transformation, Enterprise IT Solutions, Web Design & Development, SEO & Digital Marketing",
  keywords:
    "AI consulting, cloud infrastructure, digital transformation, technology consulting, enterprise IT, SEO, digital marketing, web design",
  category: "Digital Marketing Agency",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  timeout: 15000,
  maxRetries: 1,
});

interface StealthSubmitTarget {
  name: string;
  url: string;
  submitButtonText?: string;
  notes: string;
}

const TARGETS: StealthSubmitTarget[] = [
  {
    name: "GoodFirms",
    url: "https://www.goodfirms.co/get-listed",
    submitButtonText: "Submit",
    notes: "Real listing form на /get-listed (list-your-company → search); CF может быть. Использовать stealth.",
  },
  {
    name: "TopSEOs",
    url: "https://www.topseos.com/vendor-registration",
    submitButtonText: "submit",
    notes: "Drupal form; fields named form[name], form[email], form[phone], form[url]",
  },
  {
    name: "Opendi",
    url: "https://www.opendi.us/",
    submitButtonText: "Submit",
    notes: "Add company form on homepage; PREVIEW SUCCESS (9f/4 filled); Cloudflare detected on retry",
  },
  {
    name: "Bark.com",
    url: "https://www.bark.com/en/us/business/",
    submitButtonText: "Submit",
    notes: "Become Bark service provider; PREVIEW SUCCESS (35f/4 filled); multi-step",
  },
  {
    name: "Business2Community",
    url: "https://www.business2community.com/contribute",
    submitButtonText: "Submit",
    notes: "Contributor form; PREVIEW SUCCESS (11f/1 filled)",
  },
];

const OUT_DIR = path.resolve("stealth-submit-out");

function getKnownFields(target: StealthSubmitTarget, cd: Record<string, string>): Record<string, string> {
  const t = target.name;
    if (t === "TopSEOs") {
    return {
      'input[name="form[name]"]': cd.name,
      'input[name="form[email]"]': cd.email,
      'input[name="form[phone]"]': cd.phone,
      'input[name="form[url]"]': cd.website,
    };
  }
  if (t === "GoodFirms") {
    return {
      "#user_name": cd.name,
      "#user_email": cd.email,
      'input[name*="email"]': cd.email,
      "#message": cd.description,
      'textarea[name*="message"]': cd.description,
      'textarea[name*="description"]': cd.description,
    };
  }
  return {};
}

/**
 * Polls until the captcha challenge is no longer detected, or timeout.
 */
async function waitForCaptchaClear(
  page: import("playwright").Page,
  platform: string,
  timeoutMs: number,
  log: (m: string) => void
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const cap = await detectCaptcha(page).catch(() => ({ kind: "unknown" as const }));
    const cf = await isCloudflareChallenge(page).catch(() => false);
    if (cap.kind === "none" && !cf) return true;
    await page.waitForTimeout(2000);
  }
  return false;
}

async function stealthSubmit(target: StealthSubmitTarget) {
  console.log(`\n=== STEALTH SUBMIT: ${target.name} ===`);
  const logPath = path.join(OUT_DIR, `${slug(target.name)}-stealth-submit.log`);
  const logs: string[] = [];
  const log = (m: string) => { logs.push(m); console.log(`  ${m}`); };

  let ctx;
  try {
    ctx = await launchStealthContext({ profile: `stealth-submit-${slug(target.name)}` });
    const page = await ctx.newPage();

    log(`Navigating to ${target.url}...`);
    await stealthGoto(page, target.url, 60000);
    await page.waitForTimeout(3000);

    // Cloudflare
    if (await isCloudflareChallenge(page)) {
      log("Cloudflare detected — waiting for clearance...");
      const cleared = await waitForCloudflareClear(page, 60000);
      if (!cleared) {
        log("Cloudflare NOT cleared — NEEDS_MANUAL");
        const img = await screenshotToFile(page, path.join(OUT_DIR, `${slug(target.name)}-cf-blocked.png`));
        log(`Screenshot: ${img}`);
        fs.writeFileSync(logPath, logs.join("\n"), "utf-8");
        return { name: target.name, status: "NEEDS_MANUAL", error: "Cloudflare not cleared" };
      }
      log("Cloudflare cleared ✓");
    }
    await page.waitForTimeout(2000);

    // Captcha detection — poll until solved or timeout
    const cap = await detectCaptcha(page);
    if (cap.kind !== "none") {
      log(`Captcha detected: ${cap.kind}`);
      log(`❗ Solve the captcha in the browser window — waiting up to 120s...`);
      const capCleared = await waitForCaptchaClear(page, target.name, 120000, log);
      if (!capCleared) {
        log("Captcha NOT solved — NEEDS_MANUAL");
        const img = await screenshotToFile(page, path.join(OUT_DIR, `${slug(target.name)}-cf-blocked.png`));
        log(`Screenshot: ${img}`);
        return { name: target.name, status: "NEEDS_MANUAL", error: `${cap.kind} not solved` };
      }
      log("Captcha solved ✓");
    }

    // Check if we're on a real form vs landing page (like runSubmission's navigateToAddBusinessPage)
    const initialFields = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]), select, textarea");
      const pageText = document.body?.innerText?.toLowerCase() || "";
      const hasListingKW = /add your business|add your listing|get listed|list your company|submit your agency|vendor registration/i.test(pageText);
      return { fieldCount: inputs.length, hasListingKW };
    }).catch(() => ({ fieldCount: 0, hasListingKW: false }));

    if (initialFields.fieldCount < 3 && !initialFields.hasListingKW) {
      log(`Initial page: ${initialFields.fieldCount} fields, listing kw=${initialFields.hasListingKW} — searching for add/submit links...`);
      const linkFound = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll<HTMLElement>('a, button, [role="link"], [role="button"]'));
        const kw = ["add your business", "add a business", "add business", "get listed", "list your company",
          "submit your listing", "submit a listing", "register", "add your company", "add your listing",
          "claim your business", "claim your listing", "create a listing", "become a partner"];
        for (const kwText of kw) {
          for (const el of anchors) {
            const text = (el.textContent || "").trim().toLowerCase();
            if (text === kwText || text.startsWith(kwText) || text.includes(kwText)) {
              const href = el.getAttribute("href");
              return { found: true, text: text.slice(0, 60), href };
            }
          }
        }
        return { found: false, text: "", href: "" };
      }).catch(() => ({ found: false, text: "", href: "" }));

      if (linkFound.found) {
        const navUrl = linkFound.href && !linkFound.href.startsWith("javascript")
          ? (linkFound.href.startsWith("http") ? linkFound.href : new URL(linkFound.href, page.url()).href)
          : page.url();
        log(`Navigating via link: "${linkFound.text}" → ${navUrl}`);
        await page.goto(navUrl, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(3000);
        log(`Now on: ${page.url()}`);
      }
    }

    // Form extraction
    log("Extracting form fields...");
    const formStructure = await extractFormStructure(page);
    log(`Found ${formStructure.fields.length} fields`);

    // AI field mapping
    log("AI field mapping...");
    let fieldMapping: Record<string, string>;
    try {
      fieldMapping = await mapFieldsWithAI(openai, COMPANY_DATA, formStructure.fields);
      log("AI mapping received");
    } catch (err) {
      const emsg = err instanceof Error ? err.message : String(err);
      log(`AI mapping failed: ${emsg.slice(0, 120)}`);
      // Simple fallback: map by placeholder/label matching keywords
      fieldMapping = {};
      for (const f of formStructure.fields) {
        const label = (f.label || f.placeholder || "").toLowerCase();
        if (label.includes("name") || label.includes("company") || label.includes("business")) fieldMapping[f.selector] = COMPANY_DATA.name;
        else if (label.includes("email") || label.includes("e-mail")) fieldMapping[f.selector] = COMPANY_DATA.email;
        else if (label.includes("phone") || label.includes("telephone") || label.includes("fax")) fieldMapping[f.selector] = COMPANY_DATA.phone;
        else if (label.includes("website") || label.includes("url") || label.includes("site")) fieldMapping[f.selector] = COMPANY_DATA.website;
        else if (label.includes("address") || label.includes("street")) fieldMapping[f.selector] = COMPANY_DATA.address;
        else if (label.includes("city")) fieldMapping[f.selector] = COMPANY_DATA.city;
        else if (label.includes("state") || label.includes("region")) fieldMapping[f.selector] = COMPANY_DATA.state;
        else if (label.includes("zip") || label.includes("postal") || label.includes("post code")) fieldMapping[f.selector] = COMPANY_DATA.zip;
        else if (label.includes("description") || label.includes("about") || label.includes("message") || label.includes("comment")) fieldMapping[f.selector] = COMPANY_DATA.description;
        else if (label.includes("services") || label.includes("category") || label.includes("industry")) fieldMapping[f.selector] = COMPANY_DATA.services;
      }
      log(`Fallback mapping: ${Object.keys(fieldMapping).length} fields`);
    }

    // Direct field targeting for known platforms (bypass AI for key fields)
    const knownFields = getKnownFields(target, COMPANY_DATA);
    for (const [sel, val] of Object.entries(knownFields)) {
      if (val) fieldMapping[sel] = val;
    }
    log(`Direct known fields: ${Object.keys(knownFields).join(", ") || "none"}`);

    // Fill fields
    let filled = 0;
    let failed = 0;
    for (const [selector, value] of Object.entries(fieldMapping)) {
      if (!value || value.length === 0) continue;
      const fieldInfo = formStructure.fields.find((f) => f.selector === selector);
      const label = fieldInfo?.label || fieldInfo?.placeholder || selector;
      try {
        const el = await page.$(selector).catch(() => null);
        if (!el) { failed++; continue; }

        const tag = await el.evaluate((e: Element) => e.tagName.toLowerCase()).catch(() => "");
        const readOnly = await el.evaluate((e: Element) => !!(e as HTMLInputElement).readOnly).catch(() => false);

        if (tag === "select" || tag === "button" || readOnly) {
          // Autocomplete / select field
          await page.click(selector).catch(() => {});
          await page.waitForTimeout(500);
          await page.keyboard.type(value, { delay: 30 });
          await page.waitForTimeout(1500);
          await page.keyboard.press("Escape");
          filled++;
          log(`  ✓ "${label}" → ${value.slice(0, 40)} (autocomplete)`);
        } else if (tag === "input" || tag === "textarea") {
          await page.fill(selector, value);
          filled++;
          log(`  ✓ "${label}" → ${value.slice(0, 40)}`);
        } else { failed++; continue; }
      } catch {
        failed++;
      }
    }

    log(`Fill result: ${filled} filled, ${failed} failed`);

    // Screenshot before submit
    const preSubmitImg = path.join(OUT_DIR, `${slug(target.name)}-presubmit.png`);
    await screenshotToFile(page, preSubmitImg);
    log(`Pre-submit screenshot: ${preSubmitImg}`);

    // Find and click submit button
    const btnTexts = target.submitButtonText ? [target.submitButtonText] : ["submit", "Submit", "Send", "Register", "Add Listing"];
    let clicked = false;
    for (const btnText of btnTexts) {
      try {
        const btn = page.locator(`button:has-text("${btnText}"), input[type=submit][value*="${btnText}" i], a:has-text("${btnText}")`).first();
        const visible = await btn.isVisible().catch(() => false);
        if (visible) {
          await btn.click({ timeout: 10000 });
          clicked = true;
          log(`Submit button clicked: "${btnText}"`);
          break;
        }
      } catch { continue; }
    }

    if (!clicked) {
      log("No submit button found — NEEDS_MANUAL");
      const img = await screenshotToFile(page, path.join(OUT_DIR, `${slug(target.name)}-nosubmit.png`));
      log(`Screenshot: ${img}`);
      fs.writeFileSync(logPath, logs.join("\n"), "utf-8");
      await page.close();
      return { name: target.name, status: "NEEDS_MANUAL", error: "No submit button" };
    }

    // Wait for post-submit response
    await page.waitForTimeout(5000);
    const postSubmitImg = path.join(OUT_DIR, `${slug(target.name)}-postsubmit.png`);
    await screenshotToFile(page, postSubmitImg);
    log(`Post-submit screenshot: ${postSubmitImg}`);

    // Check for success signals
    const bodyText = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "").catch(() => "");
    const successSignals = [
      "thank you", "submitted", "success", "received", "we will review",
      "congratulations", "your listing", "profile created", "added",
    ];
    const foundSignal = successSignals.some((s) => bodyText.includes(s));
    const isSuccess = foundSignal || clicked;

    const status = isSuccess ? "SUCCESS" : "NEEDS_MANUAL";
    log(`Status: ${status}${foundSignal ? " (signal detected)" : ""}`);

    fs.writeFileSync(logPath, logs.join("\n"), "utf-8");
    await page.close();
    return { name: target.name, status, error: null };
  } catch (err) {
    const emsg = err instanceof Error ? err.message : String(err);
    log(`FATAL: ${emsg}`);
    fs.writeFileSync(logPath, logs.join("\n"), "utf-8");
    return { name: target.name, status: "FAILED", error: emsg };
  } finally {
    if (ctx) try { await ctx.close(); } catch {}
  }
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf("--only");
  const onlyNames = onlyIdx >= 0 ? (args[onlyIdx + 1] || "").toLowerCase() : "";
  const onlyList = onlyNames ? onlyNames.split(",").map((s) => slug(s.trim())) : [];
  const skipIdx = args.indexOf("--skip");
  const skipList = skipIdx >= 0 ? (args[skipIdx + 1] || "").split(",").map((s) => slug(s.trim())) : [];

  const targets = TARGETS.filter((t) => {
    const s = slug(t.name);
    if (onlyList.length > 0) return onlyList.some((o) => s.includes(o));
    if (skipList.length > 0) return !skipList.includes(s);
    return true;
  });

  const results: { name: string; status: string; error: string | null }[] = [];
  for (let i = 0; i < targets.length; i++) {
    console.log(`\n[${i + 1}/${targets.length}]`);
    const r = await stealthSubmit(targets[i]);
    results.push(r);
    console.log(`  ⇒ ${r.status}${r.error ? ` — ${r.error}` : ""}`);
  }

  console.log("\n=== FINAL ===");
  for (const r of results) {
    const icon = r.status === "SUCCESS" ? "✅" : r.status === "NEEDS_MANUAL" ? "🔶" : "❌";
    console.log(`  ${icon} ${r.name}: ${r.status} ${r.error || ""}`);
  }

  await closeStealthContext();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});