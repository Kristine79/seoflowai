import "dotenv/config";
import { chromium } from "playwright";

// Full list of ALL directories (combining first pass results with retry correction)
const ALL_DIRS = [
  // Already tested + alive retested
  { platform: "Yellow Pages", url: "https://www.yellowpages.com", known: "BLOCKED" },
  { platform: "Manta", url: "https://www.manta.com", known: "BLOCKED" },
  { platform: "Hotfrog", url: "https://www.hotfrog.com", known: "MANUAL" },
  { platform: "Superpages", url: "https://www.superpages.com", known: "BLOCKED" },
  { platform: "Merchant Circle", url: "https://www.merchantcircle.com", known: "MANUAL" },
  { platform: "Local.com", url: "https://www.local.com", known: "MANUAL" },
  { platform: "EZlocal", url: "https://www.ezlocal.com", known: "BLOCKED" },
  { platform: "Opendi", url: "https://www.opendi.us", known: "MANUAL" },
  { platform: "Spoke", url: "https://spoke.com", known: "MANUAL" },
  { platform: "n49", url: "https://www.n49.com", known: "MANUAL" },
  { platform: "Brownbook", url: "https://www.brownbook.net", known: "DONE" },
  { platform: "Trustpilot", url: "https://www.trustpilot.com", known: "MANUAL" },
  { platform: "Sitejabber", url: "https://www.sitejabber.com", known: "MANUAL" },
  { platform: "ProvenExpert", url: "https://www.provenexpert.com", known: "MANUAL" },
  { platform: "G2", url: "https://www.g2.com", known: "MANUAL" },
  { platform: "Medium", url: "https://medium.com", known: "SEMI_AUTO" },
  { platform: "HubPages", url: "https://hubpages.com", known: "MANUAL" },
  { platform: "EzineArticles", url: "https://ezinearticles.com", known: "DEAD" },
  { platform: "SlideShare", url: "https://www.slideshare.net", known: "MANUAL" },
  { platform: "Quora", url: "https://www.quora.com", known: "SEMI_AUTO" },
  { platform: "Tumblr", url: "https://www.tumblr.com", known: "MANUAL" },
  { platform: "Business2Community", url: "https://www.business2community.com", known: "MANUAL" },
  { platform: "Crunchbase", url: "https://www.crunchbase.com", known: "MANUAL" },
  { platform: "GitHub", url: "https://github.com", known: "MANUAL" },
  { platform: "Stack Overflow", url: "https://stackoverflow.com", known: "BLOCKED" },
  { platform: "Behance", url: "https://www.behance.net", known: "ALIVE_RETEST" },
  { platform: "Dribbble", url: "https://dribbble.com", known: "ALIVE_RETEST" },
  { platform: "ProductHunt", url: "https://www.producthunt.com", known: "MANUAL" },
  { platform: "GoodFirms", url: "https://www.goodfirms.co", known: "MANUAL" },
  { platform: "DesignRush", url: "https://www.designrush.com", known: "SEMI_AUTO" },
  { platform: "Agency Spotter", url: "https://www.agencyspotter.com", known: "MANUAL" },
  { platform: "The Manifest", url: "https://themanifest.com", known: "MANUAL" },
  { platform: "Expertise.com", url: "https://www.expertise.com", known: "MANUAL" },
  { platform: "Sortlist", url: "https://www.sortlist.com", known: "MANUAL" },
  { platform: "Bark.com", url: "https://www.bark.com", known: "MANUAL" },
  { platform: "Semfirms", url: "https://semfirms.com", known: "DEAD" },
  { platform: "TopSEOs", url: "https://www.topseos.com", known: "ALIVE_RETEST" },
  { platform: "Influencer Marketing Hub", url: "https://influencermarketinghub.com", known: "MANUAL" },
  { platform: "Digital Agency Network", url: "https://digitalagencynetwork.com", known: "ALIVE_RETEST" },
  { platform: "Alignable", url: "https://www.alignable.com", known: "SEMI_AUTO" },
  { platform: "CityLocalPro", url: "https://www.citylocalpro.com", known: "ALIVE_RETEST" },
  { platform: "SCORE Mentor Network", url: "https://www.score.org", known: "ALIVE_RETEST" },
  { platform: "FL SBDC Network", url: "https://www.floridasbdc.org", known: "ALIVE_RETEST" },
  { platform: "SBA.gov", url: "https://www.sba.gov", known: "ALIVE_RETEST" },
  { platform: "Plantation Chamber", url: "https://www.plantationchamber.org", known: "DEAD" },
  { platform: "Broward County Chamber", url: "https://browardchamber.com", known: "ALIVE_RETEST" },
  { platform: "ActiveCampaign", url: "https://www.activecampaign.com", known: "ALIVE_RETEST" },
  { platform: "HubSpot", url: "https://www.hubspot.com", known: "ALIVE_RETEST" },
  { platform: "Envato", url: "https://envato.com", known: "ALIVE_RETEST" },
  { platform: "ThemeForest", url: "https://themeforest.net", known: "CLOUDFLARE" },
  { platform: "Freepik", url: "https://www.freepik.com", known: "BLOCKED" },
  { platform: "CSS-Tricks", url: "https://css-tricks.com", known: "ALIVE_RETEST" },
  { platform: "Smashing Magazine", url: "https://www.smashingmagazine.com", known: "ALIVE_RETEST" },
  { platform: "WPBeginner", url: "https://www.wpbeginner.com", known: "ALIVE_RETEST" },
  { platform: "SimilarWeb", url: "https://www.similarweb.com", known: "ALIVE_RETEST" },
  { platform: "BuiltWith", url: "https://builtwith.com", known: "ALIVE_RETEST" },
  { platform: "Data Axle", url: "https://www.data-axle.com", known: "CLOUDFLARE" },
  { platform: "Moz", url: "https://moz.com", known: "ALIVE_RETEST" },
  { platform: "Yext", url: "https://www.yext.com", known: "ALIVE_RETEST" },
  { platform: "Birdeye", url: "https://birdeye.com", known: "ALIVE_RETEST" },
];

