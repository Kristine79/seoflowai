/**
 * HUMAN ASSISTED SUBMISSION + AUTO-REGISTER
 *
 * Headed browser для площадок со статусами NOT_STARTED / FORM_READY / NEEDS_MANUAL.
 * С --register: автоматически регистрируется через IMAP-верификацию email.
 * Без --register: ждёт ручного действия (таймаут 180s).
 *
 * Площадки со статусами SUBMITTED / REGISTERED / PENDING_* / VERIFIED_SUCCESS /
 * BLOCKED / FAILED / NOT_APPLICABLE в повторный запуск НЕ попадают.
 *
 * Использование:
 *   npx tsx scripts/human-submit.ts --queue                       # показать очередь
 *   npx tsx scripts/human-submit.ts --run                         # ручной режим
 *   npx tsx scripts/human-submit.ts --run --register              # авто-регистрация
 *   npx tsx scripts/human-submit.ts --run --register --only GoodFirms,TopSEOs
 *   npx tsx scripts/human-submit.ts --run --priority 1
 */

import "dotenv/config";
import OpenAI from "openai";
import {
  launchStealthContext,
  closeStealthContext,
  stealthGoto,
  isCloudflareChallenge,
  detectCaptcha,
  screenshotToFile,
} from "../src/lib/automation/stealth";
import { waitForVerificationLink } from "../src/lib/automation/email-verifier";
import { extractFormStructure } from "../src/lib/automation/form-analyzer";
import { mapFieldsWithAI } from "../src/lib/automation/field-mapper";
import fs from "fs";
import path from "path";

const REGISTRATION_EMAIL = "itllect.marketing@gmail.com";

const COMPANY_DATA: Record<string, string> = {
  name: "ITllect",
  legalName: "ITllect LLC",
  website: "https://itllect-agency.com/",
  email: "info@itllect-agency.com",
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

interface QueueEntry {
  name: string;
  url: string;
  submissionUrl: string;
  type: string;
  priority: number;
  previewStatus: string | null;
  previewFields: number;
  previewFilled: number;
  humanAction: string;
  notes: string;
  status:
    | "NOT_STARTED"
    | "FORM_READY"
    | "REGISTERED"
    | "SUBMITTED"
    | "PENDING_VERIFICATION"
    | "PENDING_MODERATION"
    | "VERIFIED_SUCCESS"
    | "BLOCKED"
    | "FAILED"
    | "NOT_APPLICABLE"
    | "NEEDS_MANUAL";
  result: string | null;
}

const QUEUE_FILE = path.resolve("human-queue.json");
const OUT_DIR = path.resolve("human-submit-out");

const SUCCESS_SIGNALS = [
  "thank you", "submitted", "success", "received", "we will review",
  "congratulations", "your listing", "profile created", "added",
  "your submission", "has been sent", "we appreciate",
];

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function loadQueue(): QueueEntry[] {
  return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
}

function saveQueue(queue: QueueEntry[]) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), "utf-8");
}

async function checkSuccess(page: import("playwright").Page, initialUrl: string): Promise<boolean> {
  try {
    const url = page.url();
    if (url !== initialUrl && !url.includes("error") && !url.includes("chrome-error")) return true;
    const text = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");
    return SUCCESS_SIGNALS.some((s) => text.includes(s));
  } catch { return false; }
}

async function pollForSuccess(
  page: import("playwright").Page,
  initialUrl: string,
  timeoutMs: number,
  log: (m: string) => void
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkSuccess(page, initialUrl)) return true;
    await page.waitForTimeout(3000);
  }
  return false;
}

async function waitForChallengeClear(
  page: import("playwright").Page,
  label: string,
  timeoutMs: number,
  check: () => Promise<boolean>,
  log: (m: string) => void
): Promise<boolean> {
  log(`⏳ ${label} — waiting up to ${(timeoutMs / 1000).toFixed(0)}s for manual solve...`);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await check().catch(() => false);
    if (ok) return true;
    await page.waitForTimeout(2000);
  }
  return false;
}

/**
 * Override email fields in the current page to use REGISTRATION_EMAIL.
 */
async function overrideEmailToRegistration(page: import("playwright").Page, log: (m: string) => void) {
  const emailFields = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input[type=email], input[name*='email'], input[name*='mail'], input[id*='email'], input[id*='mail'], input[placeholder*='email' i], input[placeholder*='mail' i]"));
    return inputs.map((el) => {
      const id = el.id || "";
      const name = el.name || "";
      return { id, name, selector: `#${CSS.escape(id)}`, nameSelector: `input[name="${CSS.escape(name)}"]` };
    });
  }).catch(() => []);

  for (const f of emailFields) {
    const sel = f.id ? f.selector : f.nameSelector;
    if (sel && sel.length > 3) {
      try {
        await page.fill(sel, REGISTRATION_EMAIL);
        log(`  Email overridden → ${REGISTRATION_EMAIL}`);
      } catch {}
    }
  }
}

