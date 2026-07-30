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
  "/add-business", "/add-listing", "/submit", "/listing", "/claim",
  "/register", "/create", "/new", "/business/add", "/company/add",
  "/unternehmen-eintragen", "/firmeneintrag", "/eintragen", "/anmelden",
];

type SubmissionType = "AUTO" | "SEMI_AUTO" | "MANUAL" | "BLOCKED";

interface DeepResult {
  platform: string;
  baseUrl: string;
  submissionUrl: string | null;
  type: SubmissionType;
  blocker: string;
  fields: number;
  action: string;
}

async function testPage(browser: Browser, testUrl: string): Promise<{fields: number; hasCloudflare: boolean; title: string}> {
  let context = null;
  try {
    context = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
    const page = await context.newPage();
    const response = await page.goto(testUrl, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null);
    if (!response) return { fields: 0, hasCloudflare: false, title: "" };
    await page.waitForTimeout(1500);
    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    const hasCloudflare = bodyText.includes("Just a moment") || bodyText.includes("Cloudflare") || title.includes("Cloudflare");
    if (hasCloudflare) { await context.close(); return { fields: 0, hasCloudflare: true, title }; }
    const info = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      return { fields: inputs.length };
    });
    await context.close();
    return { fields: info.fields, hasCloudflare: false, title };
  } catch { if (context) await context.close(); return { fields: 0, hasCloudflare: false, title: "" }; }
}

async function main() {
  const dirs = await prisma.directory.findMany({
    where: { url: { not: null }, NOT: { url: "" } },
    select: { platform: true, url: true }
  });
  
  const byUrl = new Map<string, string>();
  for (const d of dirs) byUrl.set(d.url!, d.platform);
  const unique = Array.from(byUrl.entries()).map(([url, platform]) => ({ platform, baseUrl: url }));
  
  console.log(`Testing ${unique.length} directories...\n`);
  
  const browser = await chromium.launch({ headless: true });
  const results: DeepResult[] = [];
  
  for (const dir of unique) {
    const cleanUrl = dir.baseUrl!.replace(/\/$/, "");
    process.stdout.write(`${dir.platform.padEnd(25)} ${cleanUrl.slice(0, 35).padEnd(35)} `);
    
    // Test base URL
    const base = await testPage(browser, cleanUrl);
    
    if (base.hasCloudflare) {
      results.push({ platform: dir.platform, baseUrl: cleanUrl, submissionUrl: cleanUrl, type: "BLOCKED", blocker: "cloudflare", fields: 0, action: "Cloudflare" });
      console.log(`[BLOCKED] Cloudflare`);
      continue;
    }
    
    if (base.fields === 0) {
      // Try submission patterns
      let found = false;
      for (const pattern of SUBMISSION_PATTERNS) {
        const result = await testPage(browser, cleanUrl + pattern);
        if (result.fields > 0 && !result.hasCloudflare) {
          results.push({ platform: dir.platform, baseUrl: cleanUrl, submissionUrl: cleanUrl + pattern, type: "AUTO", blocker: "none", fields: result.fields, action: `Form (${result.fields} fields)` });
          console.log(`[AUTO] ${cleanUrl}${pattern} (${result.fields} fields)`);
          found = true;
          break;
        }
        if (result.hasCloudflare) {
          results.push({ platform: dir.platform, baseUrl: cleanUrl, submissionUrl: cleanUrl + pattern, type: "BLOCKED", blocker: "cloudflare", fields: 0, action: "Cloudflare on submission" });
          console.log(`[BLOCKED] Cloudflare on ${pattern}`);
          found = true;
          break;
        }
      }
      if (!found) {
        results.push({ platform: dir.platform, baseUrl: cleanUrl, submissionUrl: cleanUrl, type: "MANUAL", blocker: "no_form", fields: base.fields, action: "No submission form" });
        console.log(`[MANUAL] No submission form found`);
      }
    } else {
      results.push({ platform: dir.platform, baseUrl: cleanUrl, submissionUrl: cleanUrl, type: "AUTO", blocker: "none", fields: base.fields, action: `Form on homepage (${base.fields} fields)` });
      console.log(`[AUTO] Homepage form (${base.fields} fields)`);
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  await browser.close();
  
  // Summary
  const auto = results.filter(r => r.type === "AUTO");
  const semi = results.filter(r => r.type === "SEMI_AUTO");
  const manual = results.filter(r => r.type === "MANUAL");
  const blocked = results.filter(r => r.type === "BLOCKED");
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`SUMMARY: ${results.length} directories`);
  console.log(`${"=".repeat(80)}`);
  
  console.log(`\nAUTO (${auto.length}):`);
  for (const r of auto) console.log(`  ✅ ${r.platform.padEnd(25)} ${r.submissionUrl} (${r.fields}f) - ${r.action}`);
  
  console.log(`\nMANUAL (${manual.length}):`);
  for (const r of manual) console.log(`  ⚠️  ${r.platform.padEnd(25)} ${r.submissionUrl} - ${r.action}`);
  
  console.log(`\nBLOCKED (${blocked.length}):`);
  for (const r of blocked) console.log(`  ❌ ${r.platform.padEnd(25)} ${r.action}`);
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`FIRST 5 AUTO:`);
  for (const r of auto.slice(0, 5)) console.log(`  ✅ ${r.platform} - ${r.submissionUrl}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);