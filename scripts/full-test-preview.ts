import "dotenv/config";
import { chromium } from "playwright";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import pg from "pg";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const SUBMIT_KEYWORDS = [
  "submit", "register", "create account", "send", "add company",
  "add listing", "continue", "sign up", "join", "get started",
  "add business", "list my business", "add my business",
  "next", "weiter", "eintragen", "absenden", "отправить",
  "зарегистрироваться", "создать", "добавить",
];

async function main() {
  const directoryId = process.argv[2] || "cms3phboh0009bsutz7uqe7b5";

  // DB setup
  const raw = process.env.DATABASE_URL || "";
  const urlObj = new URL(raw);
  urlObj.searchParams.delete("sslmode");
  const pool = new pg.Pool({ connectionString: urlObj.toString(), ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // OpenAI setup
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  // Load directory
  const directory = await prisma.directory.findUnique({
    where: { id: directoryId },
    include: { company: true },
  });

  if (!directory) throw new Error("Directory not found: " + directoryId);
  if (!directory.company) throw new Error("No company attached");
  if (!directory.url) throw new Error("No URL");

  const c = directory.company;

  console.log("============================================");
  console.log("  TEST: AI SUBMISSION PREVIEW MODE");
  console.log("============================================");
  console.log(`  Platform:    ${directory.platform}`);
  console.log(`  URL:         ${directory.url}`);
  console.log(`  Company:     ${c.name}`);
  console.log(`  Status:      ${directory.status}`);
  console.log(`  AutoMode:    ${directory.automationMode}`);
  console.log("============================================\n");

  // Step 1: Launch browser
  console.log("1. Launching Playwright (headless Chromium)...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log("   ✓ Browser ready\n");

  // Step 2: Navigate
  console.log(`2. Navigating to ${directory.url}...`);
  const navStart = Date.now();
  await page.goto(directory.url, { waitUntil: "networkidle", timeout: 30000 });
  const navTime = ((Date.now() - navStart) / 1000).toFixed(1);
  const pageTitle = await page.title();
  const finalUrl = page.url();
  console.log(`   ✓ Page loaded in ${navTime}s`);
  console.log(`   Title: ${pageTitle}`);
  console.log(`   Final URL: ${finalUrl}\n`);

  // Step 3: Form quality check
  console.log("3. Checking form quality...");
  const quality = await page.evaluate(() => {
    const captchaKeywords = ["recaptcha", "g-recaptcha", "hcaptcha", "cf-turnstile", "captcha", "i am not a robot"];
    const html = document.body.innerHTML.toLowerCase();
    const hasCaptcha = captchaKeywords.some(kw => html.includes(kw)) ||
      !!document.querySelector("iframe[src*='recaptcha'], iframe[src*='hcaptcha'], .g-recaptcha, .h-captcha");
    const formElements = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
    const required = Array.from(formElements).filter(el => el.hasAttribute("required") || el.getAttribute("aria-required") === "true");
    return { hasCaptcha, totalFields: formElements.length, requiredFields: required.length };
  });

  console.log(`   CAPTCHA: ${quality.hasCaptcha ? "⚠ DETECTED" : "✓ none"}`);
  console.log(`   Total input fields: ${quality.totalFields}`);
  console.log(`   Required fields: ${quality.requiredFields}`);

  if (quality.hasCaptcha) {
    console.log("\n   ❌ CAPTCHA DETECTED — would need manual action");
    await browser.close();
    await prisma.$disconnect();
    process.exit(1);
  }

  if (quality.totalFields === 0) {
    console.log("\n   ❌ NO FORM FIELDS FOUND ON PAGE");
    await browser.close();
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log("");

  // Step 4: Extract form structure
  console.log("4. Extracting form structure...");
  const formStructure = await page.evaluate((kwList) => {
    const elements = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea, button:not([type=button])");
    const fields: { selector: string; type: string; label: string; placeholder: string; required: boolean }[] = [];
    let submitSelector: string | null = null;
    let submitText: string | null = null;

    for (const el of elements) {
      const tag = el.tagName.toLowerCase();

      // Submit button
      if (tag === "button") {
        const text = (el.textContent || "").trim().toLowerCase();
        if (text && kwList.some(kw => text.includes(kw))) {
          submitSelector = el.id ? "#" + el.id : "." + Array.from(el.classList).join(".");
          submitText = el.textContent?.trim() || null;
          continue;
        }
      }
      if (el instanceof HTMLInputElement && el.type === "submit") {
        const val = (el.value || "").trim().toLowerCase();
        if (kwList.some(kw => val.includes(kw))) {
          submitSelector = 'input[type=submit]' + (el.name ? '[name="' + el.name + '"]' : "");
          submitText = el.value || null;
          continue;
        }
      }

      // Field label
      let label = "";
      if (el.id) {
        const lbl = document.querySelector("label[for='" + el.id + "']");
        if (lbl) label = lbl.textContent?.trim() || "";
      }
      if (!label) {
        const parent = el.closest("label");
        if (parent) label = parent.textContent?.trim() || "";
      }

      // Build selector
      const selector = el.id ? "#" + el.id : (el.name ? '[name="' + el.name + '"]' : (el.className ? "." + Array.from(el.classList).join(".") : ""));
      if (selector && tag !== "button") {
        fields.push({
          selector,
          type: el instanceof HTMLInputElement ? el.type : tag,
          label,
          placeholder: (el as HTMLInputElement).placeholder || "",
          required: el.hasAttribute("required") || el.getAttribute("aria-required") === "true",
        });
      }
    }

    return { fields, submitSelector, submitText };
  }, SUBMIT_KEYWORDS);

  console.log(`   Found ${formStructure.fields.length} form fields`);
  for (const f of formStructure.fields) {
    const label = f.label || f.placeholder || "(no label)";
    console.log(`     [${f.type}] "${label}" ${f.selector}${f.required ? " *" : ""}`);
  }
  console.log(`   Submit button: ${formStructure.submitSelector ? `"${formStructure.submitText}" (${formStructure.submitSelector})` : "NOT FOUND"}`);

  if (formStructure.fields.length === 0) {
    console.log("\n   ❌ NO EXTRACTABLE FIELDS");
    await browser.close();
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log("");

  // Step 5: AI field mapping
  console.log("5. AI field mapping via OpenAI...");
  const fieldDescriptions = formStructure.fields
    .map((f, i) => `${i + 1}. selector="${f.selector}" label="${f.label}" placeholder="${f.placeholder}" type="${f.type}" required=${f.required}`)
    .join("\n");
  const companyInfo = Object.entries({
    name: c.name, legalName: c.legalName, website: c.website, email: c.email,
    phone: c.phone, address: c.address, city: c.city, state: c.state,
    country: c.country, description: c.descriptionShort || c.descriptionMedium || "",
    services: c.services, keywords: c.keywords, category: c.category,
  }).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");

  const prompt = `You are a form-filling assistant. Map company data fields to form fields.

COMPANY DATA:
${companyInfo}

FORM FIELDS:
${fieldDescriptions}

For each form field (by selector), provide the value to fill. Respond with a JSON object where keys are CSS selectors and values are the text to enter. Skip submit buttons, checkboxes, and non-input fields. Use empty string for fields you cannot map.`;

  console.log("   Sending to AI...");
  const aiStart = Date.now();
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });
  const aiTime = ((Date.now() - aiStart) / 1000).toFixed(1);

  const content = response.choices[0]?.message?.content;
  let fieldMapping: Record<string, string> = {};
  if (content) {
    try { fieldMapping = JSON.parse(content); }
    catch { console.log("   ⚠ AI JSON parse failed, raw:", content?.slice(0, 100)); }
  }

  const mappedEntries = Object.entries(fieldMapping).filter(([, v]) => v && String(v).length > 0);
  console.log(`   AI responded in ${aiTime}s: ${mappedEntries.length} of ${formStructure.fields.length} fields mapped`);

  if (mappedEntries.length === 0) {
    console.log("\n   ❌ AI COULD NOT MAP FIELDS");
    console.log("   Raw response:", content?.slice(0, 200));
    await browser.close();
    await prisma.$disconnect();
    process.exit(1);
  }

  for (const [sel, val] of mappedEntries) {
    const info = formStructure.fields.find(f => f.selector === sel);
    console.log(`     ${sel} → "${String(val).slice(0, 60)}"  [${info?.label || info?.placeholder || "?"}]`);
  }
  console.log("");

  // Step 6: Fill form
  console.log("6. Filling form with Playwright...");
  let filled = 0, failed = 0;
  for (const [selector, value] of mappedEntries) {
    const strVal = String(value);
    const fieldLabel = formStructure.fields.find(f => f.selector === selector)?.label || selector;
    try {
      await page.fill(selector, strVal);
      filled++;
      console.log(`   ✓ [${filled}] "${fieldLabel}" = "${strVal.slice(0, 50)}"`);
    } catch (err: any) {
      failed++;
      console.log(`   ✗ [${filled + failed}] "${fieldLabel}": ${err.message?.slice(0, 80)}`);
    }
  }
  console.log(`   Result: ${filled} filled, ${failed} failed`);

  if (filled === 0) {
    console.log("\n   ❌ COULD NOT FILL ANY FIELD");
    await browser.close();
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log("");

  // Step 7: Screenshot
  console.log("7. Taking screenshot...");
  const screenshotBuf = await page.screenshot({ type: "png", fullPage: true });
  const screenshotB64 = screenshotBuf.toString("base64");
  const ssPath = path.resolve("test-output-brownbook.png");
  fs.writeFileSync(ssPath, screenshotBuf);
  console.log(`   Screenshot: ${(screenshotBuf.length / 1024).toFixed(0)} KB`);
  console.log(`   Saved to: ${ssPath}\n`);

  // Step 8: Close browser
  await browser.close();
  console.log("8. Browser closed\n");

  // Step 9: Save AutomationJob
  console.log("9. Saving AutomationJob to database...");
  const logs = [
    "=== Submission started ===",
    `URL: ${directory.url}`,
    `Final URL: ${finalUrl}`,
    `Title: ${pageTitle}`,
    `Start time: ${new Date().toISOString()}`,
    `Mode: PREVIEW`,
    `Form fields found: ${formStructure.fields.length}`,
    ...formStructure.fields.map((f, i) => `  [${i + 1}] "${f.label || f.placeholder}" type=${f.type} ${f.selector}${f.required ? " *required" : ""}`),
    `AI mapping: ${mappedEntries.length} of ${formStructure.fields.length} fields mapped`,
    `AI response time: ${aiTime}s`,
    ...mappedEntries.map(([sel, val]) => `  Mapped: ${sel} → "${String(val).slice(0, 60)}"`),
    `Playwright fill: ${filled} OK, ${failed} failed`,
    ...(failed > 0 ? [`Failed fills: ${failed}`] : []),
    `Submit button: ${formStructure.submitSelector ? `"${formStructure.submitText}" (${formStructure.submitSelector})` : "not found"}`,
    `Screenshot: ${(screenshotBuf.length / 1024).toFixed(0)} KB`,
    `=== Submission completed (PREVIEW) ===`,
  ];

  const job = await prisma.automationJob.create({
    data: {
      directoryId: directory.id,
      mode: "PREVIEW",
      status: "SUCCESS",
      screenshot: screenshotB64,
      logs: JSON.stringify(logs),
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });
  console.log(`   Job ID: ${job.id}`);
  console.log(`   Status: ${job.status}\n`);

  // Step 10: Save template
  console.log("10. Saving SubmissionTemplate...");
  await prisma.submissionTemplate.upsert({
    where: { directoryId: directory.id },
    create: {
      directoryId: directory.id,
      fieldMapping: fieldMapping,
      formStructure: formStructure,
      submitSelector: formStructure.submitSelector,
      version: 1,
    },
    update: {
      fieldMapping: fieldMapping,
      formStructure: formStructure,
      submitSelector: formStructure.submitSelector,
      version: { increment: 1 },
    },
  });
  console.log("    ✓ Template saved\n");

  await prisma.$disconnect();

  console.log("============================================");
  console.log("  ✅ TEST PREVIEW COMPLETED SUCCESSFULLY");
  console.log("============================================");
  console.log(`  Directory:    ${directory.platform}`);
  console.log(`  URL:          ${directory.url}`);
  console.log(`  Job status:   SUCCESS`);
  console.log(`  Fields found: ${formStructure.fields.length}`);
  console.log(`  Fields mapped: ${mappedEntries.length}`);
  console.log(`  Fields filled: ${filled}`);
  console.log(`  Fill failed:  ${failed}`);
  console.log(`  Submit btn:   ${formStructure.submitSelector ? "FOUND (would submit: " + formStructure.submitText + ")" : "NOT FOUND"}`);
  console.log(`  Template:     SAVED (v1)`);
  console.log(`  Screenshot:   ${ssPath}`);
  console.log("============================================");
}

main().catch((err) => {
  console.error("\n❌ TEST FAILED:", err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack.slice(0, 500));
  process.exit(1);
});
