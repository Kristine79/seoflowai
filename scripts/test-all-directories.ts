import "dotenv/config";
import { chromium, Browser, Page } from "playwright";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import fs from "fs";

const url = new URL(process.env.DATABASE_URL || "");
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type Readiness = "AUTO" | "MANUAL" | "BLOCKED";

interface DirResult {
  platform: string;
  url: string;
  status: string;
  mode: string;
  readiness: Readiness;
  issue?: string;
  fields?: number;
  title?: string;
}

async function testDirectory(name: string, testUrl: string): Promise<DirResult> {
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();
    
    // Try to navigate
    const response = await page.goto(testUrl, { 
      waitUntil: "domcontentloaded", 
      timeout: 20000 
    }).catch((e: Error) => {
      return null;
    });
    
    if (!response) {
      return { platform: name, url: testUrl, status: "?", mode: "?", readiness: "BLOCKED", issue: "net::ERR_*" };
    }
    
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    // Check for Cloudflare
    if (bodyText.includes("Just a moment") || 
        bodyText.includes("Cloudflare") ||
        bodyText.includes("Attention Required") ||
        title.includes("Cloudflare")) {
      return { platform: name, url: testUrl, status: "BLOCKED", mode: "?", readiness: "BLOCKED", issue: "Cloudflare", title };
    }
    
    // Check for site down
    if (bodyText.includes(" unavailable ") ||
        bodyText.includes("Page not found") ||
        bodyText.includes("404") ||
        title.includes("404") ||
        response.status() === 404) {
      return { platform: name, url: testUrl, status: "BLOCKED", mode: "?", readiness: "BLOCKED", issue: "Site down/404", title };
    }
    
    // Check for connection errors
    if (bodyText.includes("ERR_CONNECTION") ||
        bodyText.includes("This site can't be reached")) {
      return { platform: name, url: testUrl, status: "BLOCKED", mode: "?", readiness: "BLOCKED", issue: "Connection error", title };
    }
    
    // Check for paid/registration walls
    if (bodyText.includes("Subscribe") ||
        bodyText.includes("Premium") ||
        bodyText.includes("Sign Up") && bodyText.includes("Pricing") ||
        bodyText.includes("paid listing")) {
      return { platform: name, url: testUrl, status: "MANUAL", mode: "?", readiness: "MANUAL", issue: "Paid/Registration wall", title };
    }
    
    // Check for submission form
    const formInfo = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      const forms = document.querySelectorAll("form");
      const submitBtns = document.querySelectorAll("button[type=submit], input[type=submit]");
      
      // Look for submit-like buttons
      const submitKeywords = ["submit", "add your business", "add listing", "register", "create listing", "add company", "eintragen", "anmelden"];
      const buttons = Array.from(document.querySelectorAll("button")).map(b => b.textContent?.toLowerCase() || "");
      const hasSubmit = buttons.some(b => submitKeywords.some(k => b.includes(k)));
      
      // Look for email/name/phone fields (basic business listing fields)
      const fieldNames = Array.from(inputs).map(i => (i as HTMLInputElement).name + " " + (i as HTMLInputElement).placeholder).join(" ").toLowerCase();
      const hasBasicFields = /name|company|email|phone|address|city|business/.test(fieldNames);
      
      return {
        fields: inputs.length,
        forms: forms.length,
        hasSubmit: hasSubmit || submitBtns.length > 0,
        hasBasicFields
      };
    });
    
    // Determine readiness
    let readiness: Readiness = "MANUAL";
    let issue = "";
    
    if (formInfo.hasSubmit && formInfo.hasBasicFields && formInfo.fields > 3) {
      readiness = "AUTO";
      issue = `${formInfo.fields} fields, ${formInfo.forms} forms`;
    } else if (formInfo.hasSubmit) {
      readiness = "MANUAL";
      issue = "Has submit but missing basic fields";
    } else if (formInfo.fields > 0) {
      readiness = "MANUAL";
      issue = "No submit button found";
    } else {
      readiness = "MANUAL";
      issue = "No form fields found";
    }
    
    // Check for specific keywords
    if (bodyText.includes("Sign in") && bodyText.includes("Password")) {
      readiness = "MANUAL";
      issue = "Login wall (requires account)";
    }
    
    if (bodyText.includes("verify") || bodyText.includes("confirmation") || bodyText.includes("email")) {
      // Email verification likely needed after submission
    }
    
    return { 
      platform: name, 
      url: testUrl, 
      status: "READY", 
      mode: "AI_ASSISTED", 
      readiness, 
      issue,
      fields: formInfo.fields,
      title
    };
    
  } catch (error) {
    return { 
      platform: name, 
      url: testUrl, 
      status: "BLOCKED", 
      mode: "?", 
      readiness: "BLOCKED", 
      issue: error instanceof Error ? error.message.slice(0, 50) : "unknown" 
    };
  } finally {
    if (browser) await browser.close();
  }
}

