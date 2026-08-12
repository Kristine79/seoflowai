const { chromium } = require("playwright");
const path = require("path");

const CONTACT_PERSON = process.env.CLIENT_FIRST_NAME ? `${process.env.CLIENT_FIRST_NAME} ${process.env.CLIENT_LAST_NAME}` : "Client Contact";
const PHONE = process.env.CLIENT_PHONE || "(555) 000-0000";
const STREET = process.env.CLIENT_ADDRESS || "123 Main St";
const ZIP = process.env.CLIENT_ZIP || "00000";

const DESC = "ITllect is a Plantation, Florida-based digital marketing agency delivering data-driven SEO, PPC, and social media solutions that drive measurable growth for businesses of all sizes. Founded in 2015, ITllect combines creative expertise with data-driven strategies in SEO, paid advertising, social media management, web development, and content marketing, built on transparency and long-term client partnerships.";

(async () => {
  const userDataDir = path.resolve("seoflowai-temp/agent-profiles/human-semfirms");
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
    timezoneId: "America/New_York",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    colorScheme: "light",
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-dev-shm-usage", "--lang=en-US,en"],
  });
  const page = await ctx.newPage();
  const posts = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && !r.url().includes("logo") && !r.url().includes("ahrefs")) {
      posts.push(r.url().slice(0, 100) + " | " + (r.postData() || "").slice(0, 120));
    }
  });
  page.on("response", (r) => {
    if (r.request().method() === "POST" && !r.url().includes("logo") && !r.url().includes("ahrefs")) {
      posts.push("RESP " + r.status() + " " + r.url().slice(0, 80));
    }
  });
  try {
    // Ретрай загрузки jQuery
    let jq = false;
    for (let i = 0; i < 4 && !jq; i++) {
      await page.goto("https://www.semfirms.com/add-listing", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
      try {
        await page.waitForFunction(() => typeof window.jQuery !== "undefined" && typeof window.$ !== "undefined", null, { timeout: 20000 });
        jq = true;
      } catch (e) {
        console.log("jQuery not loaded, attempt " + (i + 1) + ", reloading...");
        await page.waitForTimeout(3000);
      }
    }
    if (!jq) { console.log("FAILED: jQuery never loaded"); await ctx.close(); return; }
    console.log("jQuery loaded OK");

    await page.waitForTimeout(2000);
    await page.fill('input[name="title"]', "ITllect");
    await page.fill('input[name="field_company_url"]', "https://itllect-agency.com/");
    await page.fill('input[name="field_contact_person"]', CONTACT_PERSON);
    await page.fill('input[name="field_position_title"]', process.env.CLIENT_POSITION || "Founder & CEO");
    await page.fill('input[name="field_phone"]', PHONE);
    await page.fill('input[name="field_primary_address_1"]', STREET);
    await page.evaluate(() => {
      const el = document.querySelector('input[name="field_other_city"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, "Plantation");
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.fill('input[name="field_state_1"]', "FL");
    await page.fill('input[name="field_zip_1"]', ZIP);
    await page.fill('textarea[name="body"]', DESC);
    await page.fill('input[name="field_year_founded"]', "2015");
    await page.evaluate(() => {
      const sel = document.querySelector('select[name="field_country_1"]');
      sel.value = "375";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      const sel = document.querySelector('select[name="field_directory_category[]"]');
      for (const v of ["8", "87", "88"]) {
        const opt = Array.from(sel.options).find((o) => o.value === v);
        if (opt) opt.selected = true;
      }
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.setInputFiles("input[type=file]", "temp-logo.png");
    await page.waitForTimeout(4000);
    await page.check('input[name="field_confirm_term"]');
    await page.waitForTimeout(2000);

    console.log("Clicking #edit-submit with jQuery ready...");
    posts.length = 0;
    await page.click("#edit-submit");
    await page.waitForTimeout(20000);
    console.log("URL after submit:", page.url());
    console.log("POSTS:", JSON.stringify(posts, null, 1));
    const text = await page.evaluate(() => document.body.innerText);
    console.log("PAGE TEXT 0-500:", JSON.stringify(text.slice(0, 500)));
  } catch (e) {
    console.log("ERR:", e.message.slice(0, 400));
  }
  await ctx.close();
})();
