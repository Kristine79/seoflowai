const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://www.brownbook.net/", { waitUntil: "domcontentloaded", timeout: 15000 });
  console.log("Title:", await page.title());

  const addBtn = page.locator("text=Add a New Business").first();
  const btnCount = await addBtn.count();
  console.log("Add Business buttons found:", btnCount);

  if (btnCount > 0) {
    console.log("Clicking...");
    await addBtn.click();
    await page.waitForTimeout(5000);
    console.log("URL after click:", page.url());
    const info = await page.evaluate(() => {
      const forms = document.querySelectorAll("form");
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox])");
      const selects = document.querySelectorAll("select");
      const textareas = document.querySelectorAll("textarea");
      return {
        forms: forms.length,
        inputs: inputs.length,
        selects: selects.length,
        textareas: textareas.length,
        fields: Array.from(inputs).concat(Array.from(selects)).concat(Array.from(textareas)).slice(0, 30).map(el => ({
          tag: el.tagName,
          type: el.type || "",
          name: el.name || "",
          placeholder: el.placeholder || "",
          id: el.id || "",
          required: el.hasAttribute("required"),
        })),
      };
    });
    console.log("Forms:", info.forms, "Inputs:", info.inputs, "Selects:", info.selects, "Textareas:", info.textareas);
    for (const f of info.fields) {
      console.log(`  <${f.tag}> type=${f.type} name="${f.name}" placeholder="${f.placeholder}" req=${f.required}`);
    }
  } else {
    console.log("Page text:", await page.evaluate(() => document.body.innerText.slice(0, 1000)));
  }

  await browser.close();
})();
