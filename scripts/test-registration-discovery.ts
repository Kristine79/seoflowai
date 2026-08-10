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
import { extractFormStructure } from "../src/lib/automation/form-analyzer";

type LiveExpectation = {
  name: string;
  expectedFlow: "REGISTER";
  finalUrl: RegExp;
};

const LIVE_EXPECTATIONS: LiveExpectation[] = [
  { name: "ProvenExpert", expectedFlow: "REGISTER", finalUrl: /provenexpert\.com\/.*register/i },
  { name: "Bark", expectedFlow: "REGISTER", finalUrl: /bark\.com\/.*sellers\/create/i },
  { name: "Wellfound", expectedFlow: "REGISTER", finalUrl: /wellfound\.com\/signup/i },
  { name: "HubSpot", expectedFlow: "REGISTER", finalUrl: /app\.hubspot\.com\/signup-hubspot\/crm/i },
];

function getLiveExpectation(url: string): LiveExpectation | null {
  try {
    const hostname = new URL(url).hostname;
    if (hostname === "www.provenexpert.com") return LIVE_EXPECTATIONS[0];
    if (hostname === "www.bark.com") return LIVE_EXPECTATIONS[1];
    if (hostname === "wellfound.com") return LIVE_EXPECTATIONS[2];
    if (hostname === "app.hubspot.com") return LIVE_EXPECTATIONS[3];
  } catch {}
  return null;
}

