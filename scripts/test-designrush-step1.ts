import "dotenv/config";
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  console.log("=== DESIGMRUSH STEP 1 ===\n");
  
  // We need to be logged in. Let's login first.
  await page.goto("https://www.designrush.com/submit/agency", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(2000);
  
  // Fill and submit registration
  await page.fill('[name="first_name"]', "ITllect");
  await page.fill('[name="last_name"]', "Admin");
  await page.fill('[name="email"]', "info@itllect.com");
  await page.fill('[name="phone"]', "(123) 636-4087");
  await page.fill('[name="password"]', "TempPass123!");
  await page.fill('[name="password_confirmation"]', "TempPass123!");
  
  // Find radio buttons for location
  const radios = page.locator('[name="agency-location"]');
  const rc = await radios.count();
  for (let i = 0; i < rc; i++) {
    const val = await radios.nth(i).inputValue();
    if (val.includes("US")) { await radios.nth(i).check(); break; }
  }
  
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  
  console.log(`After register URL: ${page.url()}`);
  
  // Now check what's on the current page
  const step1 = await page.evaluate(() => {
    const forms = document.querySelectorAll("form");
    const inputs = document.querySelectorAll("input:not([type=hidden]), select, textarea");
    const buttons = document.querySelectorAll("button, a[class*=btn]");
    
    return {
      forms: Array.from(forms).map(f => ({
        id: f.id,
        action: f.action,
        inputs: Array.from(f.querySelectorAll("input:not([type=hidden]), select, textarea")).map(el => ({
          name: (el as HTMLInputElement).name,
          type: (el as HTMLInputElement).type || el.tagName,
          placeholder: (el as HTMLInputElement).placeholder,
          id: el.id,
        })),
      })),
      pageText: document.body.innerText.slice(0, 2000),
      url: window.location.href,
      title: document.title,
      allInputs: Array.from(inputs).slice(0, 20).map(el => ({
        name: (el as HTMLInputElement).name,
        type: (el as HTMLInputElement).type || el.tagName,
        placeholder: (el as HTMLInputElement).placeholder,
      })),
    };
  });
  
  console.log(`\nStep 1 Title: ${step1.title}`);
  console.log(`Step 1 URL: ${step1.url}`);
  console.log(`Forms: ${step1.forms.length}`);
  console.log(`All inputs found: ${step1.allInputs.length}`);
  
  for (const inp of step1.allInputs) {
    console.log(`  ${inp.type.padEnd(10)} name="${inp.name}" pl="${inp.placeholder}"`);
  }
  
  console.log(`\nPage text (first 500): ${step1.pageText.slice(0, 500)}`);
  
  await page.screenshot({ path: "designrush-step1.png", fullPage: true });
  
  await ctx.close();
  await browser.close();
  console.log("\nDone");
}

main().catch(console.error);