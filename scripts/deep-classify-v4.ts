import "dotenv/config";
import { chromium } from "playwright";

// Hard-coded list of all directory platforms and URLs from the DB 
// (the remaining ones not yet tested)
const UNTESTED = [
  // Add known remaining directories here
  "SCORE Mentor Network,https://www.score.org",
  "Stack Overflow,https://stackoverflow.com",
  "GitHub,https://github.com",
  "Business2Community,https://www.business2community.com",
  "ActiveCampaign,https://www.activecampaign.com",
  "Semfirms,https://www.semfirms.com",
  "TopSEOs,https://www.topseos.com",
  "Digital Agency Net,https://digitalagencynetwork.com",
  "Top Design Firms,https://topdesignfirms.com",
  "Clutch.co,https://clutch.co",
  "Visual Objects,https://visualobjects.com",
  "The Digital Agency Guide,https://thedigitalagencyguide.com",
  "Business List,https://www.businesslist.com.ng",
  "FindTheCompany,https://www.findthecompany.com",
  "CompanyList,https://www.companylist.com",
  "Corporation Wiki,https://www.corporationwiki.com",
  "BizList,https://www.bizlist.com",
  "Moz Local,https://moz.com",
  "Yext,https://www.yext.com",
  "Birdeye,https://birdeye.com",
  "BrightLocal,https://www.brightlocal.com",
  "Synup,https://www.synup.com",
  "SimilarWeb,https://www.similarweb.com",
  "BuiltWith,https://builtwith.com",
  "Datanyze,https://www.datanyze.com",
  "Wappalyzer,https://www.wappalyzer.com",
  "Kinsta,https://kinsta.com",
  "WPBeginner,https://www.wpbeginner.com",
  "IsItWP,https://www.isitwp.com",
  "Themeisle,https://themeisle.com",
  "CodeinWP,https://www.codeinwp.com",
  "ManageWP,https://managewp.com",
  "WPMU DEV,https://wpmudev.com",
  "Elegant Themes,https://www.elegantthemes.com",
  "CSS-Tricks,https://css-tricks.com",
  "Smashing Magazine,https://www.smashingmagazine.com",
  "SitePoint,https://www.sitepoint.com",
  "Tuts+,https://tutsplus.com",
  "Envato,https://envato.com",
  "ThemeForest,https://themeforest.net",
  "CodeCanyon,https://codecanyon.net",
  "GraphicRiver,https://graphicriver.net",
  "Placeit,https://placeit.net",
  "Freepik,https://www.freepik.com",
  "Flaticon,https://www.flaticon.com",
  "Dribbble,https://dribbble.com",
  "Behance,https://www.behance.net",
  "DeviantArt,https://www.deviantart.com",
];

const SUBMISSION_PATTERNS = [
  "/add-business", "/add-listing", "/submit", "/listing", "/claim",
  "/register", "/create", "/new", "/business/add", "/company/add",
];

async function testUrl(browser, testUrl) {
  let ctx = null;
  try {
    ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
    const p = await ctx.newPage();
    const resp = await p.goto(testUrl, { waitUntil: "domcontentloaded", timeout: 8000 }).catch(() => null);
    if (!resp) { if (ctx) await ctx.close(); return null; }
    await p.waitForTimeout(2000);
    const title = await p.title();
    const bodyText = await p.evaluate(() => document.body.innerText.slice(0, 500));
    if (bodyText.includes("Just a moment") || bodyText.includes("Cloudflare") || title.includes("Cloudflare")) {
      await ctx.close(); return { title, cloudflare: true, fields: 0, text: bodyText.slice(0, 200) };
    }
    const info = await p.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      const pageText = document.body.innerText.toLowerCase();
      return {
        fields: inputs.length,
        fieldNames: Array.from(inputs).slice(0, 10).map(el => ({
          name: (el as HTMLInputElement).name || "", placeholder: (el as HTMLInputElement).placeholder || ""
        })),
        hasListingKW: /add business|add listing|submit business|claim listing|get listed/i.test(pageText),
        hasSearchKW: /search|find business|browse directories/i.test(pageText),
        hasLoginKW: /sign in|log in|login|create account/i.test(pageText),
      };
    });
    await ctx.close();
    return { title, cloudflare: false, ...info };
  } catch {
    if (ctx) await ctx.close();
    return null;
  }
}

async function classify(browser, platform, baseUrl) {
  const cleanUrl = baseUrl.replace(/\/$/, "");
  
  // Test base URL
  const base = await testUrl(browser, cleanUrl);
  if (!base) return { type: "DEAD", action: "Unreachable" };
  if (base.cloudflare) return { type: "BLOCKED", action: "Cloudflare" };
  
  // Check for listing submission keywords
  if (base.hasListingKW && base.fields >= 3) {
    return { type: "AUTO", subUrl: cleanUrl, fields: base.fields, action: `Listing form on homepage (${base.fields}f)` };
  }
  
  // Try submission patterns
  for (const pattern of SUBMISSION_PATTERNS) {
    const result = await testUrl(browser, cleanUrl + pattern);
    if (!result) continue;
    if (result.cloudflare) return { type: "BLOCKED", action: `Cloudflare on ${pattern}` };
    if (result.fields >= 3 && result.hasListingKW) {
      return { type: "AUTO", subUrl: cleanUrl + pattern, fields: result.fields, action: `Form on ${pattern} (${result.fields}f)` };
    }
  }
  
  if (base.hasLoginKW) return { type: "SEMI_AUTO", action: "Login required" };
  if (base.fields <= 2) return { type: "MANUAL", action: "Minimal page" };
  return { type: "MANUAL", action: `Non-listing form (${base.fields}f)` };
}

async function main() {
  console.log(`Testing ${UNTESTED.length} remaining directories...\n`);
  
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  for (const entry of UNTESTED) {
    const [platform, url] = entry.split(",");
    process.stdout.write(`${platform.padEnd(30)} ${url.slice(0, 35).padEnd(37)} `);
    const r = await classify(browser, platform, url);
    results.push({ platform, url, ...r });
    console.log(`[${r.type.padEnd(10)}] ${r.action}`);
    await new Promise(r => setTimeout(r, 300));
  }
  
  await browser.close();
  
  const auto = results.filter(r => r.type === "AUTO");
  const semi = results.filter(r => r.type === "SEMI_AUTO");
  const manual = results.filter(r => r.type === "MANUAL");
  const blocked = results.filter(r => r.type === "BLOCKED");
  const dead = results.filter(r => r.type === "DEAD");
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`AUTO (${auto.length}):`);
  for (const r of auto) console.log(`  ✅ ${r.platform.padEnd(25)} ${r.subUrl} (${r.fields}f) - ${r.action}`);
  
  console.log(`\nSEMI_AUTO (${semi.length}):`);
  for (const r of semi) console.log(`  ⚠️  ${r.platform.padEnd(25)} - ${r.action}`);
  
  console.log(`\nMANUAL (${manual.length}):`);
  for (const r of manual) console.log(`  📋 ${r.platform.padEnd(25)} - ${r.action}`);
  
  console.log(`\nBLOCKED (${blocked.length}):`);
  for (const r of blocked) console.log(`  ❌ ${r.platform.padEnd(25)} - ${r.action}`);
  
  if (dead.length) console.log(`\nDEAD (${dead.length}):`);
  for (const r of dead) console.log(`  💀 ${r.platform.padEnd(25)} - ${r.action}`);
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`TOTAL: AUTO=${auto.length} SEMI=${semi.length} MANUAL=${manual.length} BLOCKED=${blocked.length} DEAD=${dead.length}`);
}

main().catch(console.error);