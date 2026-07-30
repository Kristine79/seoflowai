require("dotenv").config();
const { chromium } = require("playwright");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const pg = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

// Use dynamic import for ESM-only PrismaClient
let prisma;

async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import("../src/generated/prisma/client.js");
    const url = new URL(process.env.DATABASE_URL || "");
    url.searchParams.delete("sslmode");
    const pool = new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

const SUBMIT_KW = ["submit", "register", "create account", "send", "add company", "add listing", "sign up", "join", "get started", "add business", "list my business", "add my business", "отправить", "зарегистрироваться", "создать", "добавить"];
const NEXT_KW = ["next", "continue", "proceed", "step 2", "step 3", "step 4", "step 5", "далее", "продолжить", "дальше", "weiter"];
const CRITICAL = ["name", "email", "phone", "website", "address"];
const MAX_STEPS = 5;

function log(arr, msg) {
  arr.push(msg);
  console.log(`  ${msg}`);
}

async function extractForm(page) {
  return page.evaluate((kwList) => {
    const elements = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea, button:not([type=button])");
    const fields = [];
    let submitSel = null, submitText = null;

    for (const el of elements) {
      const tag = el.tagName.toLowerCase();
      const text = (el.textContent || el.value || "").trim().toLowerCase();

      if (tag === "button" && text && kwList.some(k => text.includes(k))) {
        submitSel = el.id ? "#" + el.id : "." + Array.from(el.classList).join(".");
        submitText = el.textContent?.trim() || null;
        continue;
      }
      if (el instanceof HTMLInputElement && el.type === "submit" && text && kwList.some(k => text.includes(k))) {
        submitSel = 'input[type=submit]' + (el.name ? '[name="' + el.name + '"]' : "");
        submitText = el.value || null;
        continue;
      }

      if (el instanceof HTMLInputElement && (el.type === "submit" || el.type === "button")) continue;
      if (tag === "button") continue;

      let label = "";
      if (el.id) { const l = document.querySelector("label[for='" + el.id + "']"); if (l) label = l.textContent?.trim() || ""; }
      if (!label) { const p = el.closest("label"); if (p) label = p.textContent?.trim() || ""; }

      const sel = el.id ? "#" + el.id : (el.name ? '[name="' + el.name + '"]' : (el.className ? "." + Array.from(el.classList).join(".") : ""));
      if (sel) {
        fields.push({
          selector: sel, type: el instanceof HTMLInputElement ? el.type : tag,
          label, placeholder: el.placeholder || "",
          required: el.hasAttribute("required") || el.getAttribute("aria-required") === "true",
        });
      }
    }
    return { fields, submitSelector: submitSel, submitText };
  }, [...NEXT_KW, ...SUBMIT_KW]);
}

async function checkQuality(page) {
  return page.evaluate(() => {
    const html = document.body.innerHTML.toLowerCase();
    const hasCaptcha = /recaptcha|g-recaptcha|hcaptcha|cf-turnstile|captcha|i am not a robot/.test(html) ||
      !!document.querySelector("iframe[src*='recaptcha'], iframe[src*='hcaptcha'], .g-recaptcha, .h-captcha");
    const els = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
    return { hasCaptcha, totalFields: els.length, requiredFields: Array.from(els).filter(e => e.hasAttribute("required")).length };
  });
}

