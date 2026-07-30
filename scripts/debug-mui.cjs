const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://www.brownbook.net/add-business", { waitUntil: "load", timeout: 60000 });

  await page.click("#_r_u_");
  await page.waitForTimeout(500);

  const searchInput = page.locator('.MuiPopover-paper input[type=text]:not([readonly])');
  console.log("Search field exists:", await searchInput.count() > 0);
  
  await searchInput.click();
  await page.waitForTimeout(100);
  await searchInput.type("Software", { delay: 25 });
  await page.waitForTimeout(3000);

  // Use locator to find options
  const options = page.locator('.MuiList-root [role="button"]');
  const count = await options.count();
  console.log("Options via locator:", count);
  for (let i = 0; i < count; i++) {
    console.log(`  [${i}] "${await options.nth(i).textContent()}"`);
  }

  // Also via evaluate with the same selector
  const evalCount = await page.evaluate(() => {
    return document.querySelectorAll('.MuiList-root [role="button"]').length;
  });
  console.log("Options via evaluate:", evalCount);

  // Check what textContent the first option has
  if (count > 0) {
    console.log("First option text:", await options.first().textContent());
  }

  await browser.close();
})();
