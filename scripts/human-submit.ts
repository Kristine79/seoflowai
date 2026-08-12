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
 * Правила статусов (клиент):
 *  VERIFIED_SUCCESS — только при наличии публичного Profile URL.
 *  SUBMITTED        — форма отправлена, публикация не подтверждена.
 *  REGISTERED       — аккаунт создан, дальнейшее действие требуется.
 *  NEEDS_MANUAL     — автоматизация остановилась до отправки.
 *  BLOCKED          — внешняя защита (Cloudflare/CAPTCHA/IP).
 *
 * Перед новым запуском:
 *  - каждая попытка записывается в entry.history (дата/результат/evidence);
 *  - дубли-гард: если последняя попытка закончилась SUBMITTED / REGISTERED /
 *    PENDING_VERIFICATION / PENDING_MODERATION / VERIFIED_SUCCESS — платформа пропускается;
 *  - если известен существующий аккаунт/profile URL — выводится напоминание,
 *    запуск без повторной регистрации.
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
import { handleSelectField } from "../src/lib/automation/submission-runner";
import { detectEmailDomainMismatch, collectFormResponses } from "../src/lib/automation/submission-runner";
import type { ServerResponseSample } from "../src/lib/automation/submission-runner";
import { discoverRegistrationPage } from "../src/lib/automation/registration-discovery";
import { dismissCookieConsent } from "../src/lib/automation/cookie-consent";
import fs from "fs";
import path from "path";

const REGISTRATION_EMAIL = "itllect.marketing@gmail.com";
const COMPANY_EMAIL = "info@itllect-agency.com";

/**
 * Email policy:
 * - Registration/login/verification flows use REGISTRATION_EMAIL.
 * - Business/Company/Contact Email fields inside the company profile use COMPANY_EMAIL.
 */
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

interface Attempt {
  date: string;
  action: string;
  outcome: string;
  error?: string;
  evidence?: string[];
}

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
  history?: Attempt[];
}

const QUEUE_FILE = path.resolve("human-queue.json");
const OUT_DIR = path.resolve("human-submit-out");

export const SUCCESS_SIGNALS = [
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

/** ISO timestamp with seconds, tz-stripped for readability. */
function nowStamp(): string {
  return new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z");
}

/** Записать попытку в history записи и сохранить очередь. */
function recordAttempt(
  queue: QueueEntry[],
  entry: QueueEntry,
  outcome: string,
  error?: string | null,
  evidence?: string[]
) {
  if (!entry.history) entry.history = [];
  entry.history.push({ date: nowStamp(), action: "run", outcome, error: error || undefined, evidence });
  saveQueue(queue);
}

/** Извлечь публичный URL-профиля из notes (по префиксам http). */
function extractProfileUrl(notes: string): string | null {
  const m = notes.match(/https?:\/\/[^\s)]+(?:profile|businesses|biz|listing)[^\s)]*/i);
  return m ? m[0] : null;
}

/** Последняя завершённая попытка (не "running"). */
function lastRealOutcome(entry: QueueEntry): string | null {
  if (!entry.history || entry.history.length === 0) return null;
  for (let i = entry.history.length - 1; i >= 0; i--) {
    const o = entry.history[i].outcome;
    if (o !== "running") return o;
  }
  return null;
}

/** Статусы, при которых повторный запуск запрещён (дубли-гард). */
const SKIP_OUTCOMES = new Set([
  "SUBMITTED", "REGISTERED", "PENDING_VERIFICATION", "PENDING_MODERATION", "VERIFIED_SUCCESS",
]);

/** CSS-селекторы элементов, которые однозначно означают подтверждение отправки. */
export const CONFIRMATION_SELECTORS = [
  ".confirmation", ".confirmation-message", ".success-message", ".success-msg",
  ".alert-success", ".alert-success *", "[role=alert].success",
  ".thank-you", ".thankyou", ".submission-success",
  "[data-success]", "[data-confirmation]", "[data-submitted]",
  ".form-success", ".form-submitted", ".request-received",
  ".cta-success", ".post-submit-success",
  ".woocommerce-message", ".wpforms-confirmation-scroll",
];

