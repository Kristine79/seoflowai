import "dotenv/config";
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  
  const urls = ["/submit/agency", "/agency/new", "/dashboard", "/my-account", "/profile", "/account"];
  
  for (const path of urls) {
    try {
      await page.goto("https://www.designrush.com" + path, { waitUntil: "domcontentloaded", timeout: 8000 });
      const title = await page.title();
      const text = await page.evaluate(() => document.body.innerText.slice(0, 200));
      console.log(path + ": " + title + " - " + text.slice(0, 80));
    } catch {
      console.log(path + ": TIMEOUT/ERROR");
    }
    await page.waitForTimeout(500);
  }
  
  await ctx.close();
  await browser.close();
}

main().catch(console.error);