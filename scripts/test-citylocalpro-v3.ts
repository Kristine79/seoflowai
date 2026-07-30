import "dotenv/config";
import { chromium } from "playwright";

const COMPANY = {
  name: "ITllect Admin",
  email: "info@itllect.com",
  phone: "(123) 636-4087",
  companyName: "ITllect",
  companyPhone: "(123) 636-4087",
  description: "ITllect is a technology consulting firm specializing in AI, cloud infrastructure, and digital transformation solutions for enterprise clients.",
  city: "Coral Springs",
  state: "FL",
  zip: "33071",
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  console.log("=== CITYLOCALPRO SUBMISSION V3 ===\n");
  
  await page.goto("https://citylocalpro.com/add-your-business", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log(`Loaded: ${await page.title()}`);
  
  // Fill all text fields
  console.log("Filling fields...");
  await page.fill('[name="name"]', "ITllect Admin");
  await page.fill('#phone', COMPANY.phone);
  await page.fill('#email', COMPANY.email);
  await page.fill('#password', "TempPass123!");
  await page.fill('[name="company_name"]', COMPANY.companyName);
  await page.fill('[name="company_phone"]', COMPANY.companyPhone);
  await page.fill('[name="company_description"]', COMPANY.description);
  await page.fill('#state', COMPANY.state);
  await page.fill('#city', COMPANY.city);
  await page.fill('#zipcode', COMPANY.zip);
  
  // Select2 Category: click the Select2 container to open dropdown
  console.log("Selecting category via Select2...");
  // The Select2 container is a span with class select2-selection
  await page.click('.select2-selection--single');
  await page.waitForTimeout(500);
  
  // Now search for "Internet" in the Select2 search box
  const searchBox = page.locator('.select2-search__field');
  await searchBox.fill("Internet");
  await page.waitForTimeout(500);
  
  // Click the matching result
  const result = page.locator('.select2-results__option--highlighted');
  if (await result.count() > 0) {
    await result.click();
    console.log("  ✅ Category selected");
  } else {
    // Try clicking any result
    const anyResult = page.locator('.select2-results__option').first();
    if (await anyResult.count() > 0) {
      await anyResult.click();
      console.log("  ✅ Category selected (first result)");
    }
  }
  await page.waitForTimeout(500);
  
  // Country code
  console.log("Setting country...");
  await page.selectOption('#countryCode', "US");
  
  // Terms
  await page.check('#term');
  
  // Screenshot before submit
  await page.screenshot({ path: "citylocalpro-v3-before.png", fullPage: true });
  console.log("Pre-submit screenshot saved");
  
  // Submit
  console.log("\nSubmitting...");
  await page.click('button[type="submit"]');
  
  // Wait for result
  await page.waitForTimeout(10000);
  
  const url = page.url();
  const text = await page.evaluate(() => document.body.innerText.slice(0, 1500));
  
  console.log(`\nURL: ${url}`);
  console.log(`Response: ${text.slice(0, 500)}`);
  
  // Check for success
  if (text.includes("success") || text.includes("thank") || text.includes("welcome") || text.includes("confirmation")) {
    console.log("\n✅ SUCCESS - Listing submitted!");
  } else if (text.includes("error") || text.includes("missed") || text.includes("field")) {
    console.log("\n❌ FAILED - Validation errors");
  } else {
    console.log(`\n⚠️  UNKNOWN - ${text.slice(0, 200)}`);
  }
  
  await page.screenshot({ path: "citylocalpro-v3-after.png", fullPage: true });
  
  await ctx.close();
  await browser.close();
  console.log("\nDone");
}

main().catch(console.error);