async function handleSelect(page, selector, value, logFn) {
  const el = await page.$(selector);
  if (!el) return false;

  const tag = await el.evaluate(e => e.tagName.toLowerCase());

  // Native <select>
  if (tag === "select") {
    try {
      const match = await page.evaluate(({ sel, val }) => {
        const s = document.querySelector(sel);
        if (!s) return null;
        for (const o of s.options) {
          if (o.text.toLowerCase().includes(val.toLowerCase()) || o.value.toLowerCase().includes(val.toLowerCase())) return o.value;
        }
        return s.options.length > 1 ? s.options[1].value : (s.options[0]?.value || null);
      }, { sel: selector, val: value });
      if (match) { await page.selectOption(selector, match); logFn(`  ✓ Select: chose "${match}"`); return true; }
    } catch { return false; }
    return false;
  }

  // React-select / autocomplete
  const isReact = await page.evaluate(sel => {
    const e = document.querySelector(sel);
    if (!e) return false;
    return e.getAttribute("role") === "combobox" || !!e.closest("[class*='select' i], [class*='dropdown' i], [class*='autocomplete' i]");
  }, selector);

  if (!isReact) return false;

  logFn(`  React-select/autocomplete detected`);
  const origVal = await page.evaluate(sel => document.querySelector(sel)?.value || "", selector);

  try {
    await page.click(selector);
    await page.waitForTimeout(400);

    // Check if dropdown is visible
    const visible = await page.evaluate(() => {
      for (const m of document.querySelectorAll("[class*='menu' i], [class*='option' i], [role='listbox'], [role='combobox']")) {
        const s = window.getComputedStyle(m);
        if (s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0") return true;
      }
      return false;
    });

    if (!visible) {
      await page.keyboard.type(value, { delay: 50 });
      await page.waitForTimeout(600);
    }

    // Find options
    const options = await page.evaluate(() => {
      const seen = new Set();
      return Array.from(document.querySelectorAll("[class*='option' i], [role='option'], [class*='menu' i] div, li, [class*='item' i]"))
        .map(el => el.textContent?.trim() || "")
        .filter(t => t && t.length < 100 && !seen.has(t) && seen.add(t));
    });

    logFn(`  Options found: ${options.length}`);

    if (options.length === 0) {
      logFn(`  No options, typing value`);
      await page.fill(selector, value);
      return true;
    }

    const best = options.find(o => o.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(o.toLowerCase())) || options[0];
    const optEls = await page.$$("[class*='option' i], [role='option'], [class*='menu' i] div, li, [class*='item' i]");
    const idx = options.indexOf(best);

    if (idx >= 0 && optEls[idx]) {
      await optEls[idx].click();
      await page.waitForTimeout(300);
      const newVal = await page.evaluate(sel => document.querySelector(sel)?.value || "", selector);
      logFn(`  Selected: "${best.slice(0, 40)}" (field: "${newVal.slice(0, 30)}")`);
      return true;
    }

    logFn(`  No option match, filling directly`);
    await page.fill(selector, value);
    return true;
  } catch (e) {
    logFn(`  Select handler error: ${e.message?.slice(0, 60)}, using fill`);
    try { await page.fill(selector, value); return true; } catch { return false; }
  }
}

async function findNextBtn(page) {
  return page.evaluate(([next, submit]) => {
    const btns = document.querySelectorAll("button, input[type=submit], a[role=button], [class*=btn], [class*=button]");
    for (const el of btns) {
      const text = (el.textContent || el.value || "").trim().toLowerCase();
      if (!text) continue;
      if (submit.some(k => text.includes(k))) return null; // final submit = no next step
      if (next.some(k => text.includes(k))) {
        const sel = el.id ? "#" + el.id : el.className ? "." + Array.from(el.classList).join(".") : 'button:has-text("' + (el.textContent?.trim() || el.value || "") + '")';
        return { selector: sel, text: el.textContent?.trim() || el.value || "" };
      }
    }
    return null;
  }, [NEXT_KW, SUBMIT_KW]);
}

async function processStep(page, companyData, openai, step, logFn) {
  logFn(`\n--- Step ${step + 1} ---`);
  const fs = await extractForm(page);
  logFn(`Fields found: ${fs.fields.length}`);

  for (const f of fs.fields) {
    logFn(`  [${f.type}] "${f.label || f.placeholder}" ${f.selector}${f.required ? " *" : ""}`);
  }

  // AI mapping
  const fieldDesc = fs.fields.map((f, i) => `${i + 1}. selector="${f.selector}" label="${f.label}" placeholder="${f.placeholder}" type="${f.type}" required=${f.required}`).join("\n");
  const companyInfo = Object.entries(companyData).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
  const prompt = `You are a form-filling assistant. Map company data to form fields.\n\nCOMPANY DATA:\n${companyInfo}\n\nFORM FIELDS:\n${fieldDesc}\n\nRespond with JSON where keys are CSS selectors and values are text to enter. Skip buttons/checkboxes. Use empty string for unmappable fields.`;

  logFn(`AI mapping...`);
  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  let mapping = {};
  try { mapping = JSON.parse(resp.choices[0]?.message?.content || "{}"); } catch {}

  const fillable = Object.entries(mapping).filter(([, v]) => v && String(v).length > 0);
  logFn(`Mapped: ${fillable.length} of ${fs.fields.length} fields`);

  for (const [sel, val] of fillable) {
    const info = fs.fields.find(f => f.selector === sel);
    logFn(`  ${sel} → "${String(val).slice(0, 50)}"  [${info?.label || info?.placeholder || "?"}]`);
  }

  // Fill
  let filled = 0, failed = 0;
  for (const [sel, val] of fillable) {
    const label = fs.fields.find(f => f.selector === sel)?.label || sel;
    try {
      await page.fill(sel, String(val));
      filled++;
      logFn(`  ✓ [${filled}] "${label}" = "${String(val).slice(0, 50)}"`);
    } catch {
      const ok = await handleSelect(page, sel, String(val), logFn);
      if (ok) { filled++; logFn(`  ✓ [${filled}] "${label}" = selected`); }
      else { failed++; logFn(`  ✗ [${filled + failed}] "${label}": not fillable`); }
    }
  }

  logFn(`Step ${step + 1}: ${filled} filled, ${failed} failed`);
  return { mapping, filled, failed, allFields: fs.fields };
}

async function validate(allFields, mapping, mode) {
  const required = allFields.filter(f => f.required && (!mapping[f.selector] || !String(mapping[f.selector]).trim()));
  if (required.length > 0) return `Required fields not filled: ${required.map(f => '"' + (f.label || f.placeholder) + '"').join(", ")}`;

  const filledLabels = Object.keys(mapping).filter(k => mapping[k]).map(k => {
    const f = allFields.find(f => f.selector === k);
    return (f?.label || f?.placeholder || k).toLowerCase();
  });
  const missing = CRITICAL.filter(c => !filledLabels.some(l => l.includes(c)));
  if (missing.length > 0 && mode === "SUBMIT") return `Critical fields missing: ${missing.join(", ")}`;

  return null;
}

async function main() {
  const directoryId = process.argv[2] || "cms3phboh0009bsutz7uqe7b5";
  const p = await getPrisma();

  const dir = await p.directory.findUnique({ where: { id: directoryId }, include: { company: true } });
  if (!dir || !dir.company || !dir.url) throw new Error("Invalid directory");

  const c = dir.company;
  const companyData = {
    name: c.name, legalName: c.legalName, website: c.website, email: c.email,
    phone: c.phone, address: c.address, city: c.city, state: c.state,
    country: c.country, description: c.descriptionShort || c.descriptionMedium || "",
    services: c.services, keywords: c.keywords, category: c.category,
  };

  const logs = [];
  const l = (msg) => log(logs, msg);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });

  console.log("============================================");
  console.log("  TEST V2: PREVIEW (multi-step + react-select)");
  console.log("============================================");
  console.log(`  Platform: ${dir.platform}`);
  console.log(`  URL: ${dir.url}`);
  console.log(`  Company: ${c.name}`);
  console.log("============================================\n");

  l("Starting browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  l("Browser ready");

  l(`Navigating to ${dir.url}...`);
  await page.goto(dir.url, { waitUntil: "networkidle", timeout: 30000 });
  l(`Title: ${await page.title()}`);
  l(`URL: ${page.url()}`);

  const q = await checkQuality(page);
  l(`Fields: ${q.totalFields}, Captcha: ${q.hasCaptcha}, Required: ${q.requiredFields}`);

  if (q.hasCaptcha || q.totalFields === 0) {
    l(`❌ ${q.hasCaptcha ? "CAPTCHA" : "No fields"}`);
    await browser.close();
    process.exit(1);
  }

  let allFields = [];
  let combinedMapping = {};
  let totalFilled = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    const r = await processStep(page, companyData, openai, step, l);
    allFields = [...allFields, ...r.allFields];
    Object.assign(combinedMapping, r.mapping);
    totalFilled += r.filled;

    if (r.filled === 0 && step > 0) {
      l(`No fields filled on step ${step + 1}, stopping step navigation`);
      break;
    }

    const next = await findNextBtn(page);
    if (!next) { l(`\nNo next step button — final step`); break; }

    l(`\nStep ${step + 1} done → clicking "${next.text}"`);
    await page.click(next.selector);
    await page.waitForTimeout(2000);
    l(`New URL: ${page.url()}`);
  }

  l(`\n=== Summary ===`);
  l(`Steps: ${Math.min(MAX_STEPS, logs.filter(l => l.includes("Step ")).length + 1)}`);
  l(`All fields: ${allFields.length}`);
  l(`Total filled: ${totalFilled}`);

  // Validation
  const valErr = await validate(allFields, combinedMapping, "PREVIEW");
  if (valErr) l(`Validation: ${valErr}`);
  else l(`Validation: OK ✓`);

  // Screenshot
  l(`\nTaking screenshot...`);
  const ss = await page.screenshot({ type: "png", fullPage: true });
  const ssPath = path.resolve("test-output-v2.png");
  fs.writeFileSync(ssPath, ss);
  l(`Screenshot: ${(ss.length / 1024).toFixed(0)} KB → ${ssPath}`);

  await browser.close();

  // Save to DB
  l(`\nSaving AutomationJob...`);
  const job = await p.automationJob.create({
    data: {
      directoryId: dir.id,
      mode: "PREVIEW",
      status: "SUCCESS",
      screenshot: ss.toString("base64"),
      logs: JSON.stringify(logs),
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });
  l(`Job: ${job.id} (${job.status})`);

  // Save template
  await p.submissionTemplate.upsert({
    where: { directoryId: dir.id },
    create: { directoryId: dir.id, fieldMapping: combinedMapping, formStructure: { fields: allFields, submitSelector: null, submitText: null }, submitSelector: null, version: 1 },
    update: { fieldMapping: combinedMapping, version: { increment: 1 } },
  });
  l(`Template saved`);

  await p.$disconnect();

  console.log("\n============================================");
  console.log("  ✅ TEST COMPLETE");
  console.log("============================================");
  console.log(`  Dir: ${dir.platform}`);
  console.log(`  Fields: ${allFields.length} total, ${totalFilled} filled`);
  console.log(`  Submit btn: ${allFields.filter(f => f.type === "button" || f.selector.includes("button")).length}`);
  console.log(`  Validation: ${valErr || "PASS"}`);
  console.log(`  Screenshot: ${ssPath}`);
  console.log("============================================");
}

main().catch(e => {
  console.error("\n❌ FAILED:", e.message);
  if (e.stack) console.error(e.stack.slice(0, 500));
  process.exit(1);
});
