import "dotenv/config";
import { chromium } from "playwright";

interface DirTarget {
  platform: string;
  url: string;
}

const ALL_DIRECTORIES: DirTarget[] = [
  // SIMPLE (basic HTML form directories)
  { platform: "Yellow Pages", url: "https://www.yellowpages.com" },
  { platform: "Manta", url: "https://www.manta.com" },
  { platform: "Hotfrog", url: "https://www.hotfrog.com/add-business" },
  { platform: "Superpages", url: "https://www.superpages.com" },
  { platform: "Merchant Circle", url: "https://www.merchantcircle.com" },
  { platform: "Local.com", url: "https://www.local.com" },
  { platform: "EZlocal", url: "https://www.ezlocal.com" },
  { platform: "Opendi", url: "https://www.opendi.us" },
  { platform: "Spoke", url: "https://spoke.com" },
  { platform: "n49", url: "https://www.n49.com" },
  { platform: "Brownbook", url: "https://www.brownbook.net/add-business" }, // ✅ done

  // REVIEW
  { platform: "Trustpilot", url: "https://www.trustpilot.com" },
  { platform: "Sitejabber", url: "https://www.sitejabber.com" },
  { platform: "ProvenExpert", url: "https://www.provenexpert.com" },
  { platform: "G2", url: "https://www.g2.com" },

  // CONTENT
  { platform: "Medium", url: "https://medium.com" },
  { platform: "HubPages", url: "https://hubpages.com" },
  { platform: "EzineArticles", url: "https://ezinearticles.com" },
  { platform: "SlideShare", url: "https://www.slideshare.net" },
  { platform: "Quora", url: "https://www.quora.com" },
  { platform: "Tumblr", url: "https://www.tumblr.com" },
  { platform: "Business2Community", url: "https://www.business2community.com" },

  // SOCIAL / SPA
  { platform: "Crunchbase", url: "https://www.crunchbase.com" },
  { platform: "GitHub", url: "https://github.com" },
  { platform: "Stack Overflow", url: "https://stackoverflow.com" },
  { platform: "Behance", url: "https://www.behance.net" },
  { platform: "Dribbble", url: "https://dribbble.com" },
  { platform: "ProductHunt", url: "https://www.producthunt.com" },

  // AGENCY DIRECTORIES (MEDIUM)
  { platform: "GoodFirms", url: "https://www.goodfirms.co" },
  { platform: "DesignRush", url: "https://www.designrush.com" },
  { platform: "Agency Spotter", url: "https://www.agencyspotter.com" },
  { platform: "The Manifest", url: "https://themanifest.com" },
  { platform: "Expertise.com", url: "https://www.expertise.com" },
  { platform: "Sortlist", url: "https://www.sortlist.com" },
  { platform: "Bark.com", url: "https://www.bark.com" },
  { platform: "Semfirms", url: "https://semfirms.com" },
  { platform: "TopSEOs", url: "https://www.topseos.com" },
  { platform: "Influencer Marketing Hub", url: "https://influencermarketinghub.com" },
  { platform: "Digital Agency Network", url: "https://digitalagencynetwork.com" },
  { platform: "Alignable", url: "https://www.alignable.com" },
  { platform: "CityLocalPro", url: "https://www.citylocalpro.com" },
  { platform: "SCORE Mentor Network", url: "https://www.score.org" },
  { platform: "FL SBDC Network", url: "https://www.floridasbdc.org" },
  { platform: "SBA.gov Business", url: "https://www.sba.gov" },

  // LOCAL CHAMBERS
  { platform: "Plantation Chamber", url: "https://www.plantationchamber.org" },
  { platform: "Broward County Chamber", url: "https://browardchamber.com" },

  // SAAS PARTNERS (HARD)
  { platform: "ActiveCampaign", url: "https://www.activecampaign.com" },
  { platform: "HubSpot Agency Directory", url: "https://www.hubspot.com" },
  { platform: "Stripe Partner", url: "https://stripe.com/partners" },
  { platform: "Shopify Partners", url: "https://www.shopify.com/partners" },
  { platform: "Webflow Partner", url: "https://webflow.com" },
  { platform: "Mailchimp Partner", url: "https://mailchimp.com" },

  // DATA AGGREGATORS
  { platform: "Data Axle", url: "https://www.data-axle.com" },
  { platform: "Moz Local", url: "https://moz.com" },
  { platform: "Yext", url: "https://www.yext.com" },
  { platform: "Birdeye", url: "https://birdeye.com" },
  { platform: "BrightLocal", url: "https://www.brightlocal.com" },
  { platform: "Synup", url: "https://www.synup.com" },

  // TOOLS & TECH
  { platform: "SimilarWeb", url: "https://www.similarweb.com" },
  { platform: "BuiltWith", url: "https://builtwith.com" },
  { platform: "Datanyze", url: "https://www.datanyze.com" },
  { platform: "Wappalyzer", url: "https://www.wappalyzer.com" },

  // THEME & ASSETS
  { platform: "ThemeForest", url: "https://themeforest.net" },
  { platform: "CodeCanyon", url: "https://codecanyon.net" },
  { platform: "Freepik", url: "https://www.freepik.com" },
  { platform: "Flaticon", url: "https://www.flaticon.com" },
  { platform: "Placeit", url: "https://placeit.net" },

  // DEVS BLOGS
  { platform: "CSS-Tricks", url: "https://css-tricks.com" },
  { platform: "Smashing Magazine", url: "https://www.smashingmagazine.com" },
  { platform: "SitePoint", url: "https://www.sitepoint.com" },
  { platform: "Tuts+", url: "https://tutsplus.com" },
  { platform: "Envato", url: "https://envato.com" },
  { platform: "Kinsta", url: "https://kinsta.com" },
  { platform: "WPBeginner", url: "https://www.wpbeginner.com" },
  { platform: "Elegant Themes", url: "https://www.elegantthemes.com" },
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
    if (!resp) return null;
    await p.waitForTimeout(2000);
    const title = await p.title();
    const bodyText = await p.evaluate(() => document.body.innerText.slice(0, 500));
    if (bodyText.includes("Just a moment") || bodyText.includes("Cloudflare") || title.includes("Cloudflare")) {
      await ctx.close(); return { cloudflare: true, title, text: bodyText.slice(0, 200) };
    }
    const info = await p.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      const pageText = document.body.innerText.toLowerCase();
      return {
        fields: inputs.length,
        fieldData: Array.from(inputs).slice(0, 8).map(el => ({ name: (el as HTMLInputElement).name, placeholder: (el as HTMLInputElement).placeholder })),
        hasListingKW: /add business|add listing|submit business|claim listing|get listed|add your/i.test(pageText),
        hasLoginKW: /sign in|log in|login|create account/i.test(pageText),
        hasSearchKW: /search|find business|browse/i.test(pageText),
        hasSubscribeKW: /subscribe|newsletter|get updates/i.test(pageText),
        pageTitle: pageText.slice(0, 100),
      };
    });
    await ctx.close();
    return { cloudflare: false, ...info, title, baseText: bodyText.slice(0, 200) };
  } catch { if (ctx) await ctx.close(); return null; }
}

