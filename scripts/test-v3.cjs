require("dotenv").config();
const { chromium } = require("playwright");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const NEXT_KW = ["next", "continue", "proceed", "step 2", "step 3", "step 4", "step 5", "далее", "продолжить", "дальше", "weiter"];
const SUBMIT_KW = ["submit", "register", "create account", "send", "add company", "add listing", "sign up", "join", "get started", "add business", "list my business", "add my business", "отправить", "зарегистрироваться", "создать", "добавить"];
const MAX_STEPS = 5;

const companyData = {
  name: "ITLLECT GmbH",
  legalName: "ITLLECT Gesellschaft mit beschränkter Haftung",
  website: "https://itllect.com",
  email: "info@itllect.com",
  phone: "+49 89 12345678",
  address: "Musterstraße 1",
  city: "München",
  state: "Bayern",
  country: "Germany",
  description: "ITLLECT ist ein innovatives Softwareentwicklungsunternehmen mit Fokus auf KI und Webtechnologien.",
  services: "Webentwicklung, Mobile Apps, KI-Lösungen, SEO Services, Cloud Infrastruktur",
  keywords: "Softwareentwicklung, KI, Machine Learning, Webentwicklung, Mobile Apps",
  category: "Softwareentwicklung",
};

async function extractForm(page) {
  return page.evaluate((kwList) => {
    const all = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea, button:not([type=button])");
    const fields = [];
    let submitSel = null, submitText = null;

    for (const el of all) {
      const tag = el.tagName.toLowerCase();
      const txt = (el.textContent || el.value || "").trim().toLowerCase();

      if (tag === "button" && txt && kwList.some(k => txt.includes(k))) {
        submitSel = el.id ? "#" + el.id : "." + Array.from(el.classList).join(".");
        submitText = el.textContent?.trim() || null;
        continue;
      }
      if (el instanceof HTMLInputElement && el.type === "submit" && txt && kwList.some(k => txt.includes(k))) {
        submitSel = 'input[type=submit]' + (el.name ? '[name="' + el.name + '"]' : "");
        submitText = el.value || null;
        continue;
      }

      if ((el instanceof HTMLInputElement && (el.type === "submit" || el.type === "button")) || tag === "button") continue;

      let label = "";
      if (el.id) { const l = document.querySelector("label[for='" + el.id + "']"); if (l) label = l.textContent?.trim() || ""; }
      if (!label) { const p = el.closest("label"); if (p) label = p.textContent?.trim() || ""; }

      const sel = el.id ? "#" + el.id : (el.name ? '[name="' + el.name + '"]' : (el.className ? "." + Array.from(el.classList).join(".") : ""));
      if (sel) {
        fields.push({
          selector: sel, type: el instanceof HTMLInputElement ? el.type : tag,
          label, placeholder: el.placeholder || "",
          required: el.hasAttribute("required") || el.getAttribute("aria-required") === "true",
          readOnly: el.hasAttribute("readonly"),
        });
      }
    }
    return { fields, submitSelector: submitSel, submitText };
  }, [...NEXT_KW, ...SUBMIT_KW]);
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
        return s.options.length > 1 ? s.options[1].value : null;
      }, { sel: selector, val: value });
      if (match) { await page.selectOption(selector, match); logFn(`  ✓ Selected option: "${match}"`); return true; }
    } catch { return false; }
    return false;
  }

  // Detect readOnly (MUI Autocomplete / non-native dropdown)
  const isReadOnly = await page.evaluate(sel => {
    const e = document.querySelector(sel);
    return e && e.hasAttribute("readonly");
  }, selector);

  if (isReadOnly) {
    logFn(`  ⚡ ReadOnly input detected — MUI Autocomplete / dropdown`);

    // Open the dropdown by clicking
    try {
      await page.click(selector);
      await page.waitForTimeout(500);
    } catch {
      await page.click(selector.replace("#", "#") + ", " + selector.replace("#", "#") + " + div, " + selector.replace("#", "#") + " ~ div");
      await page.waitForTimeout(500);
    }

    // Check for popup with search field (MUI pattern)
    const popupSearch = await page.evaluate(() => {
      const popover = document.querySelector(".MuiPopover-paper, [class*=popper], [class*=popup]");
      if (!popover) return null;
      const searchInput = popover.querySelector("input[type=text]:not([readonly])");
      return searchInput ? searchInput.id || searchInput.placeholder || "found" : null;
    });

    if (popupSearch) {
      logFn(`  ⚡ Popup search field detected: "${popupSearch}"`);

      // Type into the search field using locator
      const searchInput = page.locator(".MuiPopover-paper input[type=text]:not([readonly])").first();
      if (await searchInput.count() > 0) {
        // Try progressively shorter search terms
        const searchTerms = [value, value.split(" ")[0], value.slice(0, Math.min(8, value.length))];
        let selected = false;

        for (const term of [...new Set(searchTerms)]) {
          if (selected) break;
          if (!term || term.length < 2) continue;

          await searchInput.click();
          await page.waitForTimeout(100);
          // Clear field
          await searchInput.fill("");
          await page.waitForTimeout(200);
          await searchInput.type(term, { delay: 25 });

          try {
            await page.waitForSelector('.MuiList-root [role="button"]', { timeout: 6000 });
            const optionEls = page.locator('.MuiList-root [role="button"]');
            const optCount = await optionEls.count();

            if (optCount > 0) {
              const optTexts = await optionEls.allTextContents();
              const v = value.toLowerCase();
              const searchWords = v.split(/\s+/).filter(Boolean);
              const wordCount = searchWords.length;
              const scored = optTexts.map((t, i) => {
                const tl = t.toLowerCase();
                if (tl === v) return { idx: i, score: 100 };
                if (tl.startsWith(v)) return { idx: i, score: 50 };
                const matchCount = searchWords.filter(w => tl.includes(w)).length;
                return { idx: i, score: matchCount };
              });
              const bestResult = scored.reduce((a, b) => a.score >= b.score ? a : b);
              if (bestResult.score >= Math.min(2, wordCount)) {
                const best = optTexts[bestResult.idx];
                if (best) {
                  const bestIdx = optTexts.indexOf(best);
                  logFn(`  Options after search "${term}": ${optCount}, selecting: "${best.slice(0, 40)}"`);
                  await optionEls.nth(bestIdx).click();
                  await page.waitForTimeout(300);
                  await page.keyboard.press("Escape");
                  await page.waitForTimeout(200);
                  selected = true;
                }
              }
            }
          } catch {
            logFn(`  No results for "${term}"`);
          }
        }

        if (selected) return true;

        // Fallback: press Enter
        logFn(`  No options matched for any search term, pressing Enter`);
        await searchInput.fill("");
        await page.waitForTimeout(100);
        await searchInput.type(value.slice(0, 4), { delay: 25 });
        await page.waitForTimeout(1000);
        await searchInput.press("Enter");
        await page.waitForTimeout(500);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
        return true;
      }
    }

    logFn(`  Dismissing popup`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    return false;
  }

  // React-select / other autocomplete
  const isReact = await page.evaluate(sel => {
    const e = document.querySelector(sel);
    if (!e) return false;
    return e.getAttribute("role") === "combobox" || !!e.closest("[class*='select' i], [class*='dropdown' i], [class*='autocomplete' i]");
  }, selector);

  if (!isReact) return false;
  logFn(`  ⚡ React-select / autocomplete detected`);

  try {
    await page.click(selector);
    await page.waitForTimeout(400);

    const visible = await page.evaluate(() => {
      for (const m of document.querySelectorAll("[class*='menu' i], [class*='option' i], [role='listbox']")) {
        const s = window.getComputedStyle(m);
        if (s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0") return true;
      }
      return false;
    });

    if (!visible) {
      await page.keyboard.type(value, { delay: 50 });
      await page.waitForTimeout(600);
    }

    const options = await page.evaluate(() => {
      const seen = new Set();
      return Array.from(document.querySelectorAll("[class*='option' i], [role='option'], [class*='menu' i] div, li, [class*='item' i]"))
        .map(el => el.textContent?.trim() || "")
        .filter(t => t && t.length < 100 && !seen.has(t) && seen.add(t));
    });

    logFn(`  Options found: ${options.length}`);
    if (options.length > 0) logFn(`  Options: ${options.slice(0, 6).map(o => `"${o.slice(0, 30)}"`).join(", ")}`);

    if (options.length === 0) {
      logFn(`  No dropdown options, using fill()`);
      await page.fill(selector, value);
      return true;
    }

    const v = value.toLowerCase();
    const searchWords = v.split(/\s+/).filter(Boolean);
    const best = options.find(o => o.toLowerCase() === v) ||
      options.find(o => o.toLowerCase().startsWith(v)) ||
      options.find(o => searchWords.some(w => o.toLowerCase().includes(w))) ||
      options[0];
    const optEls = await page.$$("[class*='option' i], [role='option'], [class*='menu' i] div, li, [class*='item' i]");
    const idx = options.indexOf(best);

    if (idx >= 0 && optEls[idx]) {
      await optEls[idx].click();
      await page.waitForTimeout(300);
      logFn(`  ✓ Selected: "${best.slice(0, 40)}"`);
      return true;
    }

    logFn(`  No option match, filling directly`);
    await page.fill(selector, value);
    return true;
  } catch (e) {
    logFn(`  ⚠ Select handler: ${e.message?.slice(0, 60)}, fallback fill`);
    try { await page.fill(selector, value); return true; } catch { return false; }
  }
}

async function findNextBtn(page) {
  const result = await page.evaluate(({ next, submit }) => {
    const btns = document.querySelectorAll("button, input[type=submit]");
    for (const el of btns) {
      const text = (el.textContent || el.value || "").trim().toLowerCase();
      if (!text) continue;
      const btnText = el.textContent?.trim() || el.value || "";
      const isNext = next.some(k => text.includes(k));
      const isSubmit = submit.some(k => text.includes(k));
      if (isNext && !isSubmit) return btnText;
    }
    return null;
  }, { next: NEXT_KW, submit: SUBMIT_KW });

  if (!result) return null;
  const escaped = result.replace(/"/g, '\\"');
  return { selector: `button:has-text("${escaped}")`, text: result };
}

async function main() {
  const logs = [];
  const l = msg => { logs.push(msg); console.log(`  ${msg}`); };

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL || undefined });

  console.log("============================================");
  console.log("  TEST V3: PREVIEW (multi-step + react-select)");
  console.log("============================================");
  console.log(`  Company: ${companyData.name}`);
  console.log(`  URL: https://www.brownbook.net/add-business`);
  console.log("============================================\n");

  l("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  l("✓ Browser ready");

  l("Navigating to Brownbook...");
  await page.goto("https://www.brownbook.net/add-business", { waitUntil: "load", timeout: 60000 });
  l(`✓ Title: ${await page.title()}`);
  l(`✓ URL: ${page.url()}`);

  const quality = await page.evaluate(() => {
    const html = document.body.innerHTML.toLowerCase();
    const hasCaptcha = /recaptcha|g-recaptcha|hcaptcha|cf-turnstile|captcha/i.test(html);
    const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
    return { hasCaptcha, total: inputs.length };
  });
  l(`Fields: ${quality.total}, Captcha: ${quality.hasCaptcha}`);

  if (quality.hasCaptcha) { l("❌ CAPTCHA!"); process.exit(1); }

  let allFields = [];
  let combinedMapping = {};
  let totalFilled = 0;
  let totalFailed = 0;
  let prevFieldCount = 0;
  let noNewFieldSteps = 0;
  let lastMapping = {};

  for (let step = 0; step < MAX_STEPS; step++) {
    l(`\n========== STEP ${step + 1} ==========`);

    const fs = await extractForm(page);
    l(`Fields: ${fs.fields.length}`);

    const newFields = fs.fields.filter(f => !allFields.some(a => a.selector === f.selector));
    const newCount = newFields.length;
    const uniqueCount = [...new Map([...allFields, ...fs.fields].map(f => [f.selector, f])).values()].length;
    l(`New: ${newCount}, Total unique: ${uniqueCount}`);

    for (const f of fs.fields) {
      l(`  [${f.type}] "${f.label || f.placeholder}" ${f.selector}${f.required ? " *" : ""}${f.readOnly ? " [readOnly]" : ""}`);
    }

    // Decide whether to call AI
    let mapping = {};
    if (newCount === 0 && lastMapping && Object.keys(lastMapping).length > 0) {
      l(`\nNo new fields — reusing previous AI mapping`);
      mapping = { ...lastMapping };
    } else {
      const fieldDesc = fs.fields.map((f, i) => `${i + 1}. selector="${f.selector}" label="${f.label}" placeholder="${f.placeholder}" type="${f.type}" required=${f.required}`).join("\n");
      const companyInfo = Object.entries(companyData).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
      const prompt = `Map company data to form fields.\n\nCOMPANY DATA:\n${companyInfo}\n\nFORM FIELDS:\n${fieldDesc}\n\nReturn JSON where keys are CSS selectors and values are text to enter. Skip buttons/checkboxes.`;

      l(`\nAI mapping...`);
      const aiStart = Date.now();
      const resp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });
      const aiTime = ((Date.now() - aiStart) / 1000).toFixed(1);

      try { mapping = JSON.parse(resp.choices[0]?.message?.content || "{}"); } catch { l(`JSON parse error`); }

      const fillable = Object.entries(mapping).filter(([, v]) => v && String(v).length > 0);
      l(`AI (${aiTime}s): ${fillable.length} of ${fs.fields.length} fields mapped`);

      for (const [sel, val] of fillable) {
        const info = fs.fields.find(f => f.selector === sel);
        l(`  ${sel} → "${String(val).slice(0, 50)}" [${info?.label || info?.placeholder || "?"}]`);
      }

      lastMapping = { ...mapping };
    }

    // Fill
    let filled = 0, failed = 0;
    for (const [sel, val] of Object.entries(mapping)) {
      if (!val || !String(val).trim()) continue;
      const fieldInfo = fs.fields.find(f => f.selector === sel);
      const label = fieldInfo?.label || fieldInfo?.placeholder || sel;
      try {
        await page.fill(sel, String(val));
        filled++;
        l(`  ✓ [${filled}] "${label}" = "${String(val).slice(0, 50)}"`);
      } catch {
        const ok = await handleSelect(page, sel, String(val), l);
        if (ok) { filled++; }
        else { failed++; l(`  ✗ [${filled + failed}] "${label}": cannot fill`); }
      }
    }
    l(`Step ${step + 1}: ${filled} filled, ${failed} failed`);

    totalFilled += filled;
    totalFailed += failed;
    const uniqueMap = new Map();
    for (const f of [...allFields, ...fs.fields]) uniqueMap.set(f.selector, f);
    allFields = Array.from(uniqueMap.values());
    Object.assign(combinedMapping, mapping);

    // Stop if no fills for 2+ steps
    if (filled === 0 && failed === 0) { l("\nNo fields to fill — stopping"); break; }
    if (newCount === 0) {
      noNewFieldSteps++;
      if (noNewFieldSteps >= 2) { l("\nNo new fields for 2 steps — stopping"); break; }
    } else {
      noNewFieldSteps = 0;
    }

    // Check next step
    const next = await findNextBtn(page);
    if (!next) { l("\n✓ No next step button — final step reached"); break; }

    l(`\n→ Clicking "${next.text}" (${next.selector})...`);
    await page.click(next.selector);
    await page.waitForTimeout(2000);
    l(`  New URL: ${page.url()}`);
  }

  l(`\n========== SUMMARY ==========`);
  l(`Total unique fields: ${allFields.length}`);
  l(`Total fields filled: ${totalFilled}`);
  l(`Total failures: ${totalFailed}`);
  l(`Field mapping entries: ${Object.keys(combinedMapping).length}`);

  // Validation
  const requiredUnfilled = allFields.filter(f => f.required && (!combinedMapping[f.selector] || !String(combinedMapping[f.selector]).trim()));
  l(`Required fields unfilled: ${requiredUnfilled.length > 0 ? requiredUnfilled.map(f => `"${f.label || f.placeholder}"`).join(", ") : "none ✓"}`);

  l(`\nTaking screenshot...`);
  const ss = await page.screenshot({ type: "png", fullPage: true });
  const ssPath = path.resolve("test-output-v3.png");
  fs.writeFileSync(ssPath, ss);
  l(`Screenshot: ${(ss.length / 1024).toFixed(0)} KB`);

  l(`\n✅ TEST COMPLETE`);
  l(`Screenshot: ${ssPath}`);

  console.log("\n\n========== FULL LOG ==========");
  for (const line of logs) console.log(line);

  await browser.close();
}

main().catch(e => {
  console.error("\n❌ FAILED:", e.message);
  if (e.stack) console.error(e.stack.slice(0, 500));
  process.exit(1);
});
