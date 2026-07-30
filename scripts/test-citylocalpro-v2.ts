import "dotenv/config";
import { chromium } from "playwright";
import fs from "fs";

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
  website: "https://itllect.com",
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  console.log("=== CITYLOCALPRO SUBMISSION V2 ===\n");
  
  await page.goto("https://citylocalpro.com/add-your-business", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log(`Loaded: ${await page.title()}`);
  
  // Fill text fields directly
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
  
  // Category: use JS to set Select2 value since it uses Select2 library
  console.log("Setting category via JS...");
  await page.evaluate(() => {
    // Set the native select value and trigger change
    const sel = document.querySelector('#category') as HTMLSelectElement;
    if (!sel) return;
    sel.value = "234"; // Internet & IT Services
    
    // Trigger change event for Select2
    const event = new Event('change', { bubbles: true });
    sel.dispatchEvent(event);
    
    // Also trigger input event
    const inputEvent = new Event('input', { bubbles: true });
    sel.dispatchEvent(inputEvent);
  });
  
  // Update Select2 display
  await page.evaluate(() => {
    try {
      // @ts-ignore
      if (jQuery && jQuery.fn && jQuery.fn.select2) {
        jQuery('#category').trigger('change.select2');
      }
    } catch {}
  });
  
  // Country code
  console.log("Setting country...");
  await page.selectOption('#countryCode', "US");
  
  // Terms checkbox
  await page.check('#term');
  
  // Screenshot
  await page.screenshot({ path: "citylocalpro-v2-before.png", fullPage: true });
  console.log("Screenshot saved");
  
  // Submit
  console.log("\nSubmitting...");
  await page.click('button[type="submit"]');
  
  // Wait
  await page.waitForTimeout(8000);
  
  const url = page.url();
  const text = await page.evaluate(() => document.body.innerText.slice(0, 1000));
  
  console.log(`\nResult URL: ${url}`);
  console.log(`Result text: ${text.slice(0, 500)}`);
  
  await page.screenshot({ path: "citylocalpro-v2-after.png", fullPage: true });
  
  await ctx.close();
  await browser.close();
  console.log("\nDone");
}

main().catch(console.error);