async function main() {
  console.log("Testing all directories for automation readiness...\n");
  
  // Get all unique directories
  const dirs = await prisma.directory.findMany({
    where: { url: { not: null }, NOT: { url: "" } },
    select: { platform: true, url: true, status: true, automationMode: true }
  });
  
  // Group by URL and pick best
  const byUrl = new Map<string, typeof dirs>();
  for (const d of dirs) {
    const key = d.url!;
    if (!byUrl.has(key)) byUrl.set(key, []);
    byUrl.get(key)!.push(d);
  }
  
  const uniqueDirs = Array.from(byUrl.entries()).map(([url, entries]) => {
    const priority: Record<string, number> = { READY: 0, AI_PREPARED: 1, PENDING: 2, MANUAL: 3 };
    entries.sort((a, b) => (priority[a.automationMode] ?? 3) - (priority[b.automationMode] ?? 3));
    return { platform: entries[0].platform, url, status: entries[0].status, mode: entries[0].automationMode };
  });
  
  console.log(`Total unique URLs: ${uniqueDirs.length}\n`);
  
  const results: DirResult[] = [];
  
  for (const dir of uniqueDirs) {
    process.stdout.write(`Testing: ${dir.platform.padEnd(30)} ${dir.url.slice(0, 40).padEnd(40)} `);
    const result = await testDirectory(dir.platform, dir.url);
    results.push(result);
    console.log(`[${result.readiness}] ${result.issue || ""}`);
    
    // Save progress periodically
    if (results.length % 10 === 0) {
      fs.writeFileSync("directory_test_results.json", JSON.stringify(results, null, 2));
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Final save
  fs.writeFileSync("directory_test_results.json", JSON.stringify(results, null, 2));
  
  // Summary
  console.log(`\n${"=".repeat(80)}`);
  console.log(`RESULTS SUMMARY`);
  console.log(`${"=".repeat(80)}`);
  
  const auto = results.filter(r => r.readiness === "AUTO");
  const manual = results.filter(r => r.readiness === "MANUAL");
  const blocked = results.filter(r => r.readiness === "BLOCKED");
  
  console.log(`\nAUTO (${auto.length}):`);
  for (const r of auto) {
    console.log(`  ✅ ${r.platform.padEnd(25)} ${r.url.padEnd(45)} ${r.issue}`);
  }
  
  console.log(`\nMANUAL (${manual.length}):`);
  for (const r of manual.slice(0, 15)) {
    console.log(`  ⚠️  ${r.platform.padEnd(25)} ${r.url.padEnd(45)} ${r.issue}`);
  }
  if (manual.length > 15) console.log(`  ... and ${manual.length - 15} more`);
  
  console.log(`\nBLOCKED (${blocked.length}):`);
  for (const r of blocked.slice(0, 15)) {
    console.log(`  ❌ ${r.platform.padEnd(25)} ${r.url.padEnd(45)} ${r.issue}`);
  }
  if (blocked.length > 15) console.log(`  ... and ${blocked.length - 15} more`);
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`FIRST 5 FOR AUTOMATION (from AUTO):`);
  for (const r of auto.slice(0, 5)) {
    console.log(`  ✅ ${r.platform} - ${r.url}`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);