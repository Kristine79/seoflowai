import "dotenv/config";
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  console.log("=== DESIGMRUSH LOGIN TEST ===\n");
  
  // Try to log in directly
  await page.goto("https://www.designrush.com/login", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(3000);
  
  console.log(`URL: ${page.url()}`);
  console.log(`Title: ${await page.title()}`);
  
  const loginForm = await page.evaluate(() => {
    const forms = document.querySelectorAll("form");
    const allInputs = document.querySelectorAll("input:not([type=hidden])");
    const buttons = document.querySelectorAll("button[type=submit]");
    return {
      forms: Array.from(forms).map(f => ({
        id: f.id,
        action: f.action,
        inputs: Array.from(f.querySelectorAll("input:not([type=hidden]), select")).map(el => ({
          name: (el as HTMLInputElement).name, type: (el as HTMLInputElement).type || el.tagName,
          placeholder: (el as HTMLInputElement).placeholder || "",
          id: el.id,
        })),
        buttons: Array.from(f.querySelectorAll("button")).map(b => b.textContent?.trim()),
      })),
      allInputs: Array.from(allInputs).map(el => ({ name: (el as HTMLInputElement).name, type: (el as HTMLInputElement).type })),
    };
  });
  
  console.log(`\nLogin forms:`);
  for (const f of loginForm.forms) {
    console.log(`  Form: id="${f.id}" action="${f.action?.slice(0, 60)}"`);
    for (const inp of f.inputs) {
      console.log(`    ${inp.type.padEnd(10)} name="${inp.name}" pl="${inp.placeholder}"`);
    }
    console.log(`    Buttons: ${f.buttons.join(", ")}`);
  }
  
  // Try to log in if we find email/password fields
  const emailField = page.locator('[name="email"], [name="login"], [type="email"]').first();
  const passField = page.locator('[type="password"]').first();
  
  if (await emailField.count() > 0 && await passField.count() > 0) {
    console.log("\nAttempting login...");
    await emailField.fill("info@itllect.com");
    await passField.fill("TempPass123!");
    
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(5000);
      
      console.log(`After login URL: ${page.url()}`);
      const text = await page.evaluate(() => document.body.innerText.slice(0, 500));
      console.log(`Response: ${text.slice(0, 300)}`);
      
      if (page.url().includes("submit") || page.url().includes("dashboard") || page.url().includes("agency")) {
        console.log("\n✅ Login successful!");
      }
    }
  } else {
    console.log("\nNo login form found on this page");
  }
  
  await page.screenshot({ path: "designrush-login.png", fullPage: true });
  
  await ctx.close();
  await browser.close();
}

main().catch(console.error);