/**
 * AUTO-REGISTER: заполняет форму → Sign Up → ждёт verification email → открывает ссылку.
 */
async function autoRegister(
  page: import("playwright").Page,
  name: string,
  log: (m: string) => void
): Promise<boolean> {
  log("Auto-register mode: overriding email fields to registration email...");
  await overrideEmailToRegistration(page, log);

  // Если форма требует пароль — заполняем сгенерированным (логируем, чтобы позже войти)
  const generatedPassword = `Itllect${Math.random().toString(36).slice(2, 8)}!`;
  try {
    const pwdField = page.locator('input[type="password"]').first();
    if (await pwdField.isVisible({ timeout: 3000 }).catch(() => false)) {
      const cur = await pwdField.inputValue().catch(() => "");
      if (!cur) {
        await pwdField.fill(generatedPassword);
        log(`Password set for ${name}: ${generatedPassword}`);
      }
    }
  } catch {}

  log("Looking for sign-up/register button...");
  const registerKW = ["sign up", "register", "create new account", "create account", "get started", "join", "signup"];
  let foundBtn = false;
  for (const kw of registerKW) {
    try {
      // Приоритет: submit-кнопки формы перед ссылками (иначе кликается шапка сайта)
      const btn = page.locator(
        `input[type="submit"][value*="${kw}" i], button[type="submit"]:has-text("${kw}"), button:has-text("${kw}"), input[value*="${kw}" i], a:has-text("${kw}")`
      ).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ timeout: 10000 });
        foundBtn = true;
        log(`Clicked "${kw}" button`);
        break;
      }
    } catch {}
  }

  if (!foundBtn) {
    log("No register button found — continuing in manual mode");
    return false;
  }

  await page.waitForTimeout(5000);

  // Wait for verification email (up to 120s)
  log("Waiting for verification email...");
  const verifyUrl = await waitForVerificationLink(name, "verify|confirm|activate|welcome", 120000);

  if (verifyUrl) {
    log(`Verification link found: ${verifyUrl.slice(0, 80)}...`);
    await page.goto(verifyUrl, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    log("Email verified ✓");
    return true;
  }

  log("No verification email received — needs manual check");
  return false;
}

