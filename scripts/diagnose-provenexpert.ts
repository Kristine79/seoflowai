/**
 * PROVENEXPERT FILL DIAGNOSTIC
 *
 * Воспроизводит точную логику processPlatform() из human-submit.ts:
 * extractFormStructure -> mapFieldsWithAI -> fill цикл.
 *
 * Для каждого поля выводит: selector, label, type, mapped value,
 * DOM FOUND / VISIBLE / ENABLED / FILLABLE и точную ошибку.
 *
 * НЕ меняет никакой production-код. Только диагностика.
 *
 * Usage: npx tsx scripts/diagnose-provenexpert.ts
 */

import "dotenv/config";
import OpenAI from "openai";
import { launchStealthContext, stealthGoto, isCloudflareChallenge, screenshotToFile } from "../src/lib/automation/stealth";
import { extractFormStructure } from "../src/lib/automation/form-analyzer";
import { mapFieldsWithAI } from "../src/lib/automation/field-mapper";
import path from "path";

const REGISTRATION_EMAIL = "itllect.marketing@gmail.com";
const COMPANY_EMAIL = "info@itllect-agency.com";

function emailValueForLabel(label: string): string {
  const l = (label || "").toLowerCase();
  if (/business|company|contact|work|office|professional|public/.test(l)) return COMPANY_EMAIL;
  return REGISTRATION_EMAIL;
}

const COMPANY_DATA: Record<string, string> = {
  name: "ITllect",
  legalName: "ITllect LLC",
  website: "https://itllect-agency.com/",
  email: COMPANY_EMAIL,
  phone: "[REDACTED]",
  address: "[REDACTED]",
  city: "Plantation",
  state: "FL",
  zip: "33324",
  country: "US",
  firstName: "[REDACTED]",
  lastName: "[REDACTED]",
  position: "Founder & CEO",
  description: "ITllect is a Plantation, Florida-based digital marketing agency delivering data-driven SEO, PPC, and social media solutions that drive measurable growth for businesses of all sizes. Founded in 2015, ITllect combines creative expertise with data-driven strategies in SEO, paid advertising, social media management, web development, and content marketing, built on transparency and long-term client partnerships.",
  services: "SEO, PPC, Social Media Marketing, Web Development, Content Marketing, Brand Strategy",
  keywords: "digital marketing agency, SEO services, PPC management, social media marketing, web development, Fort Lauderdale marketing",
  category: "Digital Marketing Agency",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  timeout: 15000,
  maxRetries: 1,
});

const TARGET_URL = "https://www.provenexpert.com/en-us/register/";
const OUT_DIR = path.resolve("human-submit-out", "provenexpert", "diagnose");