export interface Baseline {
  url: string;
  /** SUCCESS_SIGNALS words already present at baseline (landing-page noise). */
  successWordsPresent: Set<string>;
  /** Snapshot of headings + key text length for diff. */
  textLen: number;
}

/**
 * Capture the baseline page state right after form extraction (before any submit).
 * Any SUCCESS_SIGNALS word present at baseline is considered "noise" and won't
 * count as proof of submission on its own.
 */
export async function captureBaseline(page: import("playwright").Page): Promise<Baseline> {
  const url = page.url();
  const data = await page.evaluate((signals: string[]) => {
    const text = (document.body?.innerText || "").toLowerCase();
    const present = new Set<string>();
    for (const s of signals) if (text.includes(s)) present.add(s);
    return { textLen: text.length, present: Array.from(present) };
  }, SUCCESS_SIGNALS).catch(() => ({ textLen: 0, present: [] as string[] }));
  return { url, successWordsPresent: new Set(data.present), textLen: data.textLen };
}

/**
 * Attach listeners that mark `window.__submitFired = true` when a real form
 * submit happens (submit event or click on submit/sign-up/register buttons).
 * Captures proof that a submit action actually occurred (manual or auto).
 */
export async function attachSubmitListener(page: import("playwright").Page, log: (m: string) => void) {
  try {
    await page.evaluate(() => {
      (window as any).__submitFired = false;
      const mark = () => { (window as any).__submitFired = true; };
      document.addEventListener("submit", mark, true);
      document.addEventListener("click", (e: Event) => {
        const t = e.target as HTMLElement;
        if (!t) return;
        const tag = t.tagName;
        if (tag !== "BUTTON" && tag !== "INPUT" && tag !== "A") return;
        const label = ((t as HTMLButtonElement).textContent || (t as HTMLInputElement).value || "").toLowerCase();
        if (/submit|sign\s?up|register|create\s+(?:new\s+)?(?:account|profile)|send|get\s+started|continue|next|apply|claim|complete|finish|join/i.test(label)) {
          mark();
        }
      }, true);
    });
    log("Submit listener attached (submit evidence capture ON)");
  } catch (err) {
    log(`Submit listener attach failed: ${err instanceof Error ? err.message.slice(0, 80) : String(err)}`);
  }
}

export async function hasSubmitFired(page: import("playwright").Page): Promise<boolean> {
  try {
    return await page.evaluate(() => !!((window as any).__submitFired)) as boolean;
  } catch { return false; }
}

async function hasConfirmationElement(page: import("playwright").Page): Promise<string | null> {
  for (const sel of CONFIRMATION_SELECTORS) {
    try {
      const el = await page.$(sel).catch(() => null);
      if (el) {
        const visible = await el.isVisible().catch(() => false);
        if (visible) return sel;
      }
    } catch {}
  }
  return null;
}

/**
 * PROOF-BASED success check. SUBMITTED is returned ONLY with evidence:
 *   (a) post-submit navigation to a non-error URL different from baseline, OR
 *   (b) a confirmation element (CONFIRMATION_SELECTORS) appeared AFTER baseline, OR
 *   (c) a submit action was fired AND a SUCCESS_SIGNALS word that was NOT present
 *       at baseline appeared in the page text afterwards.
 * "thank you"-style text already present on a landing page does NOT count.
 */
export async function checkSuccess(page: import("playwright").Page, baseline: Baseline): Promise<{ ok: boolean; reason: string }> {
  try {
    const url = page.url();
    // (a) navigation/redirect proof
    if (url !== baseline.url && !url.includes("error") && !url.includes("chrome-error") && !/404|not[-_ ]?found/i.test(await page.title().catch(() => ""))) {
      return { ok: true, reason: `post-submit navigation to ${url}` };
    }
    // (b) confirmation element proof
    const conf = await hasConfirmationElement(page);
    if (conf) return { ok: true, reason: `confirmation element "${conf}" appeared` };
    // (c) submit fired + NEW success signal (not in baseline)
    const fired = await hasSubmitFired(page);
    if (fired) {
      const text = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "").catch(() => "");
      for (const s of SUCCESS_SIGNALS) {
        if (text.includes(s) && !baseline.successWordsPresent.has(s)) {
          return { ok: true, reason: `submit fired + new signal "${s}"` };
        }
      }
    }
    return { ok: false, reason: "no proof of submission" };
  } catch {
    return { ok: false, reason: "check failed" };
  }
}

