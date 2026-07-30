require("dotenv").config();

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require(".prisma/client/default");
const pg = require("pg");
const OpenAI = require("openai");
const path = require("path");

// Use the generated client output path
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";

async function main() {
  const directoryId = process.argv[2] || "cms3phboh0009bsutz7uqe7b5";

  const raw = process.env.DATABASE_URL || "";
  const urlObj = new URL(raw);
  urlObj.searchParams.delete("sslmode");
  const pool = new pg.Pool({
    connectionString: urlObj.toString(),
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

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

  console.log("========================================");
  console.log("  TEST PREVIEW SUBMISSION");
  console.log("========================================");
  console.log("Directory ID:", directory.id);
  console.log("Platform:", directory.platform);
  console.log("URL:", directory.url);
  console.log("Status:", directory.status);
  console.log("AutoMode:", directory.automationMode);
  console.log("Company:", directory.company.name);
  console.log("----------------------------------------\n");

  // Build company data
  const c = directory.company;
  const companyData = {
    name: c.name || "",
    legalName: c.legalName || "",
    website: c.website || "",
    email: c.email || "",
    phone: c.phone || "",
    address: c.address || "",
    city: c.city || "",
    state: c.state || "",
    country: c.country || "",
    description: c.descriptionShort || c.descriptionMedium || "",
    services: c.services || "",
    keywords: c.keywords || "",
    category: c.category || "",
  };

  console.log("Company data available:");
  for (const [k, v] of Object.entries(companyData)) {
    if (v) console.log(`  ${k}: "${v.slice(0, 60)}"`);
  }
  console.log("");

  // Now import the submission runner
  // Since we need ESM, let me require via dynamic import
  const { chromium } = require("playwright");
  const fs = require("fs");

  // ====== Manual test: do everything step by step ======
  
  console.log("1. Launching Playwright browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log("   Browser ready\n");

  // Navigate
  console.log(`2. Navigating to ${directory.url}...`);
  await page.goto(directory.url, { waitUntil: "networkidle", timeout: 30000 });
  console.log(`   Title: ${await page.title()}`);
  console.log(`   Final URL: ${page.url()}\n`);

  // Check form quality
  console.log("3. Analyzing page...");
  const quality = await page.evaluate(() => {
    const html = document.body.innerHTML.toLowerCase();
    const captchaKeywords = ["recaptcha", "g-recaptcha", "hcaptcha", "cf-turnstile", "captcha", "i am not a robot"];
    const hasCaptcha = captchaKeywords.some(kw => html.includes(kw)) ||
      !!document.querySelector("iframe[src*='recaptcha'], iframe[src*='hcaptcha'], .g-recaptcha, .h-captcha");
    const formElements = document.querySelectorAll("input:not([type=hidden]), select, textarea");
    const requiredFields = Array.from(formElements).filter(el => el.hasAttribute("required") || el.getAttribute("aria-required") === "true").length;
    return { hasCaptcha, totalFields: formElements.length, requiredFields, title: document.title };
  });
  console.log(`   Title: ${quality.title}`);
  console.log(`   Captcha: ${quality.hasCaptcha}`);
  console.log(`   Total fields: ${quality.totalFields}`);
  console.log(`   Required fields: ${quality.requiredFields}`);

  if (quality.totalFields === 0) {
    console.log("\n   ❌ NO FORM FIELDS FOUND");
    await browser.close();
    process.exit(1);
  }

  // Extract form structure
  console.log("\n4. Extracting form structure...");
  const SUBMIT_KEYWORDS = ["submit", "register", "create account", "send", "add company", "add listing", "continue", "sign up", "join", "get started", "add business", "list my business", "add my business", "next", "weiter", "weiter zur Anmeldung", "eintragen", "absenden"];
  const formStructure = await page.evaluate((kwList) => {
    const formElements = document.querySelectorAll("input:not([type=hidden]), select, textarea, button, a[role=button]");
    const fields = [];
    let submitSelector = null;
    let submitText = null;

    formElements.forEach((el) => {
      const tag = el.tagName.toLowerCase();

      // Submit button detection
      if (el instanceof HTMLButtonElement || tag === "button") {
        const text = (el.textContent || "").trim().toLowerCase();
        if (text && kwList.some(kw => text.includes(kw))) {
          submitSelector = el.id ? "#" + el.id : el.className ? "." + el.className.split(" ").join(".") : 'button:has-text("' + (el.textContent?.trim() || "") + '")';
          submitText = el.textContent?.trim() || null;
          return;
        }
      }
      if (el instanceof HTMLInputElement && el.type === "submit") {
        const val = (el.value || "").trim().toLowerCase();
        if (kwList.some(kw => val.includes(kw) || kw.includes(val))) {
          submitSelector = 'input[type=submit]' + (el.name ? '[name="' + el.name + '"]' : '');
          submitText = el.value || null;
          return;
        }
      }

      // Skip submit buttons in field list
      if (el instanceof HTMLInputElement && (el.type === "submit" || el.type === "button")) return;
      if (el instanceof HTMLButtonElement && (el.type === "submit" || el.type === "button")) return;

      // Get label
      let label = "";
      if (el.id) {
        const labelEl = document.querySelector("label[for='" + el.id + "']");
        if (labelEl) label = labelEl.textContent?.trim() || "";
      }
      if (!label) {
        const parent = el.closest("label");
        if (parent) label = parent.textContent?.trim() || "";
      }

      const selector = el.id ? "#" + el.id : (el.name ? '[name="' + el.name + '"]' : (el.className ? "." + el.className.split(" ").join(".") : ""));
      if (selector) {
        fields.push({
          selector,
          type: el instanceof HTMLInputElement ? el.type : tag,
          label,
          placeholder: el.placeholder || "",
          required: el.hasAttribute("required") || el.getAttribute("aria-required") === "true",
        });
      }
    });

    return { fields, submitSelector, submitText };
  }, SUBMIT_KEYWORDS);

  console.log(`   Fields found: ${formStructure.fields.length}`);
  for (const f of formStructure.fields) {
    console.log(`     [${f.type}] "${f.label || f.placeholder}" selector=${f.selector} req=${f.required}`);
  }
  console.log(`   Submit button: ${formStructure.submitSelector ? '"' + formStructure.submitText + '" (' + formStructure.submitSelector + ')' : "NOT FOUND"}`);

  if (formStructure.fields.length === 0) {
    console.log("\n   ❌ NO FIELDS EXTRACTED");
    await browser.close();
    process.exit(1);
  }

  // AI field mapping
  console.log("\n5. AI field mapping...");
  
  const fieldDescriptions = formStructure.fields
    .map((f, i) => `${i + 1}. selector="${f.selector}" label="${f.label}" placeholder="${f.placeholder}" type="${f.type}" required=${f.required}`)
    .join("\n");
  const companyInfo = Object.entries(companyData)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const prompt = `You are a form-filling assistant. Map company data fields to form fields.

COMPANY DATA:
${companyInfo}

FORM FIELDS:
${fieldDescriptions}

For each form field (by selector), provide the value to fill. Respond with a JSON object where keys are CSS selectors and values are the text to enter. Skip submit buttons, checkboxes, and non-input fields. Use empty string for fields you cannot map.`;

  console.log("   Calling OpenAI...");
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  let fieldMapping = {};
  if (content) {
    try {
      fieldMapping = JSON.parse(content);
    } catch (e) {
      console.log("   ⚠ JSON parse error:", e.message);
    }
  }

  const mappedCount = Object.entries(fieldMapping).filter(([, v]) => v && v.length > 0).length;
  console.log(`   AI mapped ${mappedCount} of ${formStructure.fields.length} fields`);

  if (mappedCount === 0) {
    console.log("   Raw AI response:", content?.slice(0, 300));
    console.log("\n   ❌ AI COULD NOT MAP FIELDS");
    await browser.close();
    process.exit(1);
  }

  for (const [sel, val] of Object.entries(fieldMapping)) {
    if (val) {
      const fieldInfo = formStructure.fields.find(f => f.selector === sel);
      console.log(`     ${sel} → "${String(val).slice(0, 60)}" (${fieldInfo?.label || fieldInfo?.placeholder || ""})`);
    }
  }

  // Fill fields
  console.log("\n6. Filling form fields...");
  let filled = 0;
  let failed = 0;
  for (const [selector, value] of Object.entries(fieldMapping)) {
    if (!value) continue;
    try {
      await page.fill(selector, String(value));
      filled++;
      const fl = formStructure.fields.find(f => f.selector === selector);
      console.log(`   ✓ "${fl?.label || fl?.placeholder || selector}" = "${String(value).slice(0, 50)}"`);
    } catch (err) {
      failed++;
      console.log(`   ✗ Could not fill ${selector}: ${err.message?.slice(0, 80)}`);
    }
  }
  console.log(`   Result: ${filled} filled, ${failed} failed`);

  // Take screenshot
  console.log("\n7. Taking screenshot...");
  const screenshotBuffer = await page.screenshot({ type: "png", fullPage: true });
  const screenshotB64 = screenshotBuffer.toString("base64");
  console.log(`   Screenshot: ${(screenshotBuffer.length / 1024).toFixed(0)} KB`);

  // Save screenshot to file
  const ssPath = path.join(__dirname, "..", "test-output-brownbook.png");
  fs.writeFileSync(ssPath, screenshotBuffer);
  console.log(`   Saved to: ${ssPath}`);

  // Save result to DB
  console.log("\n8. Saving AutomationJob...");
  const logs = [
    "=== Submission started ===",
    `URL: ${directory.url}`,
    `Final URL: ${page.url()}`,
    `Title: ${quality.title}`,
    `Start time: ${new Date().toISOString()}`,
    `Mode: PREVIEW`,
    `Fields found: ${formStructure.fields.length}`,
    ...formStructure.fields.map((f, i) => `  Field ${i + 1}: "${f.label || f.placeholder}" (${f.type})${f.required ? " *required" : ""} ${f.selector}`),
    `AI mapping: ${mappedCount} of ${formStructure.fields.length} fields matched`,
    ...Object.entries(fieldMapping).filter(([, v]) => v).map(([sel, val]) => `  Mapped: ${sel} → "${String(val).slice(0, 60)}"`),
    `Fields filled: ${filled} of ${mappedCount}`,
    ...(failed > 0 ? [`Fill failures: ${failed}`] : []),
    `Submit button: ${formStructure.submitSelector || "not found"}`,
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
  console.log(`   Job ID: ${job.id}, Status: ${job.status}`);

  // Save template
  console.log("\n9. Saving SubmissionTemplate...");
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
  console.log("   Template saved");

  await browser.close();
  await prisma.$disconnect();

  console.log("\n========================================");
  console.log("  ✅ TEST COMPLETE");
  console.log("========================================");
  console.log("Directory:", directory.platform);
  console.log("URL:", directory.url);
  console.log("Job status: SUCCESS");
  console.log("Fields found:", formStructure.fields.length);
  console.log("Fields mapped:", mappedCount);
  console.log("Fields filled:", filled);
  console.log("Submit button:", formStructure.submitSelector ? "FOUND" : "NOT FOUND");
  console.log("Template saved: YES");
  console.log("Screenshot:", ssPath);
  console.log("Logs:", logs.length, "lines");
  console.log("========================================");
}

main().catch((err) => {
  console.error("\n❌ FAILED:", err.message);
  if (err.stack) console.error(err.stack.slice(0, 500));
  process.exit(1);
});
