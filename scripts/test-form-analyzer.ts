/**
 * Safe Form Analyzer regression harness.
 *
 * Synthetic cases cover extraction + form quality (read-only), plus the
 * fill-path regression (native select / readonly custom dropdown / plain
 * inputs) which asserts the ACTUAL DOM state after fill — a reported
 * success must mean the value landed in the field — and the submit
 * regression (runSubmission must only report success with real evidence:
 * navigation or an explicit confirmation state). Nothing is submitted
 * outside local synthetic pages.
 * Pass --bark to run the read-only live Bark regression as well.
 */

import http from "http";
import { chromium, type Page } from "playwright";
import { extractFormStructure, checkFormQuality } from "../src/lib/automation/form-analyzer";
import { handleSelectField, runSubmission } from "../src/lib/automation/submission-runner";
import { closeBrowser } from "../src/lib/automation/browser";

type SyntheticCase = {
  name: string;
  html: string;
  assert: (page: Page) => Promise<void>;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function analyze(page: Page) {
  return {
    structure: await extractFormStructure(page),
    quality: await checkFormQuality(page),
  };
}

const cases: SyntheticCase[] = [
  {
    name: "normal registration form",
    html: `
      <form>
        <label>Business name <input id="business" name="business"></label>
        <label>Email <input id="email" type="email"></label>
        <label>Website <input id="website" type="url"></label>
        <label>Phone <input id="phone" type="tel"></label>
        <button id="submit">Create account</button>
      </form>`,
    assert: async (page) => {
      const { structure } = await analyze(page);
      assert(structure.fields.length === 4, `expected 4 fields, got ${structure.fields.length}`);
      assert(structure.submitSelector === "#submit", `unexpected submit selector: ${structure.submitSelector}`);
    },
  },
  {
    name: "hidden marketing forms",
    html: `
      <form style="display:none"><input name="hidden-company"><input type="email" name="hidden-email"></form>
      <form>
        <label>Company name <input id="company"></label>
        <label>Email <input id="email" type="email"></label>
        <button id="register">Register</button>
      </form>`,
    assert: async (page) => {
      const { structure } = await analyze(page);
      assert(structure.fields.map((field) => field.selector).join(",") === "#company,#email", "hidden fields leaked into result");
      assert(structure.submitSelector === "#register", "visible registration CTA was not selected");
    },
  },
  {
    name: "SPA active step",
    html: `
      <div id="step-1" data-step="1">
        <label>Category <input id="signup-choose-category"></label>
        <button id="next">Get started</button>
      </div>
      <div id="step-2" data-step="2" style="display:none">
        <input id="future"><button id="sms-verification-continue">Continue</button>
      </div>`,
    assert: async (page) => {
      const { structure } = await analyze(page);
      assert(structure.fields.length === 1 && structure.fields[0].selector === "#signup-choose-category", "inactive SPA fields leaked into result");
      assert(structure.submitText === "Get started", `unexpected active CTA: ${structure.submitText}`);
    },
  },
  {
    name: "cookie banner",
    html: `
      <div id="CybotCookiebotDialog">
        <input id="cookie-email" type="email"><input id="cookie-consent" type="checkbox">
        <button>Accept cookies</button>
      </div>
      <form><input id="company" name="company"><button id="go">Sign up</button></form>`,
    assert: async (page) => {
      const { structure } = await analyze(page);
      assert(structure.fields.length === 1 && structure.fields[0].selector === "#company", "cookie controls leaked into fields");
      assert(structure.submitText === "Sign up", "cookie control became submit CTA");
    },
  },
  {
    name: "search and navigation controls",
    html: `
      <input id="site-search" type="search"><nav><input name="navigation-query"></nav>
      <form><input id="company" name="company"><button>Continue</button></form>`,
    assert: async (page) => {
      const { structure } = await analyze(page);
      assert(structure.fields.length === 1 && structure.fields[0].selector === "#company", "search/navigation controls leaked into fields");
    },
  },
  {
    name: "captcha detection",
    html: `<form><input name="email" type="email"><div class="cf-turnstile" style="width:300px;height:65px"></div></form>`,
    assert: async (page) => {
      const { quality } = await analyze(page);
      assert(quality.hasCaptcha, "visible Turnstile was not detected");
      await page.setContent(`<p>This page mentions captcha in documentation.</p><form><input name="email" type="email"></form>`);
      const ordinary = await checkFormQuality(page);
      assert(!ordinary.hasCaptcha && !ordinary.hasCloudflareChallenge, "ordinary captcha text caused a false positive");
    },
  },
  {
    name: "offscreen controls",
    html: `
      <form>
        <input id="visible-company" name="company">
        <input id="offscreen" name="offscreen" style="position:absolute;left:-10000px;top:0">
        <button id="visible">Register</button>
        <button id="future" style="position:absolute;left:-10000px">Continue</button>
      </form>`,
    assert: async (page) => {
      const { structure } = await analyze(page);
      assert(!structure.fields.some((field) => field.selector === "#offscreen"), "offscreen field leaked into active fields");
      assert(structure.submitSelector === "#visible", `offscreen CTA won ranking: ${structure.submitSelector}`);
    },
  },
  {
    name: "competing same-text CTAs (nav vs in-form)",
    html: `
      <header><a href="/pricing" role="button">Get started</a></header>
      <form>
        <label>Category <input id="signup-choose-category" placeholder="What service do you provide?"></label>
        <button id="advance">Get started</button>
      </form>`,
    assert: async (page) => {
      const { structure } = await analyze(page);
      assert(structure.submitSelector === "#advance", `nav CTA won ranking: ${structure.submitSelector}`);
      assert(structure.fields.length === 1 && structure.fields[0].selector === "#signup-choose-category", "category field missing");
    },
  },
  {
    name: "multi-step advance uses analyzer selector (integration path)",
    html: `
      <header><a href="/pricing" role="button">Get started</a></header>
      <div id="step-1" data-step="1">
        <label>Category <input id="signup-choose-category" placeholder="What service do you provide?"></label>
        <button id="advance">Get started</button>
      </div>
      <div id="step-2" data-step="2" style="display:none">
        <input id="step2-email" type="email">
        <button id="create">Create account</button>
      </div>`,
    assert: async (page) => {
      const first = await analyze(page);
      assert(first.structure.submitSelector === "#advance", `analyzer did not scope to in-form CTA: ${first.structure.submitSelector}`);
      await page.click(first.structure.submitSelector as string);
      await page.waitForTimeout(100);
      await page.evaluate(() => {
        const step2 = document.getElementById("step-2");
        if (step2) (step2 as HTMLElement).style.display = "block";
        const step1 = document.getElementById("step-1");
        if (step1) (step1 as HTMLElement).style.display = "none";
      });
      const second = await analyze(page);
      assert(second.structure.fields.length === 1 && second.structure.fields[0].selector === "#step2-email", "step-2 field not extracted after advance");
      assert(second.structure.submitSelector === "#create", "final submit control not selected after advance");
    },
  },
];

async function runBark() {
  // Bark's edge returns a different response to HeadlessChrome. Keep the
  // live check headed, while synthetic coverage remains headless and isolated.
  const barkBrowser = await chromium.launch({ headless: false });
  const page = await barkBrowser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    await page.goto("https://www.bark.com/en/us/sellers/create/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);
    const { structure } = await analyze(page);
    const barkBody = (await page.locator("body").innerText()).slice(0, 300);
    console.log(`Bark URL: ${page.url()}`);
    console.log(`Bark title: ${await page.title()}`);
    console.log(`Bark body: ${barkBody}`);
    console.log(`Bark extracted: ${JSON.stringify(structure)}`);
    if (/403|request blocked|access denied|cloudflare/i.test(barkBody)) {
      console.log("Bark regression: EXTERNAL/UNAVAILABLE (site blocked the read-only request)");
      return;
    }
    assert(structure.fields.some((field) => field.selector === "#signup-choose-category"), "Bark active category field not detected");
    assert(structure.submitText === "Get started", `unexpected Bark CTA: ${structure.submitText}`);
    assert(structure.fields.every((field) => field.selector !== "#sms-verification-continue"), "Bark hidden SMS control leaked into fields");
    assert(structure.submitSelector !== "#sms-verification-continue", "Bark hidden SMS CTA was selected");
    console.log("Bark regression: PASS (read-only extraction)");
  } finally {
    await barkBrowser.close();
  }
}

/**
 * Fill-path regression (bug: human-submit counted select/readonly fills as
 * success without the value landing in the DOM).
 *
 * Replicates the exact fillCurrentFields loop from scripts/human-submit.ts —
 * including the counting rule "filled++ only when the fill was verified" —
 * and asserts the ACTUAL DOM state after each attempt.
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

/**
 * Submit regression (bug: runSubmission returned success=true when the form
 * was NOT actually submitted — "button clicked" was treated as "form
 * submitted"). runSubmission must only report success with confirmed
 * evidence: navigation, explicit confirmation state, or email verification.
 * Runs the REAL runSubmission() against local synthetic pages; no real data.
 */
async function runSubmissionRegression() {
  const REQUIRED_FORM = (extra: string) => `<!DOCTYPE html><html><body>
    <h1>Add your business</h1>
    <form id="reg" onsubmit="return false;">
      <label>Business name <input id="biz" name="biz" required></label>
      <label>Email <input id="email" type="email" name="email" required></label>
      <label>Phone <input id="phone" type="tel" name="phone" required></label>
      <label>Website <input id="site" type="url" name="site" required></label>
      ${extra}
      <button type="submit" id="submit">Submit</button>
    </form>
  </body></html>`;

  const DROPDOWN = `
    <label>Country <input id="country" readonly required>
      <div id="popup" class="MuiPopover-paper" style="display:none">
        <input id="popup-search" type="text">
        <ul><li role="option">Select country</li><li role="option">Canada</li></ul>
      </div>
    </label>
    <script>
      const cat = document.getElementById("country");
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

  const AJAX_SUCCESS = `<!DOCTYPE html><html><body>
    <h1>Add your business</h1>
    <form id="reg">
      <label>Business name <input id="biz" name="biz" required></label>
      <label>Email <input id="email" type="email" name="email" required></label>
      <label>Phone <input id="phone" type="tel" name="phone" required></label>
      <label>Website <input id="site" type="url" name="site" required></label>
      <button type="submit" id="submit">Submit</button>
    </form>
    <div id="conf" style="display:none">Thank you! Your submission was successful.</div>
    <script>
      document.getElementById("reg").addEventListener("submit", (e) => {
        e.preventDefault();
        document.getElementById("reg").style.display = "none";
        document.getElementById("conf").style.display = "block";
      });
    </script>
  </body></html>`;

  const NAV_SUCCESS = `<!DOCTYPE html><html><body>
    <h1>Add your business</h1>
    <form id="reg" action="/success" method="get">
      <label>Business name <input id="biz" name="biz" required></label>
      <label>Email <input id="email" type="email" name="email" required></label>
      <label>Phone <input id="phone" type="tel" name="phone" required></label>
      <label>Website <input id="site" type="url" name="site" required></label>
      <button type="submit" id="submit">Submit</button>
    </form>
  </body></html>`;

  const EMAIL_VERIFY_FORM = `<!DOCTYPE html><html><body>
    <h1>Add your business</h1>
    <form id="reg" action="/verify" method="get">
      <label>Business name <input id="biz" name="biz" required></label>
      <label>Email <input id="email" type="email" name="email" required></label>
      <label>Phone <input id="phone" type="tel" name="phone" required></label>
      <label>Website <input id="site" type="url" name="site" required></label>
      <button type="submit" id="submit">Submit</button>
    </form>
  </body></html>`;

  const PAGES: Record<string, string> = {
    "/blocked": REQUIRED_FORM(""),
    "/failed-field": REQUIRED_FORM(DROPDOWN),
    "/ajax-success": AJAX_SUCCESS,
    "/nav-success": NAV_SUCCESS,
    "/email-verify": EMAIL_VERIFY_FORM,
  };

  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "text/html");
    const path = (req.url || "/").split("?")[0];
    if (path === "/success") { res.end("<h1>Thank you! Your submission was successful.</h1>"); return; }
    if (path === "/verify") { res.end("<h1>Verify your email</h1><p>We sent a verification link.</p>"); return; }
    res.end(PAGES[path] ?? PAGES["/blocked"]);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;

  const COMPANY_DATA: Record<string, string> = {
    name: "ITllect",
    legalName: "ITllect Consulting Inc.",
    email: "itllect.marketing@gmail.com",
    phone: "(123) 636-4087",
    website: "https://itllect.com",
    address: "100 N University Dr",
    city: "Coral Springs",
    state: "FL",
    zip: "33071",
    country: "US",
    description: "Digital marketing and SEO agency",
    services: "SEO services, digital marketing",
  };

  const fakeOpenai = {} as never;

  const run = async (path: string) => {
    const logs: string[] = [];
    const result = await runSubmission(`http://127.0.0.1:${port}${path}`, COMPANY_DATA, fakeOpenai, "SUBMIT", null, (m) => logs.push(m));
    return { result, logs };
  };

  try {
    // 1. Blocked submit: fields filled, but onsubmit returns false and there
    //    is no navigation and no confirmation state → must NOT be success.
    let { result } = await run("/blocked");
    assert(result.success === false, `blocked submit must fail, got success=${result.success} error=${result.error}`);
    assert((result.error || "").includes("не была отправлена"), `blocked submit error mismatch: ${result.error}`);
    console.log("PASS: blocked submit — success=false, no false positive");

    // 2. Failed required field: required readonly dropdown could not be
    //    filled (DOM stays empty) → submit must be blocked by validation.
    ({ result } = await run("/failed-field"));
    assert(result.success === false, `failed required field must fail, got success=${result.success} error=${result.error}`);
    assert((result.error || "").includes("обязательное поле"), `failed required field error mismatch: ${result.error}`);
    console.log("PASS: failed required field — submit blocked (DOM-verified, not mapping)");

    // 3. Same-URL AJAX-style success: URL stays the same but the DOM switches
    //    to an explicit confirmation state → must be success (fix must not
    //    break AJAX forms with a naive "URL unchanged = failure" rule).
    ({ result } = await run("/ajax-success"));
    assert(result.success === true, `same-URL AJAX success must pass, got success=${result.success} error=${result.error}`);
    console.log("PASS: same-URL AJAX success — confirmation state detected, success=true");

    // 4. Navigation success: form submits and navigates to a success page →
    //    must be success.
    ({ result } = await run("/nav-success"));
    assert(result.success === true, `navigation success must pass, got success=${result.success} error=${result.error}`);
    console.log("PASS: navigation success — URL changed, success=true");

    // 5. Existing email verification flow: submit leads to a verification
    //    page → existing behavior preserved (recognized as submitted, needs
    //    manual email confirmation — same contract as before the fix).
    ({ result } = await run("/email-verify"));
    assert(result.success === false && (result.error || "").includes("подтверждение email"),
      `email verification flow changed: success=${result.success} error=${result.error}`);
    console.log("PASS: email verification flow — preserved existing contract");

    console.log("Submit regression: PASS");
  } finally {
    server.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    for (const testCase of cases) {
      await page.setContent(`<html><body>${testCase.html}</body></html>`);
      await testCase.assert(page);
      console.log(`PASS: ${testCase.name}`);
    }
    if (process.argv.includes("--bark")) await runBark();
    await runFillRegression();
    await runSubmissionRegression();
    console.log("Form Analyzer synthetic regression: PASS");
  } finally {
    await browser.close();
    await closeBrowser();
  }
}

main().catch((error) => {
  console.error("Form Analyzer regression: FAIL");
  console.error(error);
  process.exitCode = 1;
});
