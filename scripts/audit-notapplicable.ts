/**
 * NOT_APPLICABLE AUDIT — quick check of questionable platforms.
 * Checks each site to determine if a public business listing exists.
 * Does NOT submit, register, or change queue.
 */
import { chromium } from "playwright";
import fs from "fs";

interface AuditEntry {
  name: string;
  url: string;
  currentStatus: string;
  actualType: string;
  hasPublicListing: boolean;
  canClaim: boolean;
  canAddBusiness: boolean;
  isFree: boolean;
  recommendedStatus: string;
  reason: string;
  evidence: string;
}

const AUDIT_LIST: { name: string; url: string; checkUrl: string; category: string }[] = [
  { name: "Trustpilot", url: "https://www.trustpilot.com", checkUrl: "https://business.trustpilot.com/claim", category: "Reviews" },
  { name: "Foursquare Business", url: "https://business.foursquare.com", checkUrl: "https://business.foursquare.com/claim", category: "Aggregator" },
  { name: "Nextdoor Business", url: "https://business.nextdoor.com", checkUrl: "https://business.nextdoor.com/business-signup", category: "Local" },
  { name: "AngelList/Wellfound", url: "https://wellfound.com", checkUrl: "https://wellfound.com/companies/new", category: "Tech / Startup" },
  { name: "Express Update USA", url: "https://www.expressupdate.com", checkUrl: "https://www.expressupdate.com/claim", category: "Aggregator" },
  { name: "HubSpot Agency Dir", url: "https://www.hubspot.com/agencies", checkUrl: "https://www.hubspot.com/agencies/directory", category: "Partner Program" },
  { name: "Semrush Agency Partners", url: "https://www.semrush.com/agencies", checkUrl: "https://www.semrush.com/agencies", category: "Partner Program" },
  { name: "Webflow Partner", url: "https://webflow.com/partners", checkUrl: "https://webflow.com/partners", category: "Partner Program" },
  { name: "Find Best SEO", url: "https://www.findbestseo.com", checkUrl: "https://www.findbestseo.com/submit-agency", category: "Agency Directory" },
  { name: "Influencer Mkt Hub", url: "https://influencermarketinghub.com", checkUrl: "https://influencermarketinghub.com/submit-agency/", category: "Agency Directory" },
  { name: "Pinterest Business", url: "https://business.pinterest.com", checkUrl: "https://business.pinterest.com/business/create/", category: "Social" },
  { name: "GitHub", url: "https://github.com", checkUrl: "https://github.com/organizations/new", category: "Social" },
  { name: "Twitter / X", url: "https://twitter.com", checkUrl: "https://twitter.com/i/flow/signup", category: "Social" },
  { name: "SlideShare", url: "https://www.slideshare.net", checkUrl: "https://www.slideshare.net/signup", category: "Content" },
  { name: "SiteInspire", url: "https://www.siteinspire.com", checkUrl: "https://www.siteinspire.com/submit", category: "Portfolio" },
  { name: "ProductHunt", url: "https://www.producthunt.com", checkUrl: "https://www.producthunt.com/posts/new", category: "Tech / Startup" },
  { name: "Quora", url: "https://www.quora.com", checkUrl: "https://www.quora.com/", category: "Content" },
];

