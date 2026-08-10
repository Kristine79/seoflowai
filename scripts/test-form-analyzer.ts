/**
 * Fill-path regression harness for the dropdown fill verification fix.
 *
 * Bug fixed: human-submit's fillCurrentFields counted select/readonly fills
 * as success without the value actually landing in the DOM. The loop now
 * delegates to the shared handleSelectField and increments "filled" only
 * after the value was verified in the field.
 *
 * These cases replicate the exact fillCurrentFields loop from
 * scripts/human-submit.ts and assert the ACTUAL DOM state after each attempt
 * (attempted fill -> selected value -> success), not merely "no exception".
 * Synthetic local pages only; nothing is submitted.
 */

import { chromium, type Page } from "playwright";
import { handleSelectField } from "../src/lib/automation/submission-runner";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/**
 * Replicates the fillCurrentFields loop from scripts/human-submit.ts —
 * including the counting rule "filled++ only when the fill was verified".
 */
async function fillLikeHumanSubmit(page: Page, mapping: Record<string, string>) {
  let filled = 0;
  let failed = 0;
  for (const [sel, val] of Object.entries(mapping)) {
    const el = await page.$(sel).catch(() => null);
    if (!el) { failed++; continue; }
    const tag = await el.evaluate((e: Element) => e.tagName.toLowerCase()).catch(() => "");
    const ro = await el.evaluate((e: Element) => !!(e as HTMLInputElement).readOnly).catch(() => false);
    if (tag === "select" || ro) {
      const ok = await handleSelectField(page, sel, val, () => {});
      if (ok) filled++; else failed++;
    } else if (tag === "input" || tag === "textarea") {
      await page.fill(sel, val);
      filled++;
    } else {
      failed++;
    }
  }
  return { filled, failed };
}

const DROPDOWN_WIRING = `
  <script>
    const cat = document.getElementById("category");
    const pop = document.getElementById("popup");
    const search = document.getElementById("popup-search");
    const opts = document.querySelectorAll("#popup [role='option']");
    cat.addEventListener("click", () => { pop.style.display = "block"; search.focus(); });
    search.addEventListener("input", () => {
      const q = search.value.toLowerCase();
      opts.forEach((o) => { o.style.display = o.textContent.toLowerCase().includes(q) ? "" : "none"; });
    });
    opts.forEach((o) => o.addEventListener("click", () => {
      cat.value = o.textContent;
      pop.style.display = "none";
    }));
  </script>`;

const DROPDOWN_HTML = `
  <label>Business category <input id="category" readonly>
    <div id="popup" class="MuiPopover-paper" style="display:none">
      <input id="popup-search" type="text">
      <ul>
        <li role="option">Digital Marketing Agency</li>
        <li role="option">SEO Services</li>
      </ul>
    </div>
  </label>`;

async function runFillRegression() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    // 1. native <select>: mapped value must land, filled++ only on success.
    await page.setContent(`<html><body>
      <label>Business country <select id="country">
        <option value="">Select country</option>
        <option value="US">United States</option>
        <option value="UK">United Kingdom</option>
      </select></label>
    </body></html>`);
    let r = await fillLikeHumanSubmit(page, { "#country": "United States" });
    assert(r.filled === 1 && r.failed === 0, `native select: filled=${r.filled} failed=${r.failed}`);
    const country = await page.evaluate(() => {
      const s = document.querySelector("#country") as HTMLSelectElement;
      return { value: s.value, text: s.selectedOptions[0]?.text || "" };
    });
    assert(country.value === "US" && country.text === "United States", `native select DOM: ${JSON.stringify(country)}`);
    console.log("PASS: native select — value committed, filled incremented");

    // 2. readonly custom dropdown with a matching option: option must be
    //    committed into the DOM, filled++ only after verification.
    await page.setContent(`<html><body>${DROPDOWN_HTML}${DROPDOWN_WIRING}</body></html>`);
    r = await fillLikeHumanSubmit(page, { "#category": "Digital Marketing Agency" });
    assert(r.filled === 1 && r.failed === 0, `readonly dropdown: filled=${r.filled} failed=${r.failed}`);
    const catVal = await page.evaluate(() => (document.querySelector("#category") as HTMLInputElement).value);
    assert(catVal === "Digital Marketing Agency", `readonly dropdown DOM value: ${JSON.stringify(catVal)}`);
    console.log("PASS: readonly custom dropdown — option committed, DOM value set, filled incremented");

    // 3. readonly dropdown WITHOUT a matching option: must NOT report
    //    success; failed must increment and the DOM must stay empty.
    await page.setContent(`<html><body>${DROPDOWN_HTML}${DROPDOWN_WIRING}</body></html>`);
    r = await fillLikeHumanSubmit(page, { "#category": "Non Existent Category 123" });
    assert(r.filled === 0 && r.failed === 1, `no-match dropdown: filled=${r.filled} failed=${r.failed} (must fail, not lie)`);
    const catVal2 = await page.evaluate(() => (document.querySelector("#category") as HTMLInputElement).value);
    assert(catVal2 === "", `no-match dropdown DOM must stay empty, got ${JSON.stringify(catVal2)}`);
    console.log("PASS: readonly dropdown without matching option — filled NOT incremented, failed incremented");

    // 4. plain text/email/url fields must keep working via page.fill.
    await page.setContent(`<html><body>
      <label>Business name <input id="biz"></label>
      <label>Email <input id="email" type="email"></label>
      <label>Website <input id="site" type="url"></label>
    </body></html>`);
    r = await fillLikeHumanSubmit(page, {
      "#biz": "ITllect",
      "#email": "itllect.marketing@gmail.com",
      "#site": "https://itllect.com",
    });
    assert(r.filled === 3 && r.failed === 0, `text fields: filled=${r.filled} failed=${r.failed}`);
    const texts = await page.evaluate(() => ({
      biz: (document.querySelector("#biz") as HTMLInputElement).value,
      email: (document.querySelector("#email") as HTMLInputElement).value,
      site: (document.querySelector("#site") as HTMLInputElement).value,
    }));
    assert(texts.biz === "ITllect" && texts.email === "itllect.marketing@gmail.com" && texts.site === "https://itllect.com", `text DOM: ${JSON.stringify(texts)}`);
    console.log("PASS: text/email/url fields — page.fill path unchanged");

    console.log("Fill-path regression: PASS");
  } finally {
    await browser.close();
  }
}

async function main() {
  await runFillRegression();
  console.log("Fill-path regression harness: PASS");
}

main().catch((error) => {
  console.error("Fill-path regression: FAIL");
  console.error(error);
  process.exitCode = 1;
});