async function classify(browser, target: DirTarget) {
  const cleanUrl = target.url.replace(/\/$/, "");
  const base = await testUrl(browser, cleanUrl);
  if (!base) return { type: "DEAD", action: "Unreachable" };
  if (base.cloudflare) return { type: "BLOCKED", action: "Cloudflare" };
  
  // Check if this is a real listing form on the current page
  const isListingForm = base.fields >= 3 && base.hasListingKW;
  if (isListingForm) return { type: "AUTO", subUrl: cleanUrl, fields: base.fields, action: `Listing form (${base.fields}f)` };
  
  // If search/subscribe/login, classify accordingly  
  if (base.hasSubscribeKW && base.fields <= 3) return { type: "MANUAL", action: "Subscribe/newsletter form" };
  if (base.hasSearchKW && base.fields <= 2) return { type: "MANUAL", action: "Search page" };
  if (base.hasLoginKW && base.fields <= 3) return { type: "SEMI_AUTO", action: "Login required" };
  
  // Try submission URL patterns
  for (const pattern of SUBMISSION_PATTERNS) {
    const result = await testUrl(browser, cleanUrl + pattern);
    if (!result) continue;
    if (result.cloudflare) return { type: "BLOCKED", action: `Cloudflare on ${pattern}` };
    if (result.fields >= 3 && result.hasListingKW) {
      return { type: "AUTO", subUrl: cleanUrl + pattern, fields: result.fields, action: `Form on ${pattern} (${result.fields}f)` };
    }
    if (result.fields >= 5) {
      return { type: "PROMISING", subUrl: cleanUrl + pattern, fields: result.fields, action: `${result.fields} fields on ${pattern}` };
    }
  }
  
  // No listing form found
  if (base.fields >= 2) return { type: "MANUAL", action: `Non-listing form (${base.fields}f): ${base.pageTitle.slice(0, 60)}` };
  return { type: "MANUAL", action: `Empty/minimal page: ${base.title?.slice(0, 60) || "?"}` };
}

async function main() {
  console.log(`Testing all ${ALL_DIRECTORIES.length} directories...\n`);
  
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  for (let i = 0; i < ALL_DIRECTORIES.length; i++) {
    const dir = ALL_DIRECTORIES[i];
    process.stdout.write(`${(i+1).toString().padStart(2, " ")} ${dir.platform.padEnd(25)} ${dir.url.slice(0, 35).padEnd(37)} `);
    const r = await classify(browser, dir);
    results.push({ ...dir, ...r });
    console.log(`[${r.type.padEnd(10)}] ${r.action.slice(0, 50)}`);
    
    // Rate limit
    if (i % 10 === 9) console.log("");
  }
  
  await browser.close();
  
  // Summary
  const types = ["AUTO", "PROMISING", "SEMI_AUTO", "MANUAL", "BLOCKED", "DEAD"] as const;
  for (const t of types) {
    const filtered = results.filter(r => r.type === t);
    console.log(`\n${t} (${filtered.length}):`);
    for (const r of filtered) {
      console.log(`  ${t === "AUTO" ? "✅" : t === "PROMISING" ? "🔶" : t === "BLOCKED" ? "❌" : "  "} ${r.platform.padEnd(25)} ${r.subUrl || r.url} - ${r.action.slice(0, 50)}`);
    }
  }
  
  // Save to CSV
  const csv = ["platform,url,submissionUrl,type,fields,action"];
  for (const r of results) {
    csv.push(`${r.platform},${r.url},${r.subUrl || ""},${r.type},${r.fields || 0},${r.action}`);
  }
  require("fs").writeFileSync("classification-results.csv", csv.join("\n"));
  console.log("\nSaved to classification-results.csv");
}

main().catch(console.error);