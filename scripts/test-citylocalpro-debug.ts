import "dotenv/config";
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  await page.goto("https://citylocalpro.com/add-your-business", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Fill all fields first
  await page.fill('[name="name"]', "ITllect Admin");
  await page.fill('#phone', "(123) 636-4087");
  await page.fill('#email', "info@itllect.com");
  await page.fill('#password', "TempPass123!");
  await page.fill('[name="company_name"]', "ITllect");
  await page.fill('[name="company_phone"]', "(123) 636-4087");
  await page.fill('[name="company_description"]', "ITllect is a technology consulting firm specializing in AI, cloud infrastructure, and digital transformation solutions for enterprise clients.");
  await page.fill('#state', "FL");
  await page.fill('#city', "Coral Springs");
  await page.fill('#zipcode', "33071");
  
  // Category via Select2
  await page.click('.select2-selection--single');
  await page.waitForTimeout(300);
  const searchBox = page.locator('.select2-search__field');
  await searchBox.fill("Internet");
  await page.waitForTimeout(300);
  const highlighted = page.locator('.select2-results__option--highlighted');
  if (await highlighted.count() > 0) await highlighted.click();
  else await page.locator('.select2-results__option').first().click();
  await page.waitForTimeout(300);
  
  // Country
  await page.selectOption('#countryCode', "US");
  
  // Terms
  await page.check('#term');
  
  // Logo - create a simple file to upload
  const logoPath = require("path").join(process.cwd(), "temp-logo.png");
  require("fs").writeFileSync(logoPath, "");
  
  try {
    const fileInput = page.locator('[name="company_logo"]');
    await fileInput.setInputFiles(logoPath);
    console.log("Logo uploaded");
  } catch {
    console.log("Logo upload skipped (not required on client side)");
  }
  
  // Now check what HTML errors show up
  const errors = await page.evaluate(() => {
    const errorEls = document.querySelectorAll('[class*="error"], [class*="invalid"], [class*="danger"], [class*="alert"], .help-block, .validation, small.text-danger, span.text-danger');
    const inputs = document.querySelectorAll('input, select, textarea');
    const errors2 = Array.from(inputs).filter(i => i.classList.contains('error') || i.classList.contains('invalid') || i.classList.contains('is-invalid'));
    
    return {
      errors: Array.from(errorEls).slice(0, 10).map(e => e.textContent?.trim()).filter(Boolean),
      invalidInputs: Array.from(errors2).map(i => (i as HTMLElement).outerHTML.slice(0, 100)),
      inputsWithNoValue: Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio])')).filter(i => !(i as HTMLInputElement).value).map(i => (i as HTMLInputElement).name || (i as HTMLInputElement).id || i.tagName),
    };
  });
  
  console.log("Validation errors:", errors.errors);
  console.log("Invalid inputs:", errors.invalidInputs);
  console.log("Empty inputs:", errors.inputsWithNoValue);
  
  // Also check what happens on submit
  console.log("\nSubmitting...");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  
  const errors2 = await page.evaluate(() => {
    const errorEls = document.querySelectorAll('[class*="error"], [class*="invalid"], [class*="danger"], [class*="alert"], span.error, div.error, small, .help-block');
    return {
      errors: Array.from(errorEls).slice(0, 10).map(e => e.textContent?.trim()).filter(Boolean),
      bodySlice: document.body.innerText.slice(200, 800),
    };
  });
  
  console.log("Post-submit errors:", errors2.errors);
  console.log("Body text (200-800):", errors2.bodySlice);
  
  await ctx.close();
  await browser.close();
}

main().catch(console.error);