async function main() {
  const logs: string[] = [];
  const log = (m: string) => { logs.push(m); console.log(m); };

  let ctx: any = null;
  try {
    ctx = await launchStealthContext({ profile: `human-provenexpert`, headless: false });
    const page = await ctx.newPage();

    log(`Navigating to ${TARGET_URL}...`);
    await stealthGoto(page, TARGET_URL, 60000);
    await page.waitForTimeout(3000);

    const isCF = await isCloudflareChallenge(page);
    if (isCF) {
      log("Cloudflare challenge present — waiting up to 60s for manual solve...");
      const start = Date.now();
      let cleared = false;
      while (Date.now() - start < 60000) {
        if (!(await isCloudflareChallenge(page))) { cleared = true; break; }
        await page.waitForTimeout(2000);
      }
      if (!cleared) { log("BLOCKED: Cloudflare not cleared"); return; }
      log("Cloudflare cleared ✓");
    }

    log(`Final URL: ${page.url()}`);

    // --- STEP 1: extractFormStructure (точная копия production-вызова) ---
    const formStructure = await extractFormStructure(page);
    log(`\n=== extractFormStructure: ${formStructure.fields.length} fields ===`);
    formStructure.fields.forEach((f, i) => {
      log(`  [${i}] type=${f.type} label="${f.label}" placeholder="${f.placeholder}" required=${f.required} selector="${f.selector}"`);
    });
    log(`  submitSelector=${formStructure.submitSelector} submitText=${formStructure.submitText}`);

    // --- STEP 2: AI mapping (точная копия) ---
    let fieldMapping: Record<string, string> = {};
    try {
      fieldMapping = await mapFieldsWithAI(openai, COMPANY_DATA, formStructure.fields);
      log(`\n=== AI mapping: ${Object.keys(fieldMapping).length} fields ===`);
      for (const [sel, val] of Object.entries(fieldMapping)) {
        log(`  ${sel}  =>  ${val ? JSON.stringify(val.slice(0, 60)) : "<EMPTY>"}`);
      }
    } catch (err) {
      log(`AI mapping threw: ${err instanceof Error ? err.message : String(err)}`);
    }

    // --- Email policy override (точная копия) ---
    for (const f of formStructure.fields) {
      const l = (f.label || f.placeholder || "").toLowerCase();
      if (l.includes("email") || l.includes("mail") || f.selector.includes("email") || f.selector.includes("mail")) {
        fieldMapping[f.selector] = emailValueForLabel(l);
      }
    }

    // --- STEP 3: fill цикл с диагностикой ---
    log(`\n=== FILL DIAGNOSTIC (${Object.keys(fieldMapping).length} mapped entries) ===`);
    let filled = 0, failed = 0, skippedEmpty = 0;

    for (const [sel, val] of Object.entries(fieldMapping)) {
      const fi = formStructure.fields.find((f) => f.selector === sel);
      const lbl = fi?.label || fi?.placeholder || sel;

      if (!val) {
        skippedEmpty++;
        log(`\nFIELD: ${lbl}`);
        log(`  mapped value: <EMPTY> — SKIPPED (continue)`);
        continue;
      }

      log(`\nFIELD: ${lbl}`);
      log(`  mapped value: ${JSON.stringify(val.slice(0, 80))}`);
      log(`  selector: ${sel}`);
      log(`  type: ${fi?.type}`);

      try {
        const el = await page.$(sel).catch(() => null);
        if (!el) {
          failed++;
          log(`  DOM FOUND: NO`);
          log(`  reason: selector not found in current DOM (querySelector returns null)`);
          // Сколько элементов реально матчит селектор в DOM (без CSS.escape склейки)
          const matchCount = await page.evaluate((s) => {
            try { return document.querySelectorAll(s).length; } catch (e) { return -1; }
          }, sel).catch(() => -1);
          log(`  querySelectorAll("${sel}") count: ${matchCount}`);
          continue;
        }
        log(`  DOM FOUND: YES (1 element matched)`);

        const diag = await el.evaluate((e: Element) => {
          const rect = e.getBoundingClientRect();
          const style = window.getComputedStyle(e);
          const htmlEl = e as HTMLElement;
          const inputEl = e as HTMLInputElement;
          return {
            tag: e.tagName.toLowerCase(),
            type: (e as HTMLInputElement).type || null,
            id: (e as HTMLElement).id || null,
            name: (e as HTMLInputElement).name || null,
            placeholder: (e as HTMLInputElement).placeholder || null,
            value: (e as HTMLInputElement).value || null,
            ariaLabel: e.getAttribute("aria-label"),
            role: e.getAttribute("role"),
            visible: rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden",
            rectW: Math.round(rect.width),
            rectH: Math.round(rect.height),
            display: style.display,
            visibility: style.visibility,
            offsetParentNull: htmlEl.offsetParent === null,
            disabled: inputEl.disabled,
            readOnly: inputEl.readOnly,
            ariaDisabled: e.getAttribute("aria-disabled"),
            tabIndex: e.getAttribute("tabindex"),
            contentEditable: (e as HTMLElement).isContentEditable,
            classes: (e as HTMLElement).className || null,
          };
        }).catch((e) => ({ evalError: String(e) }));

        log(`  DOM diagnostics: ${JSON.stringify(diag)}`);

        const tag = await el.evaluate((e: Element) => e.tagName.toLowerCase()).catch(() => "");
        const ro = await el.evaluate((e: Element) => !!(e as HTMLInputElement).readOnly).catch(() => false);

        if (tag === "select" || ro) {
          log(`  FILLABLE: NO (tag=${tag}, readOnly=${ro}) — requires custom select handling`);
          try {
            await page.click(sel).catch(() => {});
            await page.waitForTimeout(300);
            await page.keyboard.type(val, { delay: 20 });
            await page.waitForTimeout(1000);
            await page.keyboard.press("Escape");
            log(`  custom-select path executed (click + type)`);
            filled++;
            log(`  RESULT: FILLED via select path`);
          } catch (err) {
            failed++;
            log(`  RESULT: FAILED — ${err instanceof Error ? err.message : String(err)}`);
          }
          continue;
        }

        if (tag !== "input" && tag !== "textarea") {
          failed++;
          log(`  FILLABLE: NO (tag=${tag} — not input/textarea)`);
          log(`  reason: element is ${tag}, not fillable input`);
          continue;
        }

        try {
          await page.fill(sel, val);
          filled++;
          log(`  FILLABLE: YES — page.fill(${sel}, ${JSON.stringify(val.slice(0, 40))}...) succeeded`);
          log(`  RESULT: FILLED ✓`);
        } catch (err) {
          failed++;
          const msg = err instanceof Error ? err.message : String(err);
          log(`  FILLABLE: NO — page.fill threw`);
          log(`  EXACT ERROR: ${msg.slice(0, 300)}`);
          log(`  RESULT: FAILED ✗`);
        }
      } catch (err) {
        failed++;
        log(`  OUTER ERROR: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    log(`\n=== SUMMARY ===`);
    log(`Total mapped: ${Object.keys(fieldMapping).length}`);
    log(`Filled: ${filled}`);
    log(`Failed: ${failed}`);
    log(`Skipped (empty value): ${skippedEmpty}`);

    // --- STEP 4: фактический DOM-снапшот всех input/select/textarea ---
    log(`\n=== ACTUAL DOM: all input/select/textarea on page ===`);
    const allControls = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("input, select, textarea"));
      return els.map((e, i) => {
        const inputEl = e as HTMLInputElement;
        const rect = e.getBoundingClientRect();
        const style = window.getComputedStyle(e);
        const formId = e.closest("form") ? "in-form" : "NO-FORM";
        return {
          i,
          tag: e.tagName.toLowerCase(),
          type: inputEl.type || null,
          name: inputEl.name || null,
          id: e.id || null,
          placeholder: inputEl.placeholder || null,
          visible: rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden",
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          disabled: inputEl.disabled,
          readOnly: inputEl.readOnly,
          role: e.getAttribute("role"),
          formId,
          cls: (e.className || "").slice(0, 40),
        };
      });
    }).catch((e) => ({ error: String(e) }));

    if (Array.isArray(allControls)) {
      for (const c of allControls) {
        log(`  [${c.i}] <${c.tag}${c.type ? " type=" + c.type : ""}> name=${c.name || "-"} id=${c.id || "-"} ph="${c.placeholder || ""}" visible=${c.visible} (${c.w}x${c.h}) ro=${c.readOnly} dis=${c.disabled} ${c.formId} class="${c.cls}"`);
      }
    } else {
      log(`  evaluate failed: ${JSON.stringify(allControls)}`);
    }

    await screenshotToFile(page, path.join(OUT_DIR, "diagnose-dom.png"));
    log(`\nScreenshot saved: ${path.join(OUT_DIR, "diagnose-dom.png")}`);

    await page.waitForTimeout(2000);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`FATAL: ${msg}`);
    if (err instanceof Error && err.stack) log(`STACK: ${err.stack.slice(0, 300)}`);
  } finally {
    if (ctx) {
      try { await ctx.close(); } catch {}
    }
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