async function processPlatform(entry: QueueEntry, autoReg = false): Promise<{ status: string; error: string | null }> {
  const name = entry.name;
  const targetUrl = entry.submissionUrl || entry.url;
  const logDir = path.join(OUT_DIR, slug(name));
  fs.mkdirSync(logDir, { recursive: true });

  const logs: string[] = [];
  const log = (m: string) => { logs.push(m); console.log(`  ${m}`); };
  const logFile = path.join(logDir, "human-submit.log");

  console.log(`\n${"=".repeat(70)}`);
  console.log(`  ${name}`);
  console.log(`  ${targetUrl}`);
  console.log(`  Action: ${entry.humanAction}`);
  console.log(`  ${entry.notes}`);
  console.log(`${"=".repeat(70)}`);

  let ctx: any = null;
  try {
    ctx = await launchStealthContext({ profile: `human-${slug(name)}`, headless: false });
    const page = await ctx.newPage();

    log(`Navigating...`);
    await stealthGoto(page, targetUrl, 60000);
    await page.waitForTimeout(3000);

    // Cloudflare
    const isCF = await isCloudflareChallenge(page);
    if (isCF) {
      const cfCleared = await waitForChallengeClear(page, "Cloudflare challenge", 120000,
        async () => !(await isCloudflareChallenge(page)), log);
      if (!cfCleared) {
        await screenshotToFile(page, path.join(logDir, "cf-blocked.png"));
        log("Cloudflare NOT cleared — NEEDS_MANUAL");
        return { status: "NEEDS_MANUAL", error: "Cloudflare not solved in 120s" };
      }
      log("Cloudflare cleared ✓");
    }

    // Captcha
    const cap = await detectCaptcha(page);
    if (cap.kind !== "none") {
      const capCleared = await waitForChallengeClear(page, `Captcha (${cap.kind})`, 180000,
        async () => (await detectCaptcha(page)).kind === "none", log);
      if (capCleared) log("Captcha solved ✓");
      else log(`Captcha may still be present — continuing`);
    }

    // Form extraction
    log("Extracting form...");
    const formStructure = await extractFormStructure(page);
    log(`Fields: ${formStructure.fields.length}`);

    // AI field mapping
    let fieldMapping: Record<string, string> = {};
    if (formStructure.fields.length > 0) {
      try {
        fieldMapping = await mapFieldsWithAI(openai, COMPANY_DATA, formStructure.fields);
        log(`AI mapping: ${Object.keys(fieldMapping).length} fields`);
      } catch (err) {
        const emsg = err instanceof Error ? err.message : String(err);
        log(`AI failed: ${emsg.slice(0, 100)}`);
        for (const f of formStructure.fields) {
          const l = (f.label || f.placeholder || "").toLowerCase();
          if (l.includes("name") || l.includes("company")) fieldMapping[f.selector] = COMPANY_DATA.name;
          else if (l.includes("email")) fieldMapping[f.selector] = COMPANY_DATA.email;
          else if (l.includes("phone")) fieldMapping[f.selector] = COMPANY_DATA.phone;
          else if (l.includes("website") || l.includes("url")) fieldMapping[f.selector] = COMPANY_DATA.website;
          else if (l.includes("address")) fieldMapping[f.selector] = COMPANY_DATA.address;
          else if (l.includes("city")) fieldMapping[f.selector] = COMPANY_DATA.city;
          else if (l.includes("state")) fieldMapping[f.selector] = COMPANY_DATA.state;
          else if (l.includes("zip")) fieldMapping[f.selector] = COMPANY_DATA.zip;
          else if (l.includes("description") || l.includes("about") || l.includes("message")) fieldMapping[f.selector] = COMPANY_DATA.description;
          else if (l.includes("services") || l.includes("category")) fieldMapping[f.selector] = COMPANY_DATA.services;
        }
        log(`Fallback: ${Object.keys(fieldMapping).length} fields`);
      }

      // Fill
      let filled = 0, failed = 0;
      for (const [sel, val] of Object.entries(fieldMapping)) {
        if (!val) continue;
        const fi = formStructure.fields.find((f) => f.selector === sel);
        const lbl = fi?.label || fi?.placeholder || sel;
        try {
          const el = await page.$(sel).catch(() => null);
          if (!el) { failed++; continue; }
          const tag = await el.evaluate((e: Element) => e.tagName.toLowerCase()).catch(() => "");
          const ro = await el.evaluate((e: Element) => !!(e as HTMLInputElement).readOnly).catch(() => false);
          if (tag === "select" || ro) {
            await page.click(sel).catch(() => {});
            await page.waitForTimeout(300);
            await page.keyboard.type(val, { delay: 20 });
            await page.waitForTimeout(1000);
            await page.keyboard.press("Escape");
            filled++;
          } else if (tag === "input" || tag === "textarea") {
            await page.fill(sel, val);
            filled++;
          } else { failed++; continue; }
        } catch { failed++; }
      }
      log(`Filled: ${filled}/${formStructure.fields.length} (${failed} failed)`);
    }

    // Pre-submit screenshot
    await screenshotToFile(page, path.join(logDir, "presubmit.png"));
    log(`Pre-submit screenshot saved`);

    // Auto-register (if --register flag enabled and action includes register)
    if (autoReg && (entry.humanAction.includes("register") || entry.humanAction.includes("login"))) {
      log("--register mode: attempting auto-registration...");
      const registered = await autoRegister(page, entry.name, log);
      if (registered) {
        // Re-extract and fill profile form after verification
        log("Re-extracting form after verification...");
        await page.waitForTimeout(3000);
        const postRegForm = await extractFormStructure(page);
        if (postRegForm.fields.length > 3) {
          log(`Post-verification form: ${postRegForm.fields.length} fields`);
          let pm: Record<string, string> = {};
          try { pm = await mapFieldsWithAI(openai, COMPANY_DATA, postRegForm.fields); } catch { }
          for (const [sel, val] of Object.entries(pm)) {
            if (!val) continue;
            try {
              const el = await page.$(sel).catch(() => null);
              if (el) { await page.fill(sel, val); }
            } catch {}
          }
          log("Post-verification fields filled");
          await screenshotToFile(page, path.join(logDir, "postreg-filled.png"));
        }
      }
    }

    // HUMAN: verify + submit (180s timeout)
    const initialUrl = page.url();
    log(`\n  ┏━━━ HUMAN ACTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`);
    log(`  ┃ 1. Solve captcha/Cloudflare (if still present) ┃`);
    log(`  ┃ 2. Verify filled fields                        ┃`);
    log(`  ┃ 3. Complete missing fields                     ┃`);
    log(`  ┃ 4. Click Submit/Register                       ┃`);
    log(`  ┃ 5. Wait for success page                       ┃`);
    log(`  ┃                                                ┃`);
    log(`  ┃ You have 180 seconds ⏱                         ┃`);
    log(`  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`);

    const success = await pollForSuccess(page, initialUrl, 180000, log);

    await page.waitForTimeout(2000);
    await screenshotToFile(page, path.join(logDir, "postsubmit.png"));
    log(`Post-submit screenshot saved`);

    if (success) {
      log("✓ SUCCESS — submission confirmed!");
      return { status: "SUCCESS", error: null };
    }

    log("? Not confirmed in 180s — NEEDS_MANUAL");
    return { status: "NEEDS_MANUAL", error: "Human action timeout (180s)" };

  } catch (err) {
    const emsg = err instanceof Error ? err.message : String(err);
    log(`FATAL: ${emsg}`);
    return { status: "FAILED", error: emsg };
  } finally {
    if (ctx) try { await ctx.close(); } catch {}
    fs.writeFileSync(logFile, logs.join("\n"), "utf-8");
  }
}

