import "dotenv/config";
import { chromium } from "playwright";

// These all showed as DEAD but are well-known sites - retry with longer timeout
const RETRY = [
  // Agency directories
  { platform: "TopSEOs", url: "https://www.topseos.com" },
  { platform: "Semfirms", url: "https://semfirms.com" },
  { platform: "Digital Agency Network", url: "https://digitalagencynetwork.com" },
  { platform: "Bark.com", url: "https://www.bark.com" },
  { platform: "CityLocalPro", url: "https://www.citylocalpro.com" },
  { platform: "SCORE Mentor Network", url: "https://www.score.org" },
  { platform: "FL SBDC Network", url: "https://www.floridasbdc.org" },
  { platform: "SBA.gov Business", url: "https://www.sba.gov" },
  { platform: "Broward County Chamber", url: "https://browardchamber.com" },
  { platform: "ActiveCampaign", url: "https://www.activecampaign.com" },
  { platform: "HubSpot", url: "https://www.hubspot.com" },
  
  // Well-known sites
  { platform: "TopSEOs", url: "https://www.topseos.com" },
  { platform: "Envato", url: "https://envato.com" },
  { platform: "ThemeForest", url: "https://themeforest.net" },
  { platform: "Freepik", url: "https://www.freepik.com" },
  { platform: "CSS-Tricks", url: "https://css-tricks.com" },
  { platform: "Smashing Magazine", url: "https://www.smashingmagazine.com" },
  { platform: "WPBeginner", url: "https://www.wpbeginner.com" },
  { platform: "Behance", url: "https://www.behance.net" },
  { platform: "Dribbble", url: "https://dribbble.com" },
  { platform: "EzineArticles", url: "https://ezinearticles.com" },
  { platform: "SimilarWeb", url: "https://www.similarweb.com" },
  { platform: "BuiltWith", url: "https://builtwith.com" },
  
  // Data aggregators
  { platform: "Data Axle", url: "https://www.data-axle.com" },
  { platform: "Moz Local", url: "https://moz.com" },
  { platform: "Yext", url: "https://www.yext.com" },
  { platform: "Birdeye", url: "https://birdeye.com" },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  // Dedupe
  const seen = new Set();
  const unique = RETRY.filter(d => { const k = d.url; if (seen.has(k)) return false; seen.add(k); return true; });
  
  console.log(`Retrying ${unique.length} DEAD directories with 30s timeout...\n`);
  
  for (const dir of unique) {
    let ctx = null;
    try {
      ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
      const p = await ctx.newPage();
      process.stdout.write(`${dir.platform.padEnd(25)} ${dir.url.slice(0, 35).padEnd(37)} `);
      
      const start = Date.now();
      const resp = await p.goto(dir.url, { waitUntil: "domcontentloaded", timeout: 25000 }).catch(() => null);
      const elapsed = Date.now() - start;
      
      if (resp) {
        await p.waitForTimeout(2000);
        const title = await p.title();
        const bodyText = await p.evaluate(() => document.body.innerText.slice(0, 300));
        const hasCF = bodyText.includes("Just a moment") || bodyText.includes("Cloudflare") || title.includes("Cloudflare");
        if (hasCF) {
          console.log(`[CLOUDFLARE] ${elapsed}ms`);
        } else {
          console.log(`[ALIVE] ${resp.status()} ${title.slice(0, 40)} ${elapsed}ms`);
        }
      } else {
        console.log(`[DEAD] ${elapsed}ms`);
      }
      
      await ctx.close();
    } catch (e: any) {
      console.log(`[ERROR] ${e.message?.slice(0, 40) || ""}`);
      if (ctx) await ctx.close();
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  await browser.close();
  console.log("\nDone");
}

main().catch(console.error);