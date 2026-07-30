import "dotenv/config";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

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
  
  console.log("=== CITYLOCALPRO SUBMISSION V4 ===\n");
  
  await page.goto("https://citylocalpro.com/add-your-business", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log(`Loaded: ${await page.title()}`);
  
  // Fill simple text fields
  await page.fill('[name="name"]', "ITllect Admin");
  await page.fill('#phone', COMPANY.phone);
  await page.fill('#email', COMPANY.email);
  await page.fill('#password', "TempPass123!");
  await page.fill('[name="company_name"]', COMPANY.companyName);
  await page.fill('[name="company_phone"]', COMPANY.companyPhone);
  await page.fill('[name="company_description"]', COMPANY.description);
  
  // Category via Select2
  await page.click('.select2-selection--single');
  await page.waitForTimeout(300);
  const searchBox = page.locator('.select2-search__field');
  await searchBox.fill("Internet");
  await page.waitForTimeout(300);
  const highlighted = page.locator('.select2-results__option--highlighted');
  if (await highlighted.count() > 0) await highlighted.click();
  else await page.locator('.select2-results__option').first().click();
  
  // Country
  await page.selectOption('#countryCode', "US");
  
  // Address fields - use JS to avoid autocomplete conflicts
  console.log("Setting address fields via JS...");
  await page.evaluate(() => {
    // Set all values silently without triggering events
    const fields: Record<string, string> = {
      state: "FL",
      city: "Coral Springs",
      zipcode: "33071",
    };
    for (const [id, value] of Object.entries(fields)) {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) {
        // Use Object.getOwnPropertyDescriptor to set value without triggering events
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (nativeSetter) {
          nativeSetter.set!.call(el, value);
        } else {
          el.value = value;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });
  await page.waitForTimeout(300);
  
  // Verify all fields
  const beforeSubmit = await page.evaluate(() => {
    const fields = ['name', 'phone', 'email', 'password', 'company_name', 'company_phone', 'company_description', 'state', 'city', 'zipcode'];
    const vals: Record<string, string> = {};
    for (const f of fields) {
      const el = document.querySelector(`[name="${f}"]`) as HTMLInputElement;
      vals[f] = el?.value || "(empty)";
    }
    // Also check category (hidden select)
    const cat = document.querySelector('#category') as HTMLSelectElement;
    vals['category'] = cat?.value || "(empty)";
    const country = document.querySelector('#countryCode') as HTMLSelectElement;
    vals['country_code'] = country?.value || "(empty)";
    const term = document.querySelector('#term') as HTMLInputElement;
    vals['term'] = term?.checked ? "checked" : "unchecked";
    return vals;
  });
  
  console.log("\nPre-submit values:");
  for (const [k, v] of Object.entries(beforeSubmit)) {
    const status = v !== "(empty)" && v !== "unchecked" ? "✅" : "❌";
    console.log(`  ${status} ${k.padEnd(20)} = ${v}`);
  }
  
  // Create a small valid logo image
  const logoPath = path.join(process.cwd(), "temp-logo.png");
  const minPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  fs.writeFileSync(logoPath, minPng);
  await page.locator('[name="company_logo"]').setInputFiles(logoPath);
  console.log("\n✅ Logo uploaded");
  
  // Terms
  await page.check('#term');
  
  // Screenshot
  await page.screenshot({ path: "citylocalpro-v4-before.png", fullPage: true });
  
  // Submit
  console.log("\nSubmitting...");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(10000);
  
  const url = page.url();
  const text = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  
  console.log(`\nURL: ${url}`);
  console.log(`Response:\n${text.slice(0, 600)}`);
  
  const success = text.includes("success") || text.includes("thank") || text.includes("welcome") || 
                  text.includes("confirm") || text.includes("Your business") || url.includes("dashboard");
  const failed = text.includes("missed") || text.includes("error") || text.includes("required");
  
  if (success) console.log("\n✅ SUBMISSION SUCCESSFUL!");
  else if (failed) console.log("\n❌ Submission failed with validation errors");
  else console.log("\n⚠️ Unknown result");
  
  await page.screenshot({ path: "citylocalpro-v4-after.png", fullPage: true });
  
  await ctx.close();
  await browser.close();
  console.log("\nDone");
}

main().catch(console.error);