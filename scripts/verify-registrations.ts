import { launchStealthContext, stealthGoto, screenshotToFile } from "../src/lib/automation/stealth";

interface CheckResult { name: string; url: string; accessible: boolean; hasLoginForm: boolean; notes: string; }

const TO_CHECK: { name: string; url: string; loginUrl?: string }[] = [
  { name: "Crunchbase", url: "https://www.crunchbase.com", loginUrl: "https://www.crunchbase.com/login" },
  { name: "GoodFirms", url: "https://www.goodfirms.co", loginUrl: "https://www.goodfirms.co/login" },
  { name: "Medium", url: "https://medium.com", loginUrl: "https://medium.com/m/signin" },
  { name: "Shopify Partners", url: "https://partners.shopify.com", loginUrl: "https://partners.shopify.com/login" },
  { name: "CityLocalPro", url: "https://citylocalpro.com/add-your-business" },
  { name: "DesignRush", url: "https://www.designrush.com/submit/agency" },
  { name: "Brownbook", url: "https://www.brownbook.net" },
];

async function main() {
  for (const item of TO_CHECK) {
    console.log(`\n=== ${item.name} ===`);
    console.log(`URL: ${item.url}`);

    let ctx: any = null;
    try {
      ctx = await launchStealthContext({ profile: `verify-${item.name.toLowerCase().replace(/[^a-z]/g,"-")}`, headless: true });
      const page = await ctx.newPage();

      await stealthGoto(page, item.url, 30000);
      await page.waitForTimeout(3000);

      const title = await page.title().catch(() => "N/A");
      const url = page.url();
      const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) || "").catch(() => "N/A");

      const hasLoginForm = await page.evaluate(() => {
        const html = document.body?.innerHTML?.toLowerCase() || "";
        return html.includes("login") || html.includes("sign in") || html.includes("password");
      }).catch(() => false);

      console.log(`  Title: ${title.slice(0, 60)}`);
      console.log(`  Final URL: ${url.slice(0, 80)}`);
      console.log(`  Has login form: ${hasLoginForm}`);
      console.log(`  Text: ${bodyText.slice(0, 200).replace(/\n/g, " ")}`);

      if (item.loginUrl) {
        await stealthGoto(page, item.loginUrl, 30000);
        await page.waitForTimeout(3000);
        const loginTitle = await page.title().catch(() => "N/A");
        const loginHasForm = await page.evaluate(() => {
          const html = document.body?.innerHTML?.toLowerCase() || "";
          return html.includes("password") || html.includes("login") || html.includes("sign in");
        }).catch(() => false);
        console.log(`  Login page: ${loginTitle.slice(0, 60)} | Has form: ${loginHasForm}`);
        await screenshotToFile(page, `verify-${item.name.toLowerCase().replace(/[^a-z]/g,"-")}-login.png`);
      }

      await screenshotToFile(page, `verify-${item.name.toLowerCase().replace(/[^a-z]/g,"-")}.png`);
    } catch (err) {
      console.log(`  ERROR: ${err instanceof Error ? err.message.slice(0, 100) : String(err)}`);
    } finally {
      if (ctx) try { await ctx.close(); } catch {}
    }
  }
}

main().catch(console.error);
