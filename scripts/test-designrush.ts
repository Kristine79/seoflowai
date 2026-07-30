import "dotenv/config";
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  console.log("=== DESIGMRUSH SUBMISSION ===\n");
  
  await page.goto("https://www.designrush.com/submit/agency", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log(`Loaded: ${await page.title()}`);
  
  // Select US Agencies
  const radios = await page.locator('[name="agency-location"]');
  const count = await radios.count();
  for (let i = 0; i < count; i++) {
    const val = await radios.nth(i).inputValue();
    if (val.toLowerCase().includes("us")) {
      await radios.nth(i).check();
      console.log("✅ Selected US Agencies");
      break;
    }
  }
  if (count === 0) console.log("No radio buttons found for agency location");
  
  // Fill fields
  await page.fill('[name="first_name"]', "ITllect");
  await page.fill('[name="last_name"]', "Admin");
  await page.fill('[name="email"]', "info@itllect.com");
  await page.fill('[name="phone"]', "(123) 636-4087");
  await page.fill('[name="password"]', "TempPass123!");
  await page.fill('[name="password_confirmation"]', "TempPass123!");
  
  console.log("✅ Fields filled");
  
  // Check for captcha
  const hasCaptcha = await page.evaluate(() => {
    const gc = document.querySelector('.g-recaptcha, .h-captcha, iframe[src*="recaptcha"], iframe[src*="hcaptcha"]');
    const gcTextarea = document.querySelector('textarea[name="g-recaptcha-response"], textarea[name="h-captcha-response"]');
    return {
      hasCaptchaElement: !!gc,
      hasCaptchaTextarea: !!gcTextarea,
      bodyHasCaptcha: document.body.innerHTML.toLowerCase().includes("recaptcha") || document.body.innerHTML.toLowerCase().includes("hcaptcha"),
    };
  });
  console.log(`Captcha check: ${JSON.stringify(hasCaptcha)}`);
  
  // Check honeypot
  const honeyInput = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    for (const inp of Array.from(inputs)) {
      const i = inp as HTMLInputElement;
      if (i.name && (i.name.startsWith("my_name_") || i.name.includes("honey") || i.name.includes("website_url")) && !i.value) {
        return i.name;
      }
    }
    return null;
  });
  console.log(`Honeypot: ${honeyInput}`);
  
  // Submit
  console.log("\nSubmitting...");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(8000);
  
  const url = page.url();
  const text = await page.evaluate(() => document.body.innerText.slice(0, 1500));
  
  console.log(`URL: ${url}`);
  console.log(`Response: ${text.slice(0, 500)}`);
  
  if (url.includes("dashboard") || url.includes("agency") || text.includes("welcome") || text.includes("thank")) {
    console.log("\n✅ REGISTRATION SUCCESSFUL!");
  } else if (text.includes("already") || text.includes("exist") || text.includes("taken") || text.includes("registered")) {
    console.log("\n⚠️ Email may already be registered");
  } else if (text.includes("error") || text.includes("invalid") || text.includes("required")) {
    console.log("\n❌ Validation error");
  } else {
    console.log("\n⚠️ Unknown result - check screenshot");
  }
  
  await page.screenshot({ path: "designrush-result.png", fullPage: true });
  
  await ctx.close();
  await browser.close();
  console.log("\nDone");
}

main().catch(console.error);