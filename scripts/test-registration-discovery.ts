/**
 * Registration-page discovery regression test.
 *
 * Usage:
 *   npx tsx scripts/test-registration-discovery.ts "https://www.provenexpert.com"
 *   npx tsx scripts/test-registration-discovery.ts "https://www.bark.com/en/us/sellers/create/" "https://www.topseos.com/registration"
 *
 * For each URL: opens a headed stealth page, runs discoverRegistrationPage and
 * prints the result (flow, confidence, signals, final URL). Does NOT fill/submit.
 */

import { launchStealthContext, stealthGoto, isCloudflareChallenge } from "../src/lib/automation/stealth";
import { discoverRegistrationPage } from "../src/lib/automation/registration-discovery";

async function run(url: string) {
  const label = url.replace(/^https?:\/\//, "").slice(0, 60);
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  ${label}`);
  console.log(`${"=".repeat(70)}`);

  let ctx: any = null;
  try {
    ctx = await launchStealthContext({ profile: `discovery-test`, headless: false });
    const page = await ctx.newPage();

    const logs: string[] = [];
    const log = (m: string) => { logs.push(m); console.log(`  ${m}`); };

    console.log(`  Navigating...`);
    await stealthGoto(page, url, 60000);
    await page.waitForTimeout(3000);

    const isCF = await isCloudflareChallenge(page);
    if (isCF) {
      console.log(`  ⛔ Cloudflare challenge — waiting up to 60s for manual solve...`);
      const start = Date.now();
      let cleared = false;
      while (Date.now() - start < 60000) {
        if (!(await isCloudflareChallenge(page))) { cleared = true; break; }
        await page.waitForTimeout(2000);
      }
      if (!cleared) {
        console.log(`  BLOCKED: Cloudflare not cleared`);
        await ctx.close();
        return;
      }
      console.log(`  Cloudflare cleared ✓`);
    }

    const result = await discoverRegistrationPage(page, log);

    console.log(`\n  RESULT:`);
    console.log(`    isRegistrationPage: ${result.isRegistrationPage}`);
    console.log(`    flow:               ${result.flow}`);
    console.log(`    confidence:         ${result.confidence}`);
    console.log(`    signals:            ${result.signals.join(", ") || "none"}`);
    console.log(`    url:                ${result.url}`);
    if (result.error) console.log(`    error:              ${result.error}`);

    await page.waitForTimeout(1500);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  FATAL: ${msg}`);
  } finally {
    if (ctx) {
      try { await ctx.close(); } catch {}
    }
  }
}

async function main() {
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    console.log("Usage: npx tsx scripts/test-registration-discovery.ts <url> [url...]");
    return;
  }
  for (const u of urls) {
    await run(u);
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
