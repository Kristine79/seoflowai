import "dotenv/config";
import { chromium, Browser, Page } from "playwright";
import path from "path";
import fs from "fs";

const COMPANY = {
  name: "ITllect",
  firstName: "John",
  lastName: "Smith",
  website: "https://itllect.com",
  email: "info@itllect.com",
  phone: "+1 (954) 555-0123",
  message: "ITllect is a full-service digital marketing agency specializing in SEO, PPC, and web development.",
};

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const ssPath = path.resolve(`${name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`);
  await page.screenshot({ path: ssPath, fullPage: true });
  const stats = fs.statSync(ssPath);
  console.log(`Screenshot: ${ssPath} (${(stats.size / 1024).toFixed(0)} KB)`);
  return ssPath;
}

async function main() {
  console.log("=" .repeat(60));
  console.log("TOPSEOS FULL SUBMISSION TEST");
  console.log("=" .repeat(60));
  
  const URL = "https://www.topseos.com";
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    });
    const page = await context.newPage();
    
    console.log("\n1. Navigating to TopSEOs...");
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, "topseos_step1_homepage");
    
    // Fill the form
    console.log("\n2. Filling form fields...");
    
    const fields = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input, select, textarea");
      return Array.from(inputs).map(el => ({
        name: (el as HTMLInputElement).name || "",
        id: el.id || "",
        placeholder: (el as HTMLInputElement).placeholder || "",
        type: (el as HTMLInputElement).type || el.tagName,
        required: el.hasAttribute("required")
      }));
    });
    
    console.log(`Found ${fields.length} form elements`);
    for (const f of fields) {
      console.log(`  ${f.type} name="${f.name}" placeholder="${f.placeholder}"`);
    }
    
    // Fill fields by name
    const fieldFills = [
      { name: "form[first_name]", value: COMPANY.firstName },
      { name: "form[last_name]", value: COMPANY.lastName },
      { name: "form[company_name]", value: COMPANY.name },
      { name: "form[website]", value: COMPANY.website },
      { name: "form[email]", value: COMPANY.email },
      { name: "form[phone]", value: COMPANY.phone },
    ];
    
    for (const fill of fieldFills) {
      try {
        const selector = `[name="${fill.name}"]`;
        await page.fill(selector, fill.value);
        console.log(`  ✅ ${fill.name} = "${fill.value}"`);
      } catch (e) {
        console.log(`  ❌ ${fill.name} - ${e instanceof Error ? e.message.slice(0,50) : e}`);
      }
    }
    
    // Fill message
    try {
      await page.fill('[name="form[message]"]', COMPANY.message);
      console.log(`  ✅ form[message] = "${COMPANY.message.slice(0, 50)}..."`);
    } catch (e) {
      console.log(`  ❌ form[message] - ${e instanceof Error ? e.message.slice(0,50) : e}`);
    }
    
    await page.waitForTimeout(1000);
    await takeScreenshot(page, "topseos_step2_filled");
    
    // Submit
    console.log("\n3. Submitting form...");
    try {
      await page.click('[type="submit"]');
      console.log("  Clicked submit button");
      await page.waitForTimeout(3000);
      await takeScreenshot(page, "topseos_step3_submitted");
      
      const finalUrl = page.url();
      const finalTitle = await page.title();
      console.log(`\n4. After submit:`);
      console.log(`  URL: ${finalUrl}`);
      console.log(`  Title: ${finalTitle}`);
      
      // Check for success indicators
      const bodyText = await page.evaluate(() => document.body.innerText);
      const successKeywords = ["thank", "received", "success", "submitted", "form", "contact"];
      const hasSuccess = successKeywords.some(k => bodyText.toLowerCase().includes(k));
      console.log(`  Success detected: ${hasSuccess ? "YES ✅" : "No - check manually"}`);
      
    } catch (e) {
      console.log(`  ❌ Submit failed: ${e instanceof Error ? e.message.slice(0,80) : e}`);
    }
    
    await context.close();
    await browser.close();
    
    console.log("\n" + "=".repeat(60));
    console.log("TOPSEOS TEST COMPLETE");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error(`Fatal error: ${error instanceof Error ? error.message : error}`);
    if (browser) await browser.close();
  }
}

main().catch(console.error);