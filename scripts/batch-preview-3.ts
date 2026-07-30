import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { chromium, Browser, Page } from "playwright";
import fs from "fs";

const url = new URL(process.env.DATABASE_URL || "");
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const AUTO_DIRS = [
  { platform: "GoodFirms", url: "https://www.goodfirms.co" },
  { platform: "DesignRush", url: "https://www.designrush.com" },
  { platform: "Local.com", url: "https://www.local.com" },
  { platform: "TopSEOs", url: "https://www.topseos.com" },
];

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const safeName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const ssPath = `preview_${safeName}.png`;
  await page.screenshot({ path: ssPath, fullPage: true });
  const stats = fs.statSync(ssPath);
  return `${ssPath} (${(stats.size / 1024).toFixed(0)} KB)`;
}

async function runPreview(dir: { platform: string; url: string }) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`PREVIEW: ${dir.platform}`);
  console.log(`URL: ${dir.url}`);
  console.log(`${"=".repeat(60)}`);
  
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    });
    const page = await context.newPage();
    
    console.log(`Navigating...`);
    await page.goto(dir.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log(`Title: ${title.slice(0, 80)}`);
    
    const info = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      const forms = document.querySelectorAll("form");
      const buttons = Array.from(document.querySelectorAll("button, input[type=submit]")).map(b => ({
        text: (b.textContent || (b as HTMLInputElement).value || "").trim().slice(0, 50),
        type: b.tagName === "INPUT" ? (b as HTMLInputElement).type : "button"
      }));
      
      const fieldNames = Array.from(inputs).slice(0, 20).map((el, i) => {
        const input = el as HTMLInputElement;
        return {
          num: i + 1,
          tag: el.tagName,
          type: input.type || el.tagName,
          name: input.name || "",
          placeholder: input.placeholder || "",
          id: el.id || ""
        };
      });
      
      return { fieldCount: inputs.length, formCount: forms.length, buttons: buttons.slice(0, 10), fields: fieldNames };
    });
    
    console.log(`\nForms: ${info.formCount}, Fields: ${info.fieldCount}`);
    console.log(`Buttons: ${info.buttons.length}`);
    
    for (const f of info.fields.slice(0, 15)) {
      console.log(`  [${f.num}] ${f.tag}.${f.type} name="${f.name}" placeholder="${f.placeholder}"`);
    }
    
    console.log(`\nButtons:`);
    for (const b of info.buttons.slice(0, 8)) {
      console.log(`  [${b.type}] "${b.text}"`);
    }
    
    const screenshot = await takeScreenshot(page, dir.platform);
    console.log(`\nScreenshot: ${screenshot}`);
    
    await context.close();
    await browser.close();
    
    return { success: true, fields: info.fieldCount, screenshot };
    
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    if (browser) await browser.close();
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  console.log("Testing first 4 AUTO directories...\n");
  
  const results = [];
  for (const dir of AUTO_DIRS) {
    const result = await runPreview(dir);
    results.push({ ...dir, ...result });
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`PREVIEW RESULTS`);
  console.log(`${"=".repeat(60)}`);
  
  for (const r of results) {
    const status = r.success ? "✅" : "❌";
    const fields = r.fields !== undefined ? `${r.fields} fields` : (r.error || "");
    console.log(`${status} ${r.platform.padEnd(25)} ${fields}`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);