async function runSyntheticScenarios() {
  console.log(`\n${"=".repeat(70)}`);
  console.log("  Synthetic fallback-chain regression");
  console.log(`${"=".repeat(70)}`);

  const context = await launchStealthContext({ profile: "discovery-test-synthetic", headless: false });
  try {
    const page = await context.newPage();
    await page.route("**/*", async (route) => {
      const requestUrl = new URL(route.request().url());
      if (requestUrl.hostname === "synthetic.test" || requestUrl.hostname === "signup.synthetic.test") {
        let body = "<html><body><h1>Generic landing page</h1></body></html>";
        if (requestUrl.hostname === "synthetic.test" && requestUrl.pathname === "/stale") {
          body = `
            <html><body>
              <h1>Page not found</h1>
              <p>Get started here</p>
              <a href="https://synthetic.test/products/get-started">Get started here</a>
            </body></html>`;
        } else if (requestUrl.hostname === "synthetic.test" && requestUrl.pathname === "/products/get-started") {
          body = `
            <html><body>
              <h1>Product overview</h1>
              <form style="display:none"><input type="email" name="email"><input name="company"></form>
              <a href="https://signup.synthetic.test/signup?step=landing_page&next=1">Create your account</a>
            </body></html>`;
        } else if (requestUrl.hostname === "signup.synthetic.test" && requestUrl.pathname === "/signup") {
          body = `
            <html><body>
              <h1>Create your account</h1>
              <form><label>Email <input type="email" name="email"></label></form>
              <a href="https://signup.synthetic.test/login">Sign in</a>
            </body></html>`;
        } else if (requestUrl.hostname === "synthetic.test" && requestUrl.pathname === "/negative") {
          body = `
            <html><body>
              <h1>Product overview</h1>
              <form style="display:none"><input type="email" name="email"><input name="company"></form>
              <p>Explore product features and pricing.</p>
            </body></html>`;
        } else if (requestUrl.hostname === "synthetic.test" && requestUrl.pathname === "/delayed-stale") {
          body = `
            <html><body>
              <h1>Page not found</h1>
              <a href="https://synthetic.test/delayed-fallback">Get started here</a>
            </body></html>`;
        } else if (requestUrl.hostname === "synthetic.test" && requestUrl.pathname === "/delayed-fallback") {
          body = `
            <html><body>
              <h1>Loading registration options</h1>
              <script>
                setTimeout(() => {
                  const link = document.createElement("a");
                  link.href = "https://signup.synthetic.test/signup?step=delayed";
                  link.textContent = "Create your account";
                  document.body.appendChild(link);
                }, 700);
              </script>
            </body></html>`;
        } else if (requestUrl.hostname === "synthetic.test" && requestUrl.pathname === "/loop-a") {
          body = `<html><body><a href="https://synthetic.test/loop-b">Get started</a></body></html>`;
        } else if (requestUrl.hostname === "synthetic.test" && requestUrl.pathname === "/loop-b") {
          body = `<html><body><a href="https://synthetic.test/loop-a">Get started</a></body></html>`;
        }
        await route.fulfill({ status: 200, contentType: "text/html", body });
        return;
      }

      if (requestUrl.hostname === "html.duckduckgo.com") {
        await route.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
        return;
      }

      await route.continue();
    });

    const logs: string[] = [];
    const log = (message: string) => {
      logs.push(message);
      console.log(`  ${message}`);
    };

    await page.goto("https://synthetic.test/stale", { waitUntil: "domcontentloaded" });
    const positive = await discoverRegistrationPage(page, log);
    const positiveUrl = page.url();
    console.log("\n  POSITIVE RESULT:");
    console.log(`    isRegistrationPage: ${positive.isRegistrationPage}`);
    console.log(`    flow:               ${positive.flow}`);
    console.log(`    url:                ${positive.url}`);
    if (!positive.isRegistrationPage || positive.flow !== "REGISTER" || positiveUrl !== "https://signup.synthetic.test/signup?step=landing_page&next=1") {
      throw new Error(`Synthetic positive scenario failed: ${JSON.stringify({ positive, positiveUrl })}`);
    }

    logs.length = 0;
    await page.goto("https://synthetic.test/negative", { waitUntil: "domcontentloaded" });
    const negative = await discoverRegistrationPage(page, log);
    console.log("\n  NEGATIVE RESULT:");
    console.log(`    isRegistrationPage: ${negative.isRegistrationPage}`);
    console.log(`    flow:               ${negative.flow}`);
    console.log(`    url:                ${negative.url}`);
    if (negative.isRegistrationPage || negative.flow === "REGISTER") {
      throw new Error(`Synthetic negative scenario failed: ${JSON.stringify(negative)}`);
    }

    logs.length = 0;
    await page.goto("https://synthetic.test/delayed-stale", { waitUntil: "domcontentloaded" });
    const delayed = await discoverRegistrationPage(page, log);
    const delayedUrl = page.url();
    console.log("\n  DELAYED CTA RESULT:");
    console.log(`    isRegistrationPage: ${delayed.isRegistrationPage}`);
    console.log(`    flow:               ${delayed.flow}`);
    console.log(`    url:                ${delayed.url}`);
    if (!delayed.isRegistrationPage || delayed.flow !== "REGISTER" || delayedUrl !== "https://signup.synthetic.test/signup?step=delayed") {
      throw new Error(`Synthetic delayed CTA scenario failed: ${JSON.stringify({ delayed, delayedUrl })}`);
    }

    logs.length = 0;
    await page.goto("https://synthetic.test/loop-a", { waitUntil: "domcontentloaded" });
    const loop = await discoverRegistrationPage(page, log);
    const linkHops = logs.filter((message) => message.includes("STEP 2 link hop")).length;
    console.log("\n  LOOP RESULT:");
    console.log(`    isRegistrationPage: ${loop.isRegistrationPage}`);
    console.log(`    flow:               ${loop.flow}`);
    console.log(`    link hops:          ${linkHops}`);
    if (loop.isRegistrationPage || loop.flow === "REGISTER" || linkHops > 2) {
      throw new Error(`Synthetic loop scenario failed: ${JSON.stringify({ loop, linkHops })}`);
    }

    console.log("\n  SYNTHETIC REGRESSION: PASS");
  } finally {
    await context.close();
  }
}

