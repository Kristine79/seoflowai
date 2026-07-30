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

const SUBMISSION_PATTERNS = [
  "/add-business",
  "/add-listing", 
  "/submit",
  "/listing",
  "/claim",
  "/register",
  "/create",
  "/new",
  "/business/add",
  "/company/add",
  "/unternehmen-eintragen",
  "/firmeneintrag",
  "/eintragen",
  "/anmelden",
  "/branchen/eintragen",
];

type SubmissionType = "AUTO" | "SEMI_AUTO" | "MANUAL" | "BLOCKED";
type BlockerType = "none" | "cloudflare" | "login_required" | "no_form" | "dead_site" | "paid_only" | "unknown";

interface DeepResult {
  platform: string;
  baseUrl: string;
  submissionUrl: string | null;
  type: SubmissionType;
  blocker: BlockerType;
  fields: number;
  title: string;
  action: string;
}

async function testSubmissionUrl(browser: Browser, baseUrl: string, submitPath: string): Promise<{ url: string | null; fields: number; title: string; hasCloudflare: boolean }> {
  const testUrl = baseUrl.replace(/\/$/, "") + submitPath;
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  });
  const page = await context.newPage();
  
  try {
    const response = await page.goto(testUrl, { waitUntil: "domcontentloaded", timeout: 12000 }).catch(() => null);
    if (!response) return { url: null, fields: 0, title: "", hasCloudflare: false };
    
    await page.waitForTimeout(1500);
    
    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    
    const hasCloudflare = bodyText.includes("Just a moment") || 
                          bodyText.includes("Cloudflare") ||
                          title.includes("Cloudflare") ||
                          title.includes("Checking your browser");
    
    if (hasCloudflare) {
      await context.close();
      return { url: testUrl, fields: 0, title, hasCloudflare: true };
    }
    
    const formInfo = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      const submitBtns = document.querySelectorAll("button[type=submit], input[type=submit]");
      return {
        fields: inputs.length,
        hasSubmit: submitBtns.length > 0,
        hasEmailField: Array.from(inputs).some(i => (i as HTMLInputElement).type === "email" || (i as HTMLInputElement).name.toLowerCase().includes("email")),
        hasNameField: Array.from(inputs).some(i => (i as HTMLInputElement).name.toLowerCase().includes("name") || (i as HTMLInputElement).placeholder?.toLowerCase().includes("name")),
        hasBusinessField: Array.from(inputs).some(i => 
          (i as HTMLInputElement).name.toLowerCase().includes("business") ||
          (i as HTMLInputElement).name.toLowerCase().includes("company") ||
          (i as HTMLInputElement).placeholder?.toLowerCase().includes("business") ||
          (i as HTMLInputElement).placeholder?.toLowerCase().includes("company")
        ),
      };
    });
    
    await context.close();
    return { 
      url: testUrl, 
      fields: formInfo.fields, 
      title, 
      hasCloudflare: false 
    };
    
  } catch {
    await context.close();
    return { url: null, fields: 0, title: "", hasCloudflare: false };
  }
}

