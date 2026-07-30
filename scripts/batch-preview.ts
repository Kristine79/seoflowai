import "dotenv/config";
import { chromium, Browser, Page } from "playwright";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import path from "path";
import fs from "fs";

const url = new URL(process.env.DATABASE_URL || "");
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const COMPANY = {
  name: "ITllect",
  legalName: "ITllect LLC",
  website: "https://itllect.com",
  email: "info@itllect.com",
  phone: "+1 (954) 555-0123",
  address: "100 N University Dr",
  city: "Plantation",
  state: "Florida",
  country: "USA",
  zip: "33324",
  description: "Full-service digital marketing agency specializing in SEO and growth strategies.",
  category: "Advertising Agencies",
};

const SIMPLE_DIRECTORIES = [
  { platform: "EZlocal", url: "https://www.ezlocal.com" },
  { platform: "Hotfrog", url: "https://www.hotfrog.com/add-business" },
  { platform: "Local.com", url: "https://www.local.com" },
  { platform: "Manta", url: "https://www.manta.com" },
];

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const ssPath = path.resolve(`${name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`);
  await page.screenshot({ path: ssPath, fullPage: true });
  const stats = fs.statSync(ssPath);
  console.log(`  Screenshot: ${ssPath} (${(stats.size / 1024).toFixed(0)} KB)`);
  return ssPath;
}

async function runPreview(directoryUrl: string): Promise<{ success: boolean; screenshot?: string; error?: string; fieldsFilled?: number }> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`PREVIEW: ${directoryUrl}`);
  console.log(`${"=".repeat(60)}`);

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`Navigating to ${directoryUrl}...`);
    await page.goto(directoryUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    
    await page.waitForTimeout(3000);

    const title = await page.title();
    console.log(`Page title: ${title.slice(0, 80)}`);

    // Extract form fields
    const formInfo = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      const buttons = Array.from(document.querySelectorAll("button, input[type=submit]")).map(b => ({
        text: (b.textContent || (b as HTMLInputElement).value || "").trim().slice(0, 50),
        type: b.tagName === "INPUT" ? (b as HTMLInputElement).type : "button"
      }));
      
      const fields = Array.from(inputs).slice(0, 30).map((el, i) => ({
        num: i + 1,
        tag: el.tagName,
        type: (el as HTMLInputElement).type || el.tagName,
        name: (el as HTMLInputElement).name || "",
        placeholder: (el as HTMLInputElement).placeholder || "",
        id: el.id || "",
        label: "",
        required: el.hasAttribute("required")
      }));
      
      return { fieldCount: inputs.length, buttons: buttons.slice(0, 15), fields };
    });

    console.log(`\nForm analysis:`);
    console.log(`  Fields: ${formInfo.fieldCount}`);
    console.log(`  Buttons: ${formInfo.buttons.length}`);
    
    // Find form labels
    for (const field of formInfo.fields.slice(0, 10)) {
      const label = await page.evaluate((sel) => {
        const el = document.querySelector(`[name="${sel}"]`) as HTMLElement;
        if (el) {
          const prev = el.previousElementSibling;
          const parent = el.parentElement;
          return (prev?.textContent || parent?.textContent || "").trim().slice(0, 40);
        }
        return "";
      }, field.name).catch(() => "");
      
      if (label) {
        field.label = label;
        console.log(`  [${field.num}] ${field.tag}.${field.type} "${field.name}" placeholder="${field.placeholder}" label="${label}"`);
      }
    }

    console.log(`\nButtons:`);
    for (const btn of formInfo.buttons.slice(0, 8)) {
      console.log(`  [${btn.type}] "${btn.text}"`);
    }

    const screenshot = await takeScreenshot(page, `preview_${directoryUrl.replace(/[^a-z0-9]/gi, "_")}`);

    await context.close();
    await browser.close();

    return {
      success: true,
      screenshot,
      fieldsFilled: formInfo.fieldCount
    };

  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    if (browser) await browser.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`BATCH PREVIEW: SIMPLE DIRECTORIES`);
  console.log(`Company: ${COMPANY.name}`);
  console.log(`${"=".repeat(60)}\n`);

  const results: Array<{platform: string; url: string; success: boolean; screenshot?: string; error?: string; fieldsFilled?: number}> = [];

  for (const dir of SIMPLE_DIRECTORIES) {
    const result = await runPreview(dir.url);
    results.push({ platform: dir.platform, url: dir.url, ...result });
    
    // Save screenshot path
    if (result.screenshot) {
      console.log(`  Result: ${result.success ? "SUCCESS" : "FAILED"} - ${result.screenshot}`);
    }
    
    // Wait between runs
    await new Promise(r => setTimeout(r, 2000));
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`BATCH PREVIEW SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  
  for (const r of results) {
    const status = r.success ? "✅" : "❌";
    const fields = r.fieldsFilled !== undefined ? ` (${r.fieldsFilled} fields)` : "";
    console.log(`${status} ${r.platform.padEnd(20)} ${r.url.padEnd(50)} ${r.error || fields}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);