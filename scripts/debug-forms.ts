import "dotenv/config";
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  await page.goto("https://citylocalpro.com/add-your-business", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Find the form we need - registration form
  const formInfo = await page.evaluate(() => {
    const forms = document.querySelectorAll("form");
    return Array.from(forms).map((f, i) => ({
      index: i,
      id: f.id,
      action: f.action,
      inputs: Array.from(f.querySelectorAll("input:not([type=hidden]), select, textarea")).map(el => ({
        name: (el as HTMLInputElement).name,
        id: el.id,
        type: (el as HTMLInputElement).type || el.tagName,
        placeholder: (el as HTMLInputElement).placeholder || "",
      })),
    }));
  });
  
  for (const form of formInfo) {
    if (form.id || form.inputs.length > 2) {
      console.log(`Form #${form.index}: id="${form.id}" action="${form.action?.slice(0, 60)}"`);
      for (const inp of form.inputs) {
        console.log(`  [${inp.type}] id=${inp.id} name=${inp.name} pl="${inp.placeholder}"`);
      }
    }
  }
  
  await ctx.close();
  await browser.close();
}

main().catch(console.error);