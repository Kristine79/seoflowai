import "dotenv/config";
import { chromium, Browser } from "playwright";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const url = new URL(process.env.DATABASE_URL || "");
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type Readiness = "AUTO" | "MANUAL" | "BLOCKED";

interface DirResult {
  platform: string;
  url: string;
  readiness: Readiness;
  issue: string;
  title?: string;
}

async function testDirectory(name: string, testUrl: string): Promise<DirResult> {
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    });
    const page = await context.newPage();
    
    const response = await page.goto(testUrl, { 
      waitUntil: "domcontentloaded", 
      timeout: 15000 
    }).catch(() => null);
    
    if (!response) {
      return { platform: name, url: testUrl, readiness: "BLOCKED", issue: "net::ERR_*" };
    }
    
    await page.waitForTimeout(1500);
    
    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
    
    if (bodyText.includes("Just a moment") || 
        bodyText.includes("Cloudflare") ||
        bodyText.includes("Attention Required") ||
        title.includes("Cloudflare")) {
      return { platform: name, url: testUrl, readiness: "BLOCKED", issue: "Cloudflare", title };
    }
    
    if (bodyText.includes(" unavailable ") ||
        bodyText.includes("Page not found") ||
        bodyText.includes("404") ||
        title.includes("404")) {
      return { platform: name, url: testUrl, readiness: "BLOCKED", issue: "Site down/404", title };
    }
    
    const formInfo = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      const submitBtns = document.querySelectorAll("button[type=submit], input[type=submit]");
      const submitKeywords = ["submit", "add your business", "add listing", "register", "create listing", "add company", "eintragen"];
      const buttons = Array.from(document.querySelectorAll("button")).map(b => b.textContent?.toLowerCase() || "");
      const hasSubmit = buttons.some(b => submitKeywords.some(k => b.includes(k)));
      const fieldNames = Array.from(inputs).map(i => `${(i as HTMLInputElement).name} ${(i as HTMLInputElement).placeholder}`.toLowerCase()).join(" ");
      const hasBasicFields = /name|company|email|phone|address|city|business/.test(fieldNames);
      
      return { fields: inputs.length, hasSubmit: hasSubmit || submitBtns.length > 0, hasBasicFields };
    });
    
    let readiness: Readiness = "MANUAL";
    let issue = "";
    
    if (formInfo.hasSubmit && formInfo.hasBasicFields && formInfo.fields > 3) {
      readiness = "AUTO";
      issue = `${formInfo.fields} fields`;
    } else if (formInfo.fields > 0) {
      readiness = "MANUAL";
      issue = `${formInfo.fields} fields, no submit`;
    } else {
      readiness = "MANUAL";
      issue = "No form found";
    }
    
    if (bodyText.includes("Sign in") && bodyText.includes("Password") && formInfo.fields === 0) {
      readiness = "MANUAL";
      issue = "Login wall";
    }
    
    return { platform: name, url: testUrl, readiness, issue, title };
    
  } catch (error) {
    return { 
      platform: name, url: testUrl, readiness: "BLOCKED", 
      issue: error instanceof Error ? error.message.slice(0, 40) : "unknown" 
    };
  } finally {
    if (browser) await browser.close();
  }
}

async function main() {
  console.log("Testing directories for automation readiness...\n");
  
  const dirs = await prisma.directory.findMany({
    where: { url: { not: null }, NOT: { url: "" } },
    select: { platform: true, url: true, status: true, automationMode: true }
  });
  
  // Dedupe by URL
  const byUrl = new Map<string, typeof dirs>();
  for (const d of dirs) {
    if (!byUrl.has(d.url!)) byUrl.set(d.url!, []);
    byUrl.get(d.url!)!.push(d);
  }
  
  const uniqueDirs = Array.from(byUrl.entries()).map(([url, entries]) => {
    entries.sort((a, b) => (a.automationMode === "AI_ASSISTED" ? 0 : 1) - (b.automationMode === "AI_ASSISTED" ? 0 : 1));
    return { platform: entries[0].platform, url };
  });
  
  console.log(`Total unique URLs: ${uniqueDirs.length}\n`);
  
  const results: DirResult[] = [];
  
  for (const dir of uniqueDirs) {
    process.stdout.write(`${dir.platform.padEnd(30)} ${(dir.url || "").slice(0, 35).padEnd(35)} `);
    const result = await testDirectory(dir.platform, dir.url!);
    results.push(result);
    console.log(`[${result.readiness.padEnd(8)}] ${result.issue}`);
    
    if (results.length % 20 === 0) {
      console.log(`\nProgress: ${results.length}/${uniqueDirs.length}\n`);
    }
    
    await new Promise(r => setTimeout(r, 800));
  }
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`SUMMARY`);
  console.log(`${"=".repeat(80)}`);
  
  const auto = results.filter(r => r.readiness === "AUTO");
  const manual = results.filter(r => r.readiness === "MANUAL");
  const blocked = results.filter(r => r.readiness === "BLOCKED");
  
  console.log(`\nAUTO (${auto.length}):`);
  for (const r of auto) {
    console.log(`  ✅ ${r.platform.padEnd(25)} ${r.url.slice(0, 40)}  ${r.issue}`);
  }
  
  console.log(`\nMANUAL (${manual.length}):`);
  for (const r of manual) {
    console.log(`  ⚠️  ${r.platform.padEnd(25)} ${r.url.slice(0, 40)}  ${r.issue}`);
  }
  
  console.log(`\nBLOCKED (${blocked.length}):`);
  for (const r of blocked) {
    console.log(`  ❌ ${r.platform.padEnd(25)} ${r.url.slice(0, 40)}  ${r.issue}`);
  }
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`FIRST 5 FOR AUTOMATION:`);
  for (const r of auto.slice(0, 5)) {
    console.log(`  ✅ ${r.platform} - ${r.url}`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);