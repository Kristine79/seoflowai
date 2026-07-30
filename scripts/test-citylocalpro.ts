import "dotenv/config";
import { chromium } from "playwright";
import fs from "fs";

const COMPANY = {
  name: "ITllect",
  email: "info@itllect.com", // or generate unique? email verification might be needed
  phone: "(123) 636-4087",
  companyName: "ITllect",
  companyPhone: "(123) 636-4087",
  description: "ITllect is a technology consulting firm specializing in AI, cloud infrastructure, and digital transformation solutions for enterprise clients.",
  city: "Coral Springs",
  state: "FL",
  zip: "33071",
  website: "https://itllect.com",
  category: "234", // Internet & IT Services
};

async function citylocalproSubmit() {
  const browser = await chromium.launch({ headless: false }); // visible for testing
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  console.log("=== CITYLOCALPRO SUBMISSION TEST ===\n");
  
  try {
    // Navigate
    await page.goto("https://citylocalpro.com/add-your-business", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log(`Page loaded: ${await page.title()}`);
    
    // Fill form
    console.log("\nFilling account fields...");
    await page.fill('[name="name"]', "ITllect Admin");
    await page.fill('#phone', COMPANY.phone);
    await page.fill('#email', COMPANY.email);
    await page.fill('#password', "TempPass123!");
    
    console.log("Filling business fields...");
    await page.fill('[name="company_name"]', COMPANY.companyName);
    await page.fill('[name="company_phone"]', COMPANY.companyPhone);
    await page.selectOption('#category', COMPANY.category);
    await page.fill('[name="company_description"]', COMPANY.description);
    await page.selectOption('#countryCode', "US");
    await page.fill('#state', COMPANY.state);
    await page.fill('#city', COMPANY.city);
    await page.fill('#zipcode', COMPANY.zip);
    
    // Check terms
    await page.check('#term');
    
    // Screenshot before submit
    await page.screenshot({ path: "citylocalpro-before-submit.png", fullPage: true });
    console.log("\nPre-submit screenshot saved");
    
    // Click Register
    console.log("\nClicking Register...");
    await page.click('button[type="submit"]');
    
    // Wait for result
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`After submit URL: ${currentUrl}`);
    
    const pageText = await page.evaluate(() => document.body.innerText.slice(0, 500));
    console.log(`Page text: ${pageText.slice(0, 300)}`);
    
    await page.screenshot({ path: "citylocalpro-after-submit.png", fullPage: true });
    console.log("\nPost-submit screenshot saved");
    
    // Check for success indicators
    const success = pageText.includes("success") || pageText.includes("thank") || pageText.includes("welcome") || 
                    pageText.includes("confirm") || pageText.includes("check your email");
    console.log(`\nResult: ${success ? "✅ SUCCESS (likely)" : "❌ FAILED (likely)"}`);
    console.log(`URL: ${currentUrl}`);
    
  } catch (e: any) {
    console.error(`\nError: ${e.message}`);
    await page.screenshot({ path: "citylocalpro-error.png", fullPage: true });
  }
  
  await ctx.close();
  await browser.close();
  console.log("\nDone");
}

citylocalproSubmit().catch(console.error);