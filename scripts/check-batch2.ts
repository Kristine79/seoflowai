import "dotenv/config";
import { chromium } from "playwright";

const BATCH2 = [
  { platform: "Moz", url: "https://moz.com" },
  { platform: "Yext", url: "https://www.yext.com" },
  { platform: "Birdeye", url: "https://birdeye.com" },
  { platform: "TopSEOs", url: "https://www.topseos.com" },
  { platform: "Bark.com", url: "https://www.bark.com" },
  { platform: "Behance", url: "https://www.behance.net" },
  { platform: "Dribbble", url: "https://dribbble.com" },
];

async function check(browser, platform, url) {
  let ctx = null;
  try {
    ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
    const p = await ctx.newPage();
    const resp = await p.goto(url, { waitUntil: "domcontentloaded", timeout: 12000 }).catch(() => null);
    if (!resp) { await ctx.close(); return { type: "FAILED", action: "Unreachable" }; }
    await p.waitForTimeout(1500);
    const title = await p.title();
    const bodyText = await p.evaluate(() => document.body.innerText.slice(0, 500));
    
    if (bodyText.includes("Just a moment") || bodyText.includes("Cloudflare") || title.includes("Cloudflare")) {
      await ctx.close(); return { type: "FAILED", action: "Cloudflare" };
    }
    
    const info = await p.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      const links = Array.from(document.querySelectorAll("a")).filter(a => /add business|add listing|submit|get listed|claim|register|partner|directory|become.*partner/i.test(a.textContent?.trim() || "")).slice(0, 5);
      const pageText = document.body.innerText.toLowerCase();
      return {
        fields: inputs.length,
        addLinks: links.map(a => ({ text: a.textContent?.trim().slice(0, 40), href: a.href })),
        hasListingKW: /add (business|listing|your)|submit (business|listing)|get listed|claim (your|this)|create (profile|listing)|partner.*program|become.*partner/i.test(pageText),
        hasSubscribeKW: /subscribe|newsletter|get updates/i.test(pageText),
        hasLoginKW: /sign in|log in|login|create account|register/i.test(pageText),
      };
    });
    await ctx.close();
    
    if (info.hasListingKW && info.fields >= 3) return { type: "NEEDS_MANUAL", action: `Listing form (${info.fields}f)` };
    if (info.addLinks.length > 0) return { type: "NEEDS_MANUAL", action: `Add link: ${info.addLinks[0].text} -> ${info.addLinks[0].href?.slice(0, 60)}` };
    if (info.hasLoginKW) return { type: "NEEDS_MANUAL", action: "Login/registration required" };
    if (info.hasSubscribeKW) return { type: "NOT_APPLICABLE", action: "Subscribe/content site" };
    return { type: "NOT_APPLICABLE", action: `Content site (${info.fields}f): ${title.slice(0, 40)}` };
  } catch { if (ctx) await ctx.close(); return { type: "FAILED", action: "Error" }; }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const dir of BATCH2) {
    const r = await check(browser, dir.platform, dir.url);
    console.log(`${dir.platform.padEnd(25)} [${r.type.padEnd(15)}] ${r.action}`);
  }
  await browser.close();
}

main().catch(console.error);