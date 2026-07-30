import "dotenv/config";
import { chromium } from "playwright";

const REMAINING = [
  { platform: "SBA.gov", url: "https://www.sba.gov" },
  { platform: "ActiveCampaign", url: "https://www.activecampaign.com" },
  { platform: "HubSpot", url: "https://www.hubspot.com" },
  { platform: "Envato", url: "https://envato.com" },
  { platform: "CSS-Tricks", url: "https://css-tricks.com" },
  { platform: "Smashing Magazine", url: "https://www.smashingmagazine.com" },
  { platform: "WPBeginner", url: "https://www.wpbeginner.com" },
  { platform: "SimilarWeb", url: "https://www.similarweb.com" },
  { platform: "BuiltWith", url: "https://builtwith.com" },
  { platform: "Moz", url: "https://moz.com" },
  { platform: "Yext", url: "https://www.yext.com" },
  { platform: "Birdeye", url: "https://birdeye.com" },
  { platform: "TopSEOs", url: "https://www.topseos.com" },
  { platform: "Bark.com", url: "https://www.bark.com" },
  { platform: "Behance", url: "https://www.behance.net" },
  { platform: "Dribbble", url: "https://dribbble.com" },
];

const SUBMISSION_PATHS = [
  "/add-business", "/add-listing", "/submit", "/listing", "/claim",
  "/register", "/create", "/new", "/business/add", "/company/add",
  "/partner", "/partners", "/directory", "/get-listed",
];

async function checkPage(browser, url) {
  let ctx = null;
  try {
    ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
    const p = await ctx.newPage();
    const resp = await p.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null);
    if (!resp) return null;
    await p.waitForTimeout(2000);
    const title = await p.title();
    const bodyText = await p.evaluate(() => document.body.innerText.slice(0, 500));
    
    const hasCF = bodyText.includes("Just a moment") || bodyText.includes("Cloudflare") || title.includes("Cloudflare");
    if (hasCF) { await ctx.close(); return { cloudflare: true, title }; }
    
    const info = await p.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      const links = Array.from(document.querySelectorAll("a")).slice(0, 20);
      const pageText = document.body.innerText.toLowerCase();
      return {
        fields: inputs.length,
        fieldData: Array.from(inputs).slice(0, 10).map(el => ({
          name: (el as HTMLInputElement).name, placeholder: (el as HTMLInputElement).placeholder,
          type: (el as HTMLInputElement).type || el.tagName,
        })),
        addLinks: links.filter(a => /add business|add listing|submit|get listed|claim|register|partner|directory|become.*partner/i.test(a.textContent?.trim() || "")).slice(0, 5).map(a => ({
          text: a.textContent?.trim().slice(0, 40),
          href: a.href,
        })),
        hasListingKW: /add (business|listing|your)|submit (business|listing)|get listed|claim (your|this)|create (profile|listing)|partner.*program|become.*partner|directory.*submission/i.test(pageText),
        hasSearchKW: /search|find|browse/i.test(pageText),
        hasLoginKW: /sign in|log in|login|create account|register/i.test(pageText),
        hasSubscribeKW: /subscribe|newsletter|get updates|email.*list/i.test(pageText),
        pageTitle: pageText.slice(0, 300),
      };
    });
    await ctx.close();
    return { cloudflare: false, ...info, title };
  } catch { if (ctx) await ctx.close(); return null; }
}

async function classifyDir(browser, platform, baseUrl) {
  const cleanUrl = baseUrl.replace(/\/$/, "");
  const base = await checkPage(browser, cleanUrl);
  
  if (!base) return { platform, url: cleanUrl, type: "FAILED", action: "Site unreachable" };
  if (base.cloudflare) return { platform, url: cleanUrl, type: "FAILED", action: "Cloudflare protection" };
  
  // Check for listing form on homepage
  if (base.hasListingKW && base.fields >= 3) {
    return { platform, url: cleanUrl, subUrl: cleanUrl, type: "NEEDS_MANUAL", fields: base.fields, action: `Listing form on homepage (${base.fields}f)` };
  }
  
  // Check for add/listing links on homepage
  if (base.addLinks && base.addLinks.length > 0) {
    for (const link of base.addLinks) {
      if (link.href && !link.href.startsWith("javascript") && !link.href.startsWith("#")) {
        const subCheck = await checkPage(browser, link.href);
        if (subCheck && !subCheck.cloudflare && subCheck.fields >= 3 && subCheck.hasListingKW) {
          return { platform, url: cleanUrl, subUrl: link.href, type: "NEEDS_MANUAL", fields: subCheck.fields, action: `Listing form at ${link.text}: ${link.href.slice(0, 60)}` };
        }
      }
    }
  }
  
  // Try submission URL patterns
  for (const path of SUBMISSION_PATHS) {
    const subCheck = await checkPage(browser, cleanUrl + path);
    if (subCheck && !subCheck.cloudflare && subCheck.fields >= 3 && subCheck.hasListingKW) {
      return { platform, url: cleanUrl, subUrl: cleanUrl + path, type: "NEEDS_MANUAL", fields: subCheck.fields, action: `Form on ${path} (${subCheck.fields}f)` };
    }
  }
  
  // Classify based on what we found
  if (base.hasLoginKW && base.fields <= 5) return { platform, url: cleanUrl, type: "NEEDS_MANUAL", action: "Login/registration required" };
  if (base.hasSubscribeKW && base.fields <= 3) return { platform, url: cleanUrl, type: "NOT_APPLICABLE", action: "Subscribe/newsletter site" };
  if (base.hasSearchKW && base.fields <= 3) return { platform, url: cleanUrl, type: "NOT_APPLICABLE", action: "Search/content site" };
  if (base.fields <= 2) return { platform, url: cleanUrl, type: "NOT_APPLICABLE", action: "Content/marketing site" };
  return { platform, url: cleanUrl, type: "NOT_APPLICABLE", action: `Non-listing site (${base.fields}f): ${base.title?.slice(0, 40)}` };
}

async function main() {
  console.log(`Checking ${REMAINING.length} remaining directories...\n`);
  
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  for (const dir of REMAINING) {
    process.stdout.write(`${dir.platform.padEnd(25)} ${dir.url.slice(0, 35).padEnd(37)} `);
    const r = await classifyDir(browser, dir.platform, dir.url);
    results.push(r);
    console.log(`[${r.type.padEnd(15)}] ${r.action.slice(0, 60)}`);
    await new Promise(res => setTimeout(res, 500));
  }
  
  await browser.close();
  
  // Summary
  console.log(`\n${"=".repeat(80)}`);
  console.log(`REMAINING DIRECTORIES RESULTS`);
  console.log(`${"=".repeat(80)}`);
  
  for (const type of ["SUCCESS", "NEEDS_MANUAL", "FAILED", "NOT_APPLICABLE"]) {
    const filtered = results.filter(r => r.type === type);
    console.log(`\n${type} (${filtered.length}):`);
    for (const r of filtered) {
      console.log(`  ${r.platform.padEnd(25)} ${r.subUrl || r.url} - ${r.action.slice(0, 60)}`);
    }
  }
  
  // Save to file
  const lines = results.map(r => `${r.platform}|${r.url}|${r.type}|${r.action}`);
  require("fs").writeFileSync("remaining-directories-results.txt", lines.join("\n"));
  console.log("\nSaved to remaining-directories-results.txt");
}

main().catch(console.error);