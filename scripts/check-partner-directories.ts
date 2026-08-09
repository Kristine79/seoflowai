import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const sites = [
    { name: "HubSpot Agency Directory", url: "https://www.hubspot.com/agencies/directory" },
    { name: "Semrush Agency Partners", url: "https://www.semrush.com/agencies" },
    { name: "Webflow Partner", url: "https://webflow.com/partners" },
  ];

  for (const site of sites) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    try {
      await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(3000);
      const text = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");
      const title = await page.title();
      const curUrl = page.url();
      const hasPublicDir = text.includes("search") || text.includes("browse") || text.includes("find a") || text.includes("directory");
      const hasAgencyList = text.includes("agency") || text.includes("partner");
      const hasFreeTier = text.includes("free") || text.includes("get started");
      
      console.log(`\n=== ${site.name} ===`);
      console.log(`URL: ${curUrl}`);
      console.log(`Title: ${title}`);
      console.log(`Has search/browse: ${hasPublicDir}`);
      console.log(`Has agency/partner content: ${hasAgencyList}`);
      console.log(`Has free/get started: ${hasFreeTier}`);
      console.log(`Text (first 300): ${text.slice(0, 300)}`);
      
      // Check for partner directory/search
      const profileLink = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a"));
        const dirLinks = links.filter(a => /agency|partner|directory|find|search|browse/i.test(a.textContent || ""));
        return dirLinks.slice(0, 5).map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href?.slice(0, 100) }));
      });
      console.log(`Directory/partner links: ${JSON.stringify(profileLink)}`);
    } catch (e) {
      console.log(`\n=== ${site.name} === ERROR: ${(e as Error).message?.slice(0, 100)}`);
    }
    await ctx.close();
  }
  await browser.close();
}

main().catch(console.error);