export async function pollForSuccess(
  page: import("playwright").Page,
  baseline: Baseline,
  timeoutMs: number,
  log: (m: string) => void
): Promise<{ ok: boolean; reason: string; blocked: boolean }> {
  const start = Date.now();
  let lastReason = "no proof of submission";
  while (Date.now() - start < timeoutMs) {
    // Cloudflare re-challenge during poll → BLOCKED, not SUBMITTED.
    if (await isCloudflareChallenge(page).catch(() => false)) {
      return { ok: false, reason: "Cloudflare challenge reappeared during poll", blocked: true };
    }
    const r = await checkSuccess(page, baseline);
    if (r.ok) return { ok: true, reason: r.reason, blocked: false };
    lastReason = r.reason;
    await page.waitForTimeout(3000);
  }
  return { ok: false, reason: lastReason, blocked: false };
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

/**
 * Multi-step SPA forms: fill current step fields, then look for a
 * Next/Continue/Sign up/Submit button to advance, wait for DOM update,
 * re-extract and repeat until no new fillable fields appear.
 *
 * Returns { extractedFields, mapping, filled, failed, submit } cumulative stats.
 */
async function multiStepFill(
  page: import("playwright").Page,
  log: (m: string) => void
): Promise<{
  fields: { selector: string; type: string; label: string; placeholder: string; required: boolean }[];
  mapping: Record<string, string>;
  filled: number;
  failed: number;
  steps: number;
}> {
  const MAX_STEPS = 6;
  const NEXT_KEYWORDS = ["next", "continue", "proceed", "step 2", "step 3", "step 4", "далее", "продолжить", "weiter"];
  const ADVANCE_KEYWORDS = ["next", "continue", "sign up", "create account", "register", "submit", "get started", "join", "send", "далее", "продолжить", "зарегистрироваться"];

  const allFields: { selector: string; type: string; label: string; placeholder: string; required: boolean }[] = [];
  const allMapping: Record<string, string> = {};
  const seenSelectors = new Set<string>();
  let filledTotal = 0;
  let failedTotal = 0;
  let steps = 0;

  const fillCurrentFields = async (formFields: typeof allFields): Promise<{ filled: number; failed: number; mapping: Record<string, string> }> => {
    let mapping: Record<string, string> = {};
    if (formFields.length === 0) return { filled: 0, failed: 0, mapping };

    try {
      mapping = await mapFieldsWithAI(openai, COMPANY_DATA, formFields);
      log(`AI mapping: ${Object.keys(mapping).length} fields`);
    } catch (err) {
      const emsg = err instanceof Error ? err.message : String(err);
      log(`AI failed: ${emsg.slice(0, 100)}`);
      for (const f of formFields) {
        const l = (f.label || f.placeholder || "").toLowerCase();
        if (l.includes("name") || l.includes("company")) mapping[f.selector] = COMPANY_DATA.name;
        else if (l.includes("email")) mapping[f.selector] = emailValueForLabel(l);
        else if (l.includes("phone")) mapping[f.selector] = COMPANY_DATA.phone;
        else if (l.includes("website") || l.includes("url")) mapping[f.selector] = COMPANY_DATA.website;
        else if (l.includes("address")) mapping[f.selector] = COMPANY_DATA.address;
        else if (l.includes("city")) mapping[f.selector] = COMPANY_DATA.city;
        else if (l.includes("state")) mapping[f.selector] = COMPANY_DATA.state;
        else if (l.includes("zip")) mapping[f.selector] = COMPANY_DATA.zip;
        else if (l.includes("description") || l.includes("about") || l.includes("message")) mapping[f.selector] = COMPANY_DATA.description;
        else if (l.includes("services") || l.includes("category")) mapping[f.selector] = COMPANY_DATA.services;
      }
      log(`Fallback: ${Object.keys(mapping).length} fields`);
    }

    // Enforce email policy on every step.
    for (const f of formFields) {
      const l = (f.label || f.placeholder || "").toLowerCase();
      if (l.includes("email") || l.includes("mail") || f.selector.includes("email") || f.selector.includes("mail")) {
        mapping[f.selector] = emailValueForLabel(l);
      }
    }

    let filled = 0, failed = 0;
    for (const [sel, val] of Object.entries(mapping)) {
      if (!val) continue;
      const fi = formFields.find((f) => f.selector === sel);
      const lbl = fi?.label || fi?.placeholder || sel;
      try {
        const el = await page.$(sel).catch(() => null);
        if (!el) { failed++; log(`  ✗ [${lbl}] DOM missing (${sel})`); continue; }
        const tag = await el.evaluate((e: Element) => e.tagName.toLowerCase()).catch(() => "");
        const ro = await el.evaluate((e: Element) => !!(e as HTMLInputElement).readOnly).catch(() => false);
        if (tag === "select" || ro) {
          const ok = await handleSelectField(page, sel, val, log);
          if (ok) {
            filled++;
            log(`  ✓ [${lbl}] filled via select/dropdown path`);
          } else {
            failed++;
            log(`  ✗ [${lbl}] select/dropdown not committed (${sel})`);
          }
        } else if (tag === "input" || tag === "textarea") {
          await page.fill(sel, val);
          filled++;
          log(`  ✓ [${lbl}] = ${val.slice(0, 40)}`);
        } else {
          failed++;
          log(`  ✗ [${lbl}] tag=${tag} not fillable`);
          continue;
        }
      } catch (e) {
        failed++;
        log(`  ✗ [${lbl}] ${e instanceof Error ? e.message.slice(0, 80) : String(e)}`);
      }
    }
    log(`Step filled: ${filled}/${formFields.length} (${failed} failed)`);
    return { filled, failed, mapping };
  };

  const findAdvanceButton = async (): Promise<string | null> => {
    const btn = await page.evaluate(({ next, advance }: { next: string[]; advance: string[] }) => {
      const buttons = Array.from(document.querySelectorAll("button, input[type=submit], a[role=button]"));
      const visible = buttons.filter((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const ro = (el as HTMLInputElement).readOnly;
        if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true" || ro) return false;
        return true;
      });
      const texts = visible.map((el) => (el.textContent || (el as HTMLInputElement).value || "").trim().toLowerCase()).filter(Boolean);
      for (const kw of next) {
        const m = texts.find((t) => t.includes(kw));
        if (m) return m;
      }
      for (const kw of advance) {
        const m = texts.find((t) => t.includes(kw));
        if (m) return m;
      }
      return null;
    }, { next: NEXT_KEYWORDS, advance: ADVANCE_KEYWORDS }).catch(() => null);
    return btn;
  };

  for (let step = 0; step < MAX_STEPS; step++) {
    steps = step + 1;
    log(`\n=== STEP ${steps} — extracting current visible form ===`);
    const formStructure = await extractFormStructure(page);

    // Only map/fill fields not seen before (fields that exist in current DOM).
    const newFields = formStructure.fields.filter((f) => !seenSelectors.has(f.selector));
    log(`Fields detected: ${formStructure.fields.length} (${newFields.length} new in current DOM)`);
    if (newFields.length === 0) {
      log("No new fields — form did not advance; stopping multi-step.");
      break;
    }
    newFields.forEach((f) => seenSelectors.add(f.selector));
    allFields.push(...newFields);

    const { filled, failed, mapping } = await fillCurrentFields(newFields);
    filledTotal += filled;
    failedTotal += failed;
    Object.assign(allMapping, mapping);

    // After filling, try to advance to the next step.
    // Prefer the Analyzer's ranked submit control: it is scoped to the active
    // step/form (visible, enabled, same step, same form, text score) and avoids
    // marketing CTAs in the site header ("Get started") that a page-wide text
    // match would hit. Fall back to text search only when the Analyzer found
    // no control or it cannot be clicked.
    let clicked = false;
    const beforeUrl = page.url();
    if (formStructure.submitSelector) {
      try {
        await page.click(formStructure.submitSelector, { timeout: 8000 });
        clicked = true;
        log(`Advance via analyzer selector: ${formStructure.submitSelector}`);
      } catch (e) {
        log(`Analyzer advance selector failed (${formStructure.submitSelector}): ${e instanceof Error ? e.message.slice(0, 80) : String(e)}`);
      }
    }
    if (!clicked) {
      const btnText = await findAdvanceButton();
      if (!btnText) {
        log("No Next/Continue/Submit button found — final step reached.");
        break;
      }
      log(`Advance button: "${btnText}"`);
      try {
        await page.getByRole("button", { name: btnText, exact: false }).first().click({ timeout: 8000 }).catch(() => {
          return page.getByText(btnText, { exact: false }).first().click({ timeout: 8000 });
        });
        clicked = true;
      } catch (e) {
        log(`Could not click advance button: ${e instanceof Error ? e.message.slice(0, 80) : String(e)}`);
      }
    }
    if (!clicked) break;

    await page.waitForTimeout(3000);
    const afterUrl = page.url();
    if (afterUrl !== beforeUrl) log(`Navigated: ${beforeUrl} → ${afterUrl}`);

    // If form was actually submitted (redirect to success page) stop.
    const newUrl = page.url();
    if (/thank|success|submitted|confirm|verify|welcome/.test(newUrl.toLowerCase()) && newUrl !== beforeUrl) {
      log(`Seems form submitted — stopping multi-step (${newUrl}).`);
      break;
    }
  }

  return { fields: allFields, mapping: allMapping, filled: filledTotal, failed: failedTotal, steps };
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

    // Registration page discovery: никогда не заполняем главную/лендинг как форму.
    // Если текущая страница не является формой регистрации/создания профиля —
    // ищем её (ссылки, URL-паттерны, внешний поиск) и переходим.
    log("Running registration-page discovery...");
    const discovery = await discoverRegistrationPage(page, log);
    if (!discovery.isRegistrationPage) {
      await screenshotToFile(page, path.join(logDir, "discovery-blocked.png"));
      log(`\n[DISCOVERY] Registration page NOT found — NOT filling/submitting (flow=${discovery.flow}, confidence=${discovery.confidence})`);
      return { status: "NEEDS_MANUAL", error: `Registration page not found (flow=${discovery.flow}): ${discovery.error}` };
    }
    if (page.url() !== targetUrl) {
      log(`[DISCOVERY] Navigated to registration page: ${page.url()} (flow=${discovery.flow}, confidence=${discovery.confidence})`);
      await screenshotToFile(page, path.join(logDir, "discovery-found.png"));
    }

    // Cookie consent: best-effort dismiss BEFORE extraction so banner controls
    // never leak into the form structure. Absent banner / missing button → continue.
    log("Handling cookie consent (best-effort)...");
    await dismissCookieConsent(page, log);

    // Multi-step form extraction & fill. SPA forms render fields progressively:
    // each step extracts only the fields currently present in the DOM, maps them,
    // fills them, then advances via Next/Continue/Sign up until no new fields.
    const multiStep = await multiStepFill(page, log);
    const formStructure = { fields: multiStep.fields, submitSelector: null, submitText: null };
    const fieldMapping = multiStep.mapping;
    const totalFilled = multiStep.filled;
    const totalFailed = multiStep.failed;
    log(`\n=== MULTI-STEP SUMMARY ===`);
    log(`Steps processed: ${multiStep.steps}`);
    log(`Total unique fields found: ${formStructure.fields.length}`);
    log(`Total fields filled: ${totalFilled}`);
    log(`Total field failures: ${totalFailed}`);

    // Pre-submit email verification: log current values of email fields in the form.
    try {
      const emails = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
          "input[type='email'], input[name*='email'], input[name*='mail'], input[id*='email'], input[id*='mail'], input[placeholder*='email' i], input[placeholder*='mail' i]"
        ));
        return inputs.map((el) => ({ name: el.name || el.id || el.placeholder || "", value: el.value })).filter((e) => e.value);
      }).catch(() => []);
      if (emails.length === 0) log("⚠ Email fields: none filled in current form");
      for (const e of emails) log(`  Email field [${e.name}] = ${e.value}`);
      const wrongReg = emails.some((e) => e.value !== REGISTRATION_EMAIL && e.value !== COMPANY_EMAIL);
      if (wrongReg) log("⚠ WARNING: email value differs from REGISTRATION_EMAIL/COMPANY_EMAIL — verify before submit");
    } catch {}

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
          for (const f of postRegForm.fields) {
            const l = (f.label || f.placeholder || "").toLowerCase();
            if (l.includes("email") || l.includes("mail") || f.selector.includes("email") || f.selector.includes("mail")) {
              pm[f.selector] = emailValueForLabel(l);
            }
          }
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

    // Capture baseline + attach submit listener BEFORE human action phase.
    // Any SUCCESS_SIGNALS already present on the landing page are "noise" and
    // won't count as proof of submission on their own (false-positive guard).
    const baseline = await captureBaseline(page);
    log(`Baseline: url=${baseline.url}, success-words=${baseline.successWordsPresent.size}, textLen=${baseline.textLen}`);
    await attachSubmitListener(page, log);

    // Registration email domain-mismatch safeguard: if the server rejects the
    // registration email (domain doesn't match the website), automation must
    // NOT substitute another email — return NEEDS_MANUAL with the reason.
    const submitResponses: ServerResponseSample[] = [];
    page.on("response", collectFormResponses(page, submitResponses));

    // HUMAN: verify + submit (180s timeout) — proof-based.
    log(`\n  ┏━━━ HUMAN ACTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`);
    log(`  ┃ 1. Solve captcha/Cloudflare (if still present) ┃`);
    log(`  ┃ 2. Verify filled fields                        ┃`);
    log(`  ┃ 3. Complete missing fields                     ┃`);
    log(`  ┃ 4. Click Submit/Register                       ┃`);
    log(`  ┃ 5. Wait for success page                       ┃`);
    log(`  ┃                                                ┃`);
    log(`  ┃ You have 180 seconds ⏱                         ┃`);
    log(`  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`);

    const result = await pollForSuccess(page, baseline, 180000, log);

    await page.waitForTimeout(2000);
    await screenshotToFile(page, path.join(logDir, "postsubmit.png"));
    log(`Post-submit screenshot saved`);

    const emailMismatch = detectEmailDomainMismatch(submitResponses);
    if (emailMismatch) {
      log(`✗ ${emailMismatch}`);
      return { status: "NEEDS_MANUAL", error: emailMismatch };
    }

    if (result.ok) {
      log(`✓ SUBMITTED — proof: ${result.reason} (профиль НЕ подтверждён — нужна проверка публичного URL)!`);
      return { status: "SUBMITTED", error: null };
    }

    // Cloudflare re-challenge during poll → BLOCKED.
    if (result.blocked) {
      log(`⏹ BLOCKED — ${result.reason}; прекращаем попытки.`);
      return { status: "BLOCKED", error: result.reason };
    }

    // False-positive guard: 0 form fields + no submit fired + no navigation
    // → NOT SUBMITTED. Land here only when checkSuccess never found proof.
    const fired = await hasSubmitFired(page).catch(() => false);
    const nav = page.url() !== baseline.url;
    if (!fired && !nav && formStructure.fields.length === 0) {
      log(`✗ NOT SUBMITTED — no form detected (0 fields), no submit action, no navigation. False-positive guard.`);
      return { status: "NEEDS_MANUAL", error: "No form detected (0 fields) and no proof of submission" };
    }

    log(`? Not confirmed in 180s — NEEDS_MANUAL (last reason: ${result.reason})`);
    return { status: "NEEDS_MANUAL", error: `Human action timeout (180s) — ${result.reason}` };

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
        const h = e.history && e.history.length > 0 ? ` (attempts: ${e.history.length}, last: ${lastRealOutcome(e) || "running"})` : "";
        console.log(`  ${e.name.padEnd(28)} ${e.humanAction.padEnd(35)}${p}${h}`);
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

  const pending = targetQueue.filter((e) => e.status === "NOT_STARTED" || e.status === "FORM_READY");
  const needsManual = targetQueue.filter((e) => e.status === "NEEDS_MANUAL");
  targetQueue = [...pending, ...needsManual];

  console.log(`\n=== HUMAN ASSISTED SUBMISSION: ${targetQueue.length} platforms ===`);
  console.log(`Mode: ${autoReg ? "AUTO-REGISTER (IMAP email verification)" : "MANUAL (wait for human action)"}`);
  console.log("Headed browser opens for each platform.\n");

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (let i = 0; i < targetQueue.length; i++) {
    const entry = targetQueue[i];
    console.log(`\n[${i + 1}/${targetQueue.length}] ${entry.name}`);

    // Дубли-гард: последняя попытка с защищённым outcome → skip.
    const lastOutcome = lastRealOutcome(entry);
    if (lastOutcome && SKIP_OUTCOMES.has(lastOutcome)) {
      console.log(`  ⏭ SKIP — последняя попытка (${lastOutcome}) защищена от повтора. Статус не меняем без доказательства.`);
      if (i < targetQueue.length - 1) await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    // Напоминание о существующем аккаунте/профиле перед запуском.
    const existingProfile = extractProfileUrl(entry.notes);
    if (existingProfile) {
      console.log(`  ℹ Существующий профиль: ${existingProfile}`);
      console.log(`     → проверьте, прежде чем регистрировать заново (дубли запрещены).`);
    }

    // Записать старт попытки в history (на случай краха — след остаётся).
    if (!entry.history) entry.history = [];
    entry.history.push({ date: nowStamp(), action: "run", outcome: "running" });
    saveQueue(queue);

    const result = await processPlatform(entry, autoReg);
    entry.status = result.status as QueueEntry["status"];
    entry.result = result.error;

    // Завершить последнюю попытку финальным outcome + evidence.
    const logDir = path.join(OUT_DIR, slug(entry.name));
    const evidence = [
      `${logDir}/human-submit.log`,
      `${logDir}/presubmit.png`,
      `${logDir}/postsubmit.png`,
    ].filter((p) => fs.existsSync(p));
    if (entry.history.length > 0 && entry.history[entry.history.length - 1].outcome === "running") {
      entry.history[entry.history.length - 1] = {
        ...entry.history[entry.history.length - 1],
        outcome: result.status,
        error: result.error || undefined,
        evidence: evidence.length > 0 ? evidence : undefined,
      };
    } else {
      recordAttempt(queue, entry, result.status, result.error, evidence.length > 0 ? evidence : undefined);
    }
    saveQueue(queue);

    const icon = result.status === "SUBMITTED" ? "✅" : result.status === "NEEDS_MANUAL" ? "🔶" : "❌";
    console.log(`\n  ${icon} ${entry.name}: ${result.status}${result.error ? ` — ${result.error}` : ""}`);

    if (i < targetQueue.length - 1) {
      console.log(`\n  --- Next platform in 5s ---`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log("\n=== COMPLETE ===");
  const done = queue.filter((e) => e.status === "VERIFIED_SUCCESS");
  const remaining = queue.filter((e) => e.status === "NOT_STARTED" || e.status === "FORM_READY" || e.status === "NEEDS_MANUAL");
  const submitted = queue.filter((e) => e.status === "SUBMITTED" || e.status === "PENDING_VERIFICATION" || e.status === "PENDING_MODERATION");
  console.log(`VERIFIED_SUCCESS: ${done.length}`);
  console.log(`SUBMITTED/PENDING: ${submitted.length}`);
  console.log(`NOT_STARTED/FORM_READY/NEEDS_MANUAL: ${remaining.length}`);
  console.log(`FAILED:         ${queue.filter((e) => e.status === "FAILED").length}`);
  console.log(`NOT_APPLICABLE: ${queue.filter((e) => e.status === "NOT_APPLICABLE").length}`);

  await closeStealthContext();
}

if (require.main === module) {
  main().catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
  });
}
