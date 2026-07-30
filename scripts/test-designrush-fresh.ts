import "dotenv/config";
import { chromium } from "playwright";

const UNIQUE_EMAIL = `itllect+designrush${Date.now()}@itllect.com`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  console.log("=== DESIGMRUSH FRESH REGISTRATION ===\n");
  console.log(`Email: ${UNIQUE_EMAIL}`);
  
  await page.goto("https://www.designrush.com/submit/agency", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(2000);
  
  // Select US Agencies
  const radios = page.locator('[name="agency-location"]');
  for (let i = 0; i < await radios.count(); i++) {
    if ((await radios.nth(i).inputValue()).includes("US")) { await radios.nth(i).check(); break; }
  }
  
  // Fill form
  await page.fill('[name="first_name"]', "ITllect");
  await page.fill('[name="last_name"]', "Admin");
  await page.fill('[name="email"]', UNIQUE_EMAIL);
  await page.fill('[name="phone"]', "(123) 636-4087");
  await page.fill('[name="password"]', "TestPass456!");
  await page.fill('[name="password_confirmation"]', "TestPass456!");
  
  await page.screenshot({ path: "designrush-before-submit.png", fullPage: true });
  
  console.log("\nSubmitting registration...");
  await page.click('button[type="submit"]');
  
  // Wait for response
  try {
    await page.waitForURL("**/step/**", { timeout: 15000 });
    console.log(`Redirected to: ${page.url()}`);
    
    // Check what Step 1 looks like
    const stepContent = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]), select, textarea");
      const forms = document.querySelectorAll("form");
      const text = document.body.innerText.slice(0, 1500);
      return {
        forms: Array.from(forms).map(f => ({
          action: f.action,
          inputs: Array.from(f.querySelectorAll("input:not([type=hidden]), select, textarea")).map(el => ({
            name: (el as HTMLInputElement).name, type: (el as HTMLInputElement).type || el.tagName
          })),
        })),
        inputs: Array.from(inputs).map(el => ({ name: (el as HTMLInputElement).name, type: (el as HTMLInputElement).type || el.tagName })),
        text: text.slice(0, 1000),
        url: window.location.href,
      };
    });
    
    console.log(`\nStep ${stepContent.url}:`);
    console.log(`Forms: ${stepContent.forms.length}`);
    console.log(`Inputs: ${stepContent.inputs.length}`);
    for (const inp of stepContent.inputs) {
      console.log(`  ${inp.type.padEnd(10)} name="${inp.name}"`);
    }
    console.log(`\nPage text:\n${stepContent.text.slice(0, 500)}`);
    
    await page.screenshot({ path: "designrush-step1-content.png", fullPage: true });
    
  } catch {
    const url = page.url();
    const text = await page.evaluate(() => document.body.innerText.slice(0, 1000));
    console.log(`\nNo redirect. URL: ${url}`);
    console.log(`Response: ${text.slice(0, 300)}`);
  }
  
  await ctx.close();
  await browser.close();
  console.log("\nDone");
}

main().catch(console.error);