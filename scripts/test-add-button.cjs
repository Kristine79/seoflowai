require("dotenv").config();
const { chromium } = require("playwright");

async function main() {
  console.log("=== Brownbook Add Button Test ===\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("1. Navigate to search page...");
  await page.goto("https://www.brownbook.net/country-selector/us", { waitUntil: "load", timeout: 60000 });
  console.log(`   URL: ${page.url()}`);

  console.log("\n2. Fill search fields...");
  const businessInput = page.locator('[placeholder="Business type or name"]').first();
  if (await businessInput.isVisible().catch(() => false)) {
    await businessInput.click();
    await page.waitForTimeout(200);
    await page.keyboard.type("ITLLECT", { delay: 30 });
    console.log("   ✓ Filled business name");
  }

  const cityInput = page.locator('[placeholder="Select city"]').first();
  if (await cityInput.isVisible().catch(() => false)) {
    await cityInput.click();
    await page.waitForTimeout(200);
    await page.keyboard.type("Plantation", { delay: 30 });
    console.log("   ✓ Filled city");
  }

  await page.waitForTimeout(1000);

  console.log("\n3. Check Search button state...");
  const searchBtn = page.locator('button:has-text("Search")').first();
  const isDisabled = await searchBtn.evaluate(el => el.hasAttribute("disabled")).catch(() => true);
  console.log(`   Search button disabled: ${isDisabled}`);

  if (!isDisabled) {
    console.log("   Clicking Search...");
    await searchBtn.click();
  } else {
    console.log("   Pressing Enter...");
    await page.keyboard.press("Enter");
  }

  await page.waitForTimeout(3000);
  console.log(`\n4. URL after search: ${page.url()}`);

  console.log("\n5. Page state after search...");
  const afterSearch = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea")).map(el => ({
      placeholder: el.placeholder?.slice(0, 40),
      value: el.value?.slice(0, 30),
    }));
    const buttons = Array.from(document.querySelectorAll("button, a[role=button]")).map(b => ({
      text: b.textContent?.trim().slice(0, 60),
      tag: b.tagName,
      href: b.href || null,
      id: b.id,
    })).filter(b => b.text);
    return { inputCount: inputs.length, inputs, buttons };
  });
  console.log(`   Inputs: ${afterSearch.inputCount}`);
  afterSearch.inputs.forEach((inp, i) => console.log(`     [${i}] "${inp.placeholder}" value="${inp.value}"`));
  console.log(`   Buttons: ${afterSearch.buttons.length}`);
  afterSearch.buttons.forEach((btn, i) => console.log(`     [${i}] "${btn.text}" (${btn.tag}, href: ${btn.href}, id: ${btn.id})`));

  console.log("\n6. Looking for 'Add a New Business' button...");
  const addBtn = afterSearch.buttons.find(b => b.text.toLowerCase().includes("add") && b.text.toLowerCase().includes("business"));
  if (addBtn) {
    console.log(`   Found: ${JSON.stringify(addBtn)}`);

    console.log("\n7. Clicking Add button...");
    const addBtnEl = page.locator(`#${addBtn.id}`).or(page.locator(`button:has-text("${addBtn.text}")`)).first();
    await addBtnEl.click({ timeout: 5000 });
    console.log("   ✓ Clicked");

    await page.waitForTimeout(3000);
    console.log(`\n8. URL after Add click: ${page.url()}`);

    console.log("\n9. Page state after Add click...");
    const afterAdd = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea"));
      const buttons = Array.from(document.querySelectorAll("button, a[role=button]")).map(b => b.textContent?.trim().slice(0, 60)).filter(Boolean);
      return { inputCount: inputs.length, buttons: buttons.slice(0, 10) };
    });
    console.log(`   Inputs: ${afterAdd.inputCount}`);
    console.log(`   Buttons: ${afterAdd.buttons.join(", ")}`);

    await page.screenshot({ path: "C:/hp/github/seoflowai/brownbook-add-test.png", fullPage: true });
    console.log("\n   Screenshot saved");
  } else {
    console.log("   Not found");
  }

  console.log("\n=== Test complete ===");
  await browser.close();
}

main().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