async function checkSite(page: any, entry: { name: string; url: string; checkUrl: string; category: string }): Promise<AuditEntry> {
  const result: AuditEntry = {
    name: entry.name,
    url: entry.url,
    currentStatus: "NOT_APPLICABLE",
    actualType: "",
    hasPublicListing: false,
    canClaim: false,
    canAddBusiness: false,
    isFree: true,
    recommendedStatus: "NOT_APPLICABLE",
    reason: "",
    evidence: "",
  };

  try {
    // First check the main submission URL
    await page.goto(entry.checkUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);
    let text = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");
    let curUrl = page.url();
    let title = await page.title();

    // Check if blocked by CF/403
    const isCF = text.includes("just a moment") || !!(await page.evaluate(() => document.querySelector("#cf-error-details")));
    if (isCF) {
      result.reason = "Site blocked by Cloudflare";
      result.evidence = `CF blocked: ${curUrl}`;
      return result;
    }

    // Check for keywords indicating business listing possibility
    const hasClaimFlow = /\bclaim\s+(your\s+)?(business|listing|company|profile|venue)\b/i.test(text);
    const hasAddBusiness = /\b(add|create|register)\s+(your\s+)?(business|company|listing|agency|profile)\b/i.test(text);
    const hasPublicDir = /\b(search|find|browse|directory)\s+(business|agency|company|partner)\b/i.test(text) || text.includes("browse") || text.includes("search");
    const hasLoginPage = /sign\s*in|log\s*in|create\s+account|register/i.test(text) && !!await page.evaluate(() => document.querySelector('input[type="password"]'));

    result.hasPublicListing = hasPublicDir;
    result.canClaim = hasClaimFlow;
    result.canAddBusiness = hasAddBusiness;

    result.evidence = `Checked: ${entry.checkUrl} -> ${curUrl}; hasClaim=${hasClaimFlow}, hasAdd=${hasAddBusiness}, hasDir=${hasPublicDir}, login=${hasLoginPage}`;

    // Determine recommended status
    if (hasPublicDir || hasClaimFlow || hasAddBusiness) {
      result.recommendedStatus = "NEEDS_MANUAL";
      result.reason = `Site has ${hasPublicDir ? 'public directory' : ''}${hasClaimFlow ? ', claim flow' : ''}${hasAddBusiness ? ', add business option' : ''}. Implementation complexity ≠ NOT_APPLICABLE.`;
    } else if (entry.category === "Partner Program") {
      // Check if there's a public directory alongside partner program
      if (text.includes("directory") || text.includes("find a") || text.includes("search")) {
        result.recommendedStatus = "NEEDS_MANUAL";
        result.reason = "Has public agency directory alongside partner program";
      } else {
        result.recommendedStatus = "NOT_APPLICABLE";
        result.reason = "Partner program only, no public business directory";
      }
    } else if (entry.category === "Social" || entry.category === "Content" || entry.category === "Portfolio" || entry.category === "Tech / Startup") {
      if (hasLoginPage) {
        result.recommendedStatus = "NEEDS_MANUAL";
        result.reason = "Registration/login required. Not NOT_APPLICABLE — company can create a profile.";
      } else {
        result.recommendedStatus = "NOT_APPLICABLE";
        result.reason = "No business listing mechanism found";
      }
    } else {
      result.recommendedStatus = "NOT_APPLICABLE";
      result.reason = "No clear business listing mechanism";
    }
  } catch (e) {
    result.evidence = `Error: ${(e as Error).message?.slice(0, 100)}`;
    result.reason = `Site unreachable or error during check`;
  }

  return result;
}

async function main() {
  console.log("=== NOT_APPLICABLE AUDIT — Quick check ===\n");

  const results: AuditEntry[] = [];
  const browser = await chromium.launch({ headless: true });

  for (const platform of AUDIT_LIST) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    console.log(`Checking ${platform.name}...`);
    const result = await checkSite(page, platform);
    result.currentStatus = "NOT_APPLICABLE";
    results.push(result);

    const icon = result.recommendedStatus !== "NOT_APPLICABLE" ? "⚠️" : "✅";
    console.log(`  ${icon} ${result.name.padEnd(22)} → ${result.recommendedStatus}`);
    console.log(`     ${result.reason.substring(0, 120)}`);
    console.log(`     ${result.evidence.substring(0, 120)}`);

    await context.close();
  }

  await browser.close();

  // Summary
  console.log("\n========================================");
  console.log("AUDIT SUMMARY (17 checked)");
  console.log("========================================\n");
  console.log("Platform".padEnd(24) + " | Current | Recommended | Reason");
  console.log("-".repeat(85));

  let reclassifyCount = 0;
  let confirmedCount = 0;

  for (const r of results) {
    const icon = r.recommendedStatus !== "NOT_APPLICABLE" ? "⚠️" : "✅";
    console.log(`${icon} ${r.name.padEnd(22)} | NA | ${r.recommendedStatus.padEnd(18)} | ${r.reason.substring(0, 40)}`);
    if (r.recommendedStatus !== "NOT_APPLICABLE") reclassifyCount++;
    else confirmedCount++;
  }

  console.log(`\nCONFIRMED_NOT_APPLICABLE: ${confirmedCount}`);
  console.log(`RECLASSIFY (potential):   ${reclassifyCount}`);
}

main().catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});