async function main() {
  const args = process.argv.slice(2);
  const runFlag = args.includes("--run");
  const autoReg = args.includes("--register");
  const onlyIdx = args.indexOf("--only");
  const priorityIdx = args.indexOf("--priority");

  const queue = loadQueue();

  if (!runFlag) {
    console.log("=== HUMAN ASSISTED SUBMISSION QUEUE ===\n");
    for (const status of ["NOT_STARTED", "FORM_READY", "NEEDS_MANUAL", "SUBMITTED", "REGISTERED", "PENDING_VERIFICATION", "PENDING_MODERATION", "VERIFIED_SUCCESS", "BLOCKED", "FAILED", "NOT_APPLICABLE"]) {
      const entries = queue.filter((e) => e.status === status);
      if (entries.length === 0) continue;
      console.log(`${status} (${entries.length}):`);
      for (const e of entries) {
        const p = (e.status === "NOT_STARTED" || e.status === "FORM_READY" || e.status === "NEEDS_MANUAL") ? ` [P${e.priority}]` : "";
        console.log(`  ${e.name.padEnd(28)} ${e.humanAction.padEnd(35)}${p}`);
      }
    }
    console.log(`\nRun: npx tsx scripts/human-submit.ts --run [--only X,Y] [--priority N]`);
    return;
  }

  let targetQueue = queue.filter((e) => e.status === "NOT_STARTED" || e.status === "FORM_READY" || e.status === "NEEDS_MANUAL");

  if (onlyIdx >= 0) {
    const onlyNames = (args[onlyIdx + 1] || "").split(",").map((s) => slug(s.trim()));
    targetQueue = targetQueue.filter((e) => onlyNames.some((o) => slug(e.name).includes(o)));
  }
  if (priorityIdx >= 0) {
    const maxP = parseInt(args[priorityIdx + 1] || "1", 10);
    targetQueue = targetQueue.filter((e) => e.priority <= maxP);
  }

  const pending = targetQueue.filter((e) => e.status === "PENDING");
  const needsManual = targetQueue.filter((e) => e.status === "NEEDS_MANUAL");
  targetQueue = [...pending, ...needsManual];

  console.log(`\n=== HUMAN ASSISTED SUBMISSION: ${targetQueue.length} platforms ===`);
  console.log(`Mode: ${autoReg ? "AUTO-REGISTER (IMAP email verification)" : "MANUAL (wait for human action)"}`);
  console.log("Headed browser opens for each platform.\n");

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (let i = 0; i < targetQueue.length; i++) {
    const entry = targetQueue[i];
    console.log(`\n[${i + 1}/${targetQueue.length}] ${entry.name}`);

    const result = await processPlatform(entry, autoReg);
    entry.status = result.status as QueueEntry["status"];
    entry.result = result.error;
    saveQueue(queue);

    const icon = result.status === "SUCCESS" ? "✅" : result.status === "NEEDS_MANUAL" ? "🔶" : "❌";
    console.log(`\n  ${icon} ${entry.name}: ${result.status}${result.error ? ` — ${result.error}` : ""}`);

    if (i < targetQueue.length - 1) {
      console.log(`\n  --- Next platform in 5s ---`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log("\n=== COMPLETE ===");
  const done = queue.filter((e) => e.status === "SUCCESS");
  const remaining = queue.filter((e) => e.status === "PENDING" || e.status === "NEEDS_MANUAL");
  console.log(`SUCCESS:        ${done.length}`);
  console.log(`NEEDS_MANUAL:   ${remaining.length}`);
  console.log(`FAILED:         ${queue.filter((e) => e.status === "FAILED").length}`);
  console.log(`NOT_APPLICABLE: ${queue.filter((e) => e.status === "NOT_APPLICABLE").length}`);

  await closeStealthContext();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