const SUBMISSION_PATHS = [
  "/add-business", "/add-listing", "/submit", "/listing", "/claim",
  "/register", "/create", "/new", "/add", "/business/add", "/company/add",
];

async function checkFormType(browser, url) {
  let ctx = null;
  try {
    ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
    const p = await ctx.newPage();
    const resp = await p.goto(url, { waitUntil: "domcontentloaded", timeout: 12000 }).catch(() => null);
    if (!resp) return null;
    await p.waitForTimeout(2000);
    const title = await p.title();
    const bodyText = await p.evaluate(() => document.body.innerText.slice(0, 400));
    
    if (bodyText.includes("Just a moment") || bodyText.includes("Cloudflare") || title.includes("Cloudflare"))
      return { cloudflare: true, title };
    
    const info = await p.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      const pageText = document.body.innerText.toLowerCase();
      const buttons = Array.from(document.querySelectorAll("a[href*='add'], a[href*='submit'], a[href*='register'], a[href*='create'], a[href*='claim']"))
        .slice(0, 5).map(a => ({ text: a.textContent?.trim().slice(0, 40), href: (a as HTMLAnchorElement).href }));
      
      return {
        fields: inputs.length,
        buttonCount: buttons.length,
        listingLinks: buttons,
        hasListingKW: /add (business|listing|company|your)|submit (business|listing)|get listed|claim (your|this)|create (profile|listing|account)/i.test(pageText),
        hasSearchKW: /search|find|browse/i.test(pageText),
        hasLoginKW: /sign in|log in|login|create account|register/i.test(pageText),
        titleTag: document.title?.slice(0, 80) || "",
      };
    });
    await ctx.close();
    return { cloudflare: false, ...info, title };
  } catch { if (ctx) await ctx.close(); return null; }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  // First, retest all ALIVE_RETEST ones
  const toRetest = ALL_DIRS.filter(d => d.known === "ALIVE_RETEST" || d.known === "CLOUDFLARE");
  
  console.log(`Re-testing ${toRetest.length} previously DEAD/CLOUDFLARE directories for forms...\n`);
  
  const results = [];
  for (const dir of toRetest) {
    process.stdout.write(`${dir.platform.padEnd(25)} ${dir.url.slice(0, 35).padEnd(37)} `);
    const base = await checkFormType(browser, dir.url);
    
    if (!base) {
      console.log(`[DEAD]`);
      results.push({ ...dir, type: "DEAD" });
      continue;
    }
    if (base.cloudflare) {
      console.log(`[CLOUDFLARE] ${base.title.slice(0, 30)}`);
      results.push({ ...dir, type: "BLOCKED" });
      continue;
    }
    
    // Check if this looks like a listing form
    let foundForm = false;
    if (base.hasListingKW && base.fields >= 3) {
      console.log(`[AUTO] ${base.fields}f listing keywords: ${base.title.slice(0, 40)}`);
      results.push({ ...dir, type: "AUTO", fields: base.fields, subUrl: dir.url, info: base });
      foundForm = true;
    }
    
    if (!foundForm && base.listingLinks && base.listingLinks.length > 0) {
      const addLinks = base.listingLinks.filter(l => /add|submit|claim|create|register/i.test(l.href || ""));
      if (addLinks.length > 0) {
        for (const link of addLinks.slice(0, 2)) {
          const href = link.href;
          if (href && !href.startsWith("javascript") && !href.startsWith("#")) {
            const subCheck = await checkFormType(browser, href);
            if (subCheck && !subCheck.cloudflare && subCheck.fields >= 3 && subCheck.hasListingKW) {
              console.log(`[AUTO via link] ${subCheck.fields}f at ${href.slice(0, 50)}`);
              results.push({ ...dir, type: "AUTO", fields: subCheck.fields, subUrl: href, info: subCheck });
              foundForm = true;
              break;
            }
          }
        }
      }
    }
    
    if (!foundForm) {
      // Try submission URL patterns
      for (const path of SUBMISSION_PATHS) {
        const subCheck = await checkFormType(browser, dir.url.replace(/\/$/, "") + path);
        if (subCheck && !subCheck.cloudflare && subCheck.fields >= 3 && subCheck.hasListingKW) {
          console.log(`[AUTO ${path}] ${subCheck.fields}f`);
          results.push({ ...dir, type: "AUTO", fields: subCheck.fields, subUrl: dir.url + path, info: subCheck });
          foundForm = true;
          break;
        }
        if (subCheck && subCheck.cloudflare) break;
      }
    }
    
    if (!foundForm) {
      const reason = base.hasLoginKW ? "Login" : base.hasSearchKW ? "Search" : base.fields <= 2 ? `Minimal (${base.fields}f)` : `Other (${base.fields}f)`;
      console.log(`[MANUAL] ${reason}: ${base.title?.slice(0, 40)}`);
      results.push({ ...dir, type: "MANUAL", fields: base.fields, info: base });
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  await browser.close();
  
  // Summary
  const auto = results.filter(r => r.type === "AUTO");
  console.log(`\n${"=".repeat(60)}`);
  console.log(`NEW AUTO DISCOVERIES: ${auto.length}`);
  console.log(`${"=".repeat(60)}`);
  for (const r of auto) {
    console.log(`  ✅ ${r.platform.padEnd(25)} ${r.subUrl || r.url}`);
  }
  
  console.log("\nDone");
}

main().catch(console.error);