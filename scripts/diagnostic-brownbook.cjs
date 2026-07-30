require("dotenv").config();
const { chromium } = require("playwright");

async function main() {
  console.log("=== Brownbook Flow Diagnostic V2 ===\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("1. Navigating to /add-business...");
  await page.goto("https://www.brownbook.net/add-business", { waitUntil: "load", timeout: 60000 });
  console.log(`   URL: ${page.url()}`);

  console.log("\n2. All buttons on initial page...");
  const initialButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, a[role=button], a.button, [class*=btn]")).map(b => ({
      text: b.textContent?.trim().slice(0, 80),
      tag: b.tagName,
      id: b.id,
      visible: b.checkVisibility?.() ?? true,
    })).filter(b => b.text);
  });
  console.log(`   Found ${initialButtons.length} buttons:`);
  initialButtons.forEach(b => console.log(`     - "${b.text}" (${b.tag}, visible: ${b.visible})`));

  console.log("\n3. All inputs on initial page...");
  const initialInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea")).map((el, i) => ({
      idx: i,
      type: el.type || el.tagName.toLowerCase(),
      placeholder: el.placeholder?.slice(0, 40),
      id: el.id?.slice(0, 30),
      name: el.name?.slice(0, 30),
      readOnly: el.readOnly,
    }));
  });
  initialInputs.forEach(inp => console.log(`     [${inp.idx}] ${inp.type} "${inp.placeholder || inp.name || inp.id}" ${inp.readOnly ? "[readOnly]" : ""}`));

  console.log("\n4. Filling form fields...");

  // Find business name input
  const businessInput = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio])"));
    for (const inp of inputs) {
      const placeholder = (inp.placeholder || "").toLowerCase();
      const label = inp.labels?.[0]?.textContent?.toLowerCase() || "";
      if (placeholder.includes("business") || placeholder.includes("name") || label.includes("business")) {
        return { id: inp.id, placeholder: inp.placeholder, selector: inp.id ? `#${inp.id}` : "" };
      }
    }
    return null;
  });

  if (businessInput) {
    console.log(`   Business input found: ${JSON.stringify(businessInput)}`);
    const sel = businessInput.selector || `[placeholder="${businessInput.placeholder}"]`;
    await page.fill(sel, "ITLLECT GmbH");
    console.log("   ✓ Filled business name");
  }

  // Fill address
  const addressInput = page.locator('textarea[placeholder*="Address"]').or(page.locator('input[placeholder*="Address"]')).first();
  if (await addressInput.isVisible().catch(() => false)) {
    await addressInput.fill("Musterstraße 1");
    console.log("   ✓ Filled address");
  }

  // Fill city
  const cityInput = page.locator('input[placeholder*="City"]').first();
  if (await cityInput.isVisible().catch(() => false)) {
    await cityInput.fill("München");
    console.log("   ✓ Filled city");
  }

  console.log("\n5. Selecting Country...");
  const countryBtn = page.locator('button:has-text("Select country")').first();
  if (await countryBtn.isVisible().catch(() => false)) {
    console.log("   ✓ Country button found");
    await countryBtn.click();
    await page.waitForTimeout(800);

    // Check for dropdown
    const dropdownVisible = await page.locator('[role="listbox"], [class*="menu"], [class*="dropdown"]').first().isVisible().catch(() => false);
    console.log(`   Dropdown visible: ${dropdownVisible}`);

    if (dropdownVisible) {
      await page.keyboard.type("Germany", { delay: 40 });
      await page.waitForTimeout(1500);

      const options = page.locator('[role="option"], [class*="option"]');
      const optCount = await options.count();
      console.log(`   Options after typing "Germany": ${optCount}`);

      if (optCount > 0) {
        const optTexts = await options.allTextContents();
        console.log(`   Options: ${optTexts.slice(0, 5).join(", ")}`);

        // Find Germany
        const germanyIdx = optTexts.findIndex(t => t.toLowerCase().includes("germany"));
        if (germanyIdx >= 0) {
          await options.nth(germanyIdx).click();
          console.log("   ✓ Selected Germany");
        } else {
          await options.first().click();
          console.log("   ✓ Selected first option");
        }
        await page.waitForTimeout(500);
      }
    }
  } else {
    console.log("   ✗ Country button not found");
  }

  console.log("\n6. Buttons after country selection...");
  const afterButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, a[role=button], a.button, [class*=btn]")).map(b => ({
      text: b.textContent?.trim().slice(0, 80),
      tag: b.tagName,
      id: b.id,
      disabled: b.disabled || b.getAttribute("aria-disabled") === "true",
      visible: b.checkVisibility?.() ?? true,
    })).filter(b => b.text);
  });
  console.log(`   Found ${afterButtons.length} buttons:`);
  afterButtons.forEach(b => console.log(`     - "${b.text}" (${b.tag}, disabled: ${b.disabled}, visible: ${b.visible})`));

  console.log("\n7. Looking for 'Next' button specifically...");
  const nextBtn = page.locator('button:has-text("Next")').or(page.locator('button:has-text("next")')).first();
  const nextVisible = await nextBtn.isVisible().catch(() => false);
  console.log(`   Next button visible: ${nextVisible}`);

  if (nextVisible) {
    const nextInfo = await nextBtn.evaluate(el => ({
      text: el.textContent?.trim(),
      disabled: el.disabled,
      ariaDisabled: el.getAttribute("aria-disabled"),
      className: el.className.slice(0, 60),
    }));
    console.log(`   Next button info: ${JSON.stringify(nextInfo)}`);
  } else {
    console.log("   Next button NOT visible - checking all buttons with 'next' in text...");
    const nextButtons = afterButtons.filter(b => b.text.toLowerCase().includes("next"));
    console.log(`   Found ${nextButtons.length} buttons with 'next': ${JSON.stringify(nextButtons)}`);
  }

  console.log("\n8. Inputs after country selection...");
  const afterInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea")).map((el, i) => ({
      idx: i,
      type: el.type || el.tagName.toLowerCase(),
      placeholder: el.placeholder?.slice(0, 40),
      id: el.id?.slice(0, 40),
      value: el.value?.slice(0, 30),
    }));
  });
  console.log(`   Found ${afterInputs.length} inputs:`);
  afterInputs.forEach(inp => console.log(`     [${inp.idx}] ${inp.type} "${inp.placeholder || inp.id}" value="${inp.value}"`));

  console.log("\n9. Taking screenshot...");
  await page.screenshot({ path: "C:/hp/github/seoflowai/brownbook-diagnostic-v2.png", fullPage: true });
  console.log("   ✓ Screenshot saved");

  console.log("\n=== Diagnostic complete ===");
  await browser.close();
}

main().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