async function runSyntheticHandoffScenario() {
  console.log(`\n${"=".repeat(70)}`);
  console.log("  Synthetic discovery → analyzer handoff regression");
  console.log(`${"=".repeat(70)}`);

  const context = await launchStealthContext({ profile: "discovery-handoff-synthetic", headless: false });
  try {
    const page = await context.newPage();
    await page.route("**/*", async (route) => {
      const requestUrl = new URL(route.request().url());
      console.log(`  [SYNTHETIC HANDOFF ROUTE] ${requestUrl.href}`);
      if (requestUrl.hostname === "synthetic.test" && requestUrl.pathname === "/") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `<html><body><h1>Directory homepage</h1><input type="search" name="query" placeholder="Search company"><a href="https://synthetic.test/register">Sign up</a></body></html>`,
        });
        return;
      }
      if (requestUrl.hostname === "synthetic.test" && /^\/register\/?$/.test(requestUrl.pathname)) {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `<html><body><h1>Create account</h1><form><label>Email <input id="email" type="email" name="email"></label><button>Create account</button></form></body></html>`,
        });
        return;
      }
      await route.continue();
    });

    await page.goto("https://synthetic.test/", { waitUntil: "domcontentloaded" });
    const discovery = await discoverRegistrationPage(page, (message) => console.log(`  ${message}`));
    const discoveryFinalUrl = discovery.url;
    const pageUrlBeforeAnalyzer = page.url();
    const form = await extractFormStructure(page);

    console.log(`  DISCOVERY FINAL URL: ${discoveryFinalUrl}`);
    console.log(`  PAGE URL BEFORE ANALYZER: ${pageUrlBeforeAnalyzer}`);
    console.log(`  ANALYZER FIELDS: ${form.fields.map((field) => field.selector).join(", ") || "none"}`);

    if (
      !discovery.isRegistrationPage ||
      discoveryFinalUrl !== "https://synthetic.test/register" ||
      pageUrlBeforeAnalyzer !== discoveryFinalUrl ||
      !form.fields.some((field) => field.selector === "#email")
    ) {
      throw new Error(`Synthetic handoff failed: ${JSON.stringify({ discovery, discoveryFinalUrl, pageUrlBeforeAnalyzer, form })}`);
    }
    console.log("  SYNTHETIC HANDOFF REGRESSION: PASS");
  } finally {
    await context.close();
  }
}

async function run(url: string): Promise<"PASS" | "EXTERNAL/UNAVAILABLE"> {
  const label = url.replace(/^https?:\/\//, "").slice(0, 60);
  const expectation = getLiveExpectation(url);
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  ${label}`);
  console.log(`${"=".repeat(70)}`);

  let ctx: Awaited<ReturnType<typeof launchStealthContext>> | null = null;
  try {
    ctx = await launchStealthContext({ profile: `discovery-test`, headless: false });
    const page = await ctx.newPage();

    const logs: string[] = [];
    const log = (m: string) => { logs.push(m); console.log(`  ${m}`); };

    console.log(`  Navigating...`);
    await stealthGoto(page, url, 60000);
    await page.waitForTimeout(3000);
    if (page.url().startsWith("chrome-error://")) {
      console.log("  EXTERNAL/UNAVAILABLE: browser navigation error");
      return "EXTERNAL/UNAVAILABLE";
    }

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
        console.log(`  EXTERNAL/UNAVAILABLE: Cloudflare not cleared`);
        return "EXTERNAL/UNAVAILABLE";
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

    if (expectation) {
      if (
        !result.isRegistrationPage ||
        result.flow !== expectation.expectedFlow ||
        !expectation.finalUrl.test(result.url)
      ) {
        throw new Error(
          `ASSERTION FAILED [${expectation.name}]: expected flow=${expectation.expectedFlow}, finalUrl~${expectation.finalUrl}, actual=${JSON.stringify(result)}`
        );
      }
      console.log(`    assertion:          PASS (${expectation.name}=${expectation.expectedFlow})`);
    }

    await page.waitForTimeout(1500);
    return "PASS";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith("ASSERTION FAILED")) throw err;
    console.log(`  FATAL: ${msg}`);
    console.log("  EXTERNAL/UNAVAILABLE: discovery run did not complete");
    return "EXTERNAL/UNAVAILABLE";
  } finally {
    if (ctx) {
      try { await ctx.close(); } catch {}
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const syntheticRequested = args.includes("--synthetic");
  const handoffRequested = args.includes("--handoff");
  if (syntheticRequested) {
    await runSyntheticScenarios();
  }
  if (handoffRequested) {
    await runSyntheticHandoffScenario();
  }
  const urls = args.filter((arg) => arg !== "--synthetic" && arg !== "--handoff");
  if (urls.length === 0) {
    if (syntheticRequested || handoffRequested) return;
    console.log("Usage: npx tsx scripts/test-registration-discovery.ts [--synthetic] [--handoff] <url> [url...]");
    return;
  }
  let unavailable = false;
  for (const u of urls) {
    const status = await run(u);
    if (status === "EXTERNAL/UNAVAILABLE") unavailable = true;
  }
  if (unavailable) process.exitCode = 2;
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
