import "dotenv/config";
import { chromium, Browser, Page } from "playwright";
import path from "path";
import fs from "fs";

const TEST_URLS = [
  // CONTENT platforms (may have simpler forms)
  { name: "Medium", url: "https://medium.com" },
  { name: "HubPages", url: "https://hubpages.com" },
  { name: "Quora", url: "https://www.quora.com" },
  { name: "EzineArticles", url: "https://ezinearticles.com" },
  { name: "SlideShare", url: "https://www.slideshare.net" },
  // AGENCY directories
  { name: "GoodFirms", url: "https://www.goodfirms.co" },
  { name: "DesignRush", url: "https://www.designrush.com" },
  { name: "Upcity", url: "https://upcity.com" },
  { name: "Expertise.com", url: "https://www.expertise.com" },
];

async function testPage(name: string, url: string): Promise<{name: string; url: string; success: boolean; fields: number; buttons: number; title: string; issue?: string}> {
  console.log(`\n--- ${name} ---`);
  console.log(`URL: ${url}`);
  
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log(`Title: ${title.slice(0, 80)}`);
    
    const info = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      const buttons = document.querySelectorAll("button, input[type=submit]");
      const forms = document.querySelectorAll("form");
      
      return {
        fields: inputs.length,
        buttons: buttons.length,
        forms: forms.length,
        hasCloudflare: document.body.textContent?.includes("Just a moment") || 
                       document.body.textContent?.includes("Cloudflare") ||
                       document.body.textContent?.includes("Attention Required")
      };
    });
    
    console.log(`Fields: ${info.fields}, Buttons: ${info.buttons}, Forms: ${info.forms}`);
    
    if (info.hasCloudflare) {
      console.log(`⚠️  CLOUDFLARE DETECTED`);
    }
    
    const ssName = `test_${name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
    const ssPath = path.resolve(ssName);
    await page.screenshot({ path: ssPath, fullPage: true });
    const stats = fs.statSync(ssPath);
    console.log(`Screenshot: ${ssName} (${(stats.size/1024).toFixed(0)} KB)`);
    
    await context.close();
    await browser.close();
    
    return { name, url, success: true, fields: info.fields, buttons: info.buttons, title };
    
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message.slice(0, 100) : error}`);
    if (browser) await browser.close();
    return { 
      name, url, success: false, fields: 0, buttons: 0, title: "", 
      issue: error instanceof Error ? error.message.slice(0, 50) : "unknown" 
    };
  }
}

async function main() {
  console.log(`${"=".repeat(60)}`);
  console.log(`TESTING MULTIPLE DIRECTORY PLATFORMS`);
  console.log(`${"=".repeat(60)}`);
  
  const results = [];
  
  for (const { name, url } of TEST_URLS) {
    const result = await testPage(name, url);
    results.push(result);
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  
  for (const r of results) {
    const status = r.success ? (r.fields > 0 ? "✅" : "⚠️") : "❌";
    const cloudflare = r.title.includes("Cloudflare") || r.title.includes("Just a moment") ? " [CLOUDFLARE]" : "";
    console.log(`${status} ${r.name.padEnd(20)} ${r.fields.toString().padStart(3)} fields ${r.issue || cloudflare || "OK"}`);
  }
}

main().catch(console.error);