import "dotenv/config";
import { chromium } from "playwright";
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
];

const ALREADY_TESTED = [
  "yellowpages.com", "manta.com", "designrush.com", "crunchbase.com", "medium.com",
  "trustpilot.com", "data-axle.com", "superpages.com", "merchantcircle.com", "ezlocal.com",
  "opendi.us", "spoke.com", "n49.com", "goodfirms.co", "agencyspotter.com",
  "themanifest.com", "hotfrog.com", "local.com", "brownbook.net", "alignable.com",
  "expertise.com", "sortlist.com", "bark.com", "digitalagencynetwork.com",
  "influencermarketinghub.com", "citylocalpro.com", "floridasbdc.org", "plantationchamber.org",
  "browardchamber.com",
];

async function classifyDir(browser, platform, baseUrl) {
  const cleanUrl = baseUrl.replace(/\/$/, "");
  
  const testPage = async (testUrl) => {
    let ctx = null;
    try {
      ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
      const p = await ctx.newPage();
      const resp = await p.goto(testUrl, { waitUntil: "domcontentloaded", timeout: 8000 }).catch(() => null);
      if (!resp) { await ctx.close(); return null; }
      await p.waitForTimeout(2000);
      const title = await p.title();
      const bodyText = await p.evaluate(() => document.body.innerText.slice(0, 500));
      if (bodyText.includes("Just a moment") || bodyText.includes("Cloudflare") || title.includes("Cloudflare")) {
        await ctx.close(); return { url: testUrl, title, cloudflare: true, fields: 0, text: bodyText.slice(0, 200) };
      }
      const info = await p.evaluate(() => {
        const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
        const forms = document.querySelectorAll("form");
        const pageText = document.body.innerText.toLowerCase();
        return {
          fields: inputs.length,
          forms: forms.length,
          fieldData: Array.from(inputs).slice(0, 15).map(el => ({
            tag: el.tagName, type: (el as HTMLInputElement).type, name: (el as HTMLInputElement).name,
            placeholder: (el as HTMLInputElement).placeholder || "",
            id: el.id || "",
          })),
          hasListingKW: /add business|add listing|submit business|claim listing|get listed/i.test(pageText),
          hasSearchKW: /search|find business|browse directories/i.test(pageText),
          hasLoginKW: /sign in|log in|login|create account/i.test(pageText),
        };
      });
      await ctx.close();
      return { url: testUrl, title, cloudflare: false, fields: info.fields, fieldData: info.fieldData, hasListingKW: info.hasListingKW, hasSearchKW: info.hasSearchKW, hasLoginKW: info.hasLoginKW };
    } catch {
      if (ctx) await ctx.close();
      return null;
    }
  };
  
  // Test base URL
  const base = await testPage(cleanUrl);
  if (!base) return { platform, baseUrl, type: "DEAD", action: "Site unreachable" };
  if (base.cloudflare) return { platform, baseUrl, type: "BLOCKED", action: "Cloudflare" };
  
  // If site has listing keywords on homepage, mark as promising
  if (base.hasListingKW && base.fields >= 3) {
    return { platform, baseUrl, submissionUrl: cleanUrl, type: "AUTO", fields: base.fields, action: "Listing form on homepage" };
  }
  
  // Try submission patterns
  for (const pattern of SUBMISSION_PATTERNS) {
    const result = await testPage(cleanUrl + pattern);
    if (!result) continue;
    if (result.cloudflare) return { platform, baseUrl, submissionUrl: result.url, type: "BLOCKED", action: `Cloudflare on ${pattern}` };
    // Real form: has listing keywords AND meaningful fields (3+)
    if (result.fields >= 3 && result.hasListingKW) {
      return { platform, baseUrl, submissionUrl: result.url, type: "AUTO", fields: result.fields, action: `Form on ${pattern} (${result.fields} fields)` };
    }
    if (result.fields >= 5 && result.hasListingKW) {
      return { platform, baseUrl, submissionUrl: result.url, type: "AUTO", fields: result.fields, action: `Rich form on ${pattern} (${result.fields} fields)` };
    }
  }
  
  // Classify based on what we found
  if (base.hasLoginKW) return { platform, baseUrl, type: "SEMI_AUTO", action: "Login required" };
  if (base.fields <= 2 && base.hasSearchKW) return { platform, baseUrl, type: "MANUAL", action: "Search page" };
  if (base.fields >= 2) return { platform, baseUrl, type: "MANUAL", action: `Non-listing form (${base.fields} fields)` };
  return { platform, baseUrl, type: "MANUAL", action: "No form found" };
}

async function main() {
  const dirs = await prisma.directory.findMany({
    where: { url: { not: null }, NOT: { url: "" } },
    select: { platform: true, url: true }
  });
  
  // Filter to only untested ones
  const untested = dirs.filter(d => !ALREADY_TESTED.some(t => d.url?.includes(t)));
  // Dedupe
  const seen = new Set();
  const unique = [];
  for (const d of untested) {
    if (!seen.has(d.url)) { seen.add(d.url); unique.push(d); }
  }
  
  console.log(`Testing ${unique.length} remaining directories...\n`);
  
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  for (const dir of unique) {
    process.stdout.write(`${dir.platform.padEnd(30)} ${dir.url?.slice(0, 30).padEnd(32)} `);
    const r = await classifyDir(browser, dir.platform, dir.url!);
    results.push(r);
    console.log(`[${r.type.padEnd(10)}] ${r.action}`);
    await new Promise(r => setTimeout(r, 300));
  }
  
  await browser.close();
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`RESULTS: ${results.length} directories`);
  console.log(`${"=".repeat(80)}`);
  
  const auto = results.filter(r => r.type === "AUTO");
  const semi = results.filter(r => r.type === "SEMI_AUTO");
  const manual = results.filter(r => r.type === "MANUAL");
  const blocked = results.filter(r => r.type === "BLOCKED");
  const dead = results.filter(r => r.type === "DEAD");
  
  console.log(`\nAUTO (${auto.length}):`);
  for (const r of auto) console.log(`  ✅ ${r.platform.padEnd(25)} ${r.submissionUrl} (${r.fields}f) - ${r.action}`);
  
  console.log(`\nSEMI_AUTO (${semi.length}):`);
  for (const r of semi) console.log(`  ⚠️  ${r.platform.padEnd(25)} - ${r.action}`);
  
  console.log(`\nMANUAL (${manual.length}):`);
  for (const r of manual) console.log(`  📋 ${r.platform.padEnd(25)} - ${r.action}`);
  
  console.log(`\nBLOCKED (${blocked.length}):`);
  for (const r of blocked) console.log(`  ❌ ${r.platform.padEnd(25)} - ${r.action}`);
  
  if (dead.length) {
    console.log(`\nDEAD (${dead.length}):`);
    for (const r of dead) console.log(`  💀 ${r.platform.padEnd(25)} - ${r.action}`);
  }
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`TOTAL: AUTO=${auto.length} SEMI=${semi.length} MANUAL=${manual.length} BLOCKED=${blocked.length} DEAD=${dead.length}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);