async function classifyDirectory(browser: Browser, platform: string, baseUrl: string): Promise<DeepResult> {
  const cleanUrl = baseUrl.replace(/\/$/, "");
  
  // Try base URL first
  let bestResult: { url: string | null; fields: number; title: string; hasCloudflare: boolean } = {
    url: null, fields: 0, title: "", hasCloudflare: false
  };
  
  // Test base URL
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  });
  const page = await context.newPage();
  
  try {
    const response = await page.goto(cleanUrl, { waitUntil: "domcontentloaded", timeout: 12000 }).catch(() => null);
    if (response) {
      await page.waitForTimeout(1500);
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
      
      const hasCloudflare = bodyText.includes("Just a moment") || bodyText.includes("Cloudflare") || title.includes("Cloudflare");
      const hasLoginWall = bodyText.includes("Sign in") && bodyText.includes("Password") && bodyText.includes("Email");
      
      if (hasCloudflare) {
        await context.close();
        return { platform, baseUrl, submissionUrl: cleanUrl, type: "BLOCKED", blocker: "cloudflare", fields: 0, title, action: "Cloudflare protection" };
      }
      
      if (hasLoginWall) {
        await context.close();
        return { platform, baseUrl, submissionUrl: cleanUrl, type: "SEMI_AUTO", blocker: "login_required", fields: 0, title, action: "Login required - can automate form if logged in" };
      }
    }
  } catch {
    await context.close();
    return { platform, baseUrl, submissionUrl: null, type: "BLOCKED", blocker: "dead_site", fields: 0, title: "", action: "Site unreachable" };
  }
  
  await context.close();
  
  // Try submission URL patterns
  for (const pattern of SUBMISSION_PATTERNS) {
    const result = await testSubmissionUrl(browser, cleanUrl, pattern);
    if (result.url && result.fields > 0 && !result.hasCloudflare) {
      bestResult = result;
      break;
    }
    if (result.hasCloudflare) {
      return { platform, baseUrl, submissionUrl: result.url, type: "BLOCKED", blocker: "cloudflare", fields: 0, title: result.title, action: "Cloudflare on submission page" };
    }
  }
  
  if (bestResult.fields > 0) {
    return {
      platform,
      baseUrl,
      submissionUrl: bestResult.url,
      type: "AUTO",
      blocker: "none",
      fields: bestResult.fields,
      title: bestResult.title,
      action: "Form detected - can automate"
    };
  }
  
  // No submission form found
  return {
    platform,
    baseUrl,
    submissionUrl: bestResult.url || cleanUrl,
    type: "MANUAL",
    blocker: "no_form",
    fields: 0,
    title: bestResult.title,
    action: "No submission form found - manual review needed"
  };
}

async function main() {
  console.log("Deep classification of directories...\n");
  
  // Get unique directories from DB
  const dirs = await prisma.directory.findMany({
    where: { url: { not: null }, NOT: { url: "" } },
    select: { platform: true, url: true }
  });
  
  // Dedupe
  const byUrl = new Map<string, string>();
  for (const d of dirs) {
    if (!byUrl.has(d.url!)) byUrl.set(d.url!, d.platform);
  }
  
  const uniqueDirs = Array.from(byUrl.entries()).map(([url, platform]) => ({ platform, baseUrl: url }));
  
  console.log(`Total unique URLs: ${uniqueDirs.length}\n`);
  
  const results: DeepResult[] = [];
  const browser = await chromium.launch({ headless: true });
  
  for (const dir of uniqueDirs.slice(0, 20)) { // First 20 for speed
    process.stdout.write(`${dir.platform.padEnd(25)} ${(dir.baseUrl || "").slice(0, 30).padEnd(30)} `);
    
    const result = await classifyDirectory(browser, dir.platform, dir.baseUrl!);
    results.push(result);
    
    console.log(`[${result.type.padEnd(10)}] ${result.action}`);
    
    if (results.length % 5 === 0) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  await browser.close();
  
  // Summary
  console.log(`\n${"=".repeat(80)}`);
  console.log(`DEEP CLASSIFICATION RESULTS (first 20)`);
  console.log(`${"=".repeat(80)}`);
  
  const auto = results.filter(r => r.type === "AUTO");
  const semi = results.filter(r => r.type === "SEMI_AUTO");
  const manual = results.filter(r => r.type === "MANUAL");
  const blocked = results.filter(r => r.type === "BLOCKED");
  
  console.log(`\nAUTO (${auto.length}):`);
  for (const r of auto) {
    console.log(`  ✅ ${r.platform.padEnd(20)} ${r.submissionUrl} (${r.fields} fields) - ${r.action}`);
  }
  
  console.log(`\nSEMI_AUTO (${semi.length}):`);
  for (const r of semi) {
    console.log(`  ⚠️  ${r.platform.padEnd(20)} ${r.submissionUrl} - ${r.action}`);
  }
  
  console.log(`\nMANUAL (${manual.length}):`);
  for (const r of manual.slice(0, 10)) {
    console.log(`  ⚠️  ${r.platform.padEnd(20)} ${r.submissionUrl} - ${r.action}`);
  }
  
  console.log(`\nBLOCKED (${blocked.length}):`);
  for (const r of blocked.slice(0, 10)) {
    console.log(`  ❌ ${r.platform.padEnd(20)} ${r.action}`);
  }
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`FIRST 5 FOR PREVIEW (AUTO only):`);
  for (const r of auto.slice(0, 5)) {
    console.log(`  ✅ ${r.platform} - ${r.submissionUrl}`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);