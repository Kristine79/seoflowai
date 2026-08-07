import "dotenv/config";
import { chromium } from "playwright";

const COMPANY = {
  name: "ITllect",
  website: "https://itllect.com",
  email: "info@itllect.com",
  phone: "(123) 636-4087",
  address: "100 N University Dr",
  city: "Coral Springs",
  state: "FL",
  zip: "33071",
  country: "United States",
};

// Classic business directories from client list
// For each, try multiple URL patterns to find the REAL add-business form
const DIRECTORIES = [
  { name: "CityLocalPro", base: "https://citylocalpro.com", paths: ["/add-your-business", "/add-business", "/submit-listing"] },
  { name: "TopSEOs", base: "https://www.topseos.com", paths: ["/best-companies/add", "/submit", "/add-company", "/register"] },
  { name: "DesignRush", base: "https://www.designrush.com", paths: ["/submit/agency", "/agency/submit", "/add-agency"] },
  { name: "Opendi", base: "https://www.opendi.us", paths: ["/add-business", "/addcompany", "/submit-listing", "/listings/add"] },
  { name: "Hotfrog", base: "https://www.hotfrog.com", paths: ["/add-business", "/add-company", "/submit-listing", "/add"] },
  { name: "MerchantCircle", base: "https://www.merchantcircle.com", paths: ["/add-business", "/add-listing", "/claim", "/signup"] },
  { name: "Local.com", base: "https://www.local.com", paths: ["/add-business", "/add-listing", "/business/add", "/claim"] },
  { name: "YellowPages", base: "https://www.yellowpages.com", paths: ["/add-business", "/add-listing", "/claim", "/business/add"] },
  { name: "Manta", base: "https://www.manta.com", paths: ["/add-business", "/add-company", "/claim", "/add-listing"] },
  { name: "Superpages", base: "https://www.superpages.com", paths: ["/add-business", "/add-listing", "/claim"] },
  { name: "EZlocal", base: "https://www.ezlocal.com", paths: ["/add-business", "/add-listing", "/claim", "/add-company"] },
  { name: "DataAxle", base: "https://www.data-axle.com", paths: ["/add-business", "/add-listing", "/claim", "/update-listing"] },
  { name: "ExpressUpdate", base: "https://www.expressupdate.com", paths: ["/add-business", "/add-listing", "/claim", "/update"] },
  { name: "NeustarLocaleze", base: "https://www.neustarlocaleze.com", paths: ["/add-business", "/add-listing", "/claim", "/register-business"] },
  { name: "Foursquare", base: "https://foursquare.com", paths: ["/add-business", "/add-place", "/claim", "/business/add"] },
];

type PathResult = {
  url: string;
  status: number;
  title: string;
  cloudflare: boolean;
  fieldCount: number;
  hasForm: boolean;
  isLogin: boolean;
  hasCaptcha: boolean;
  buttons: string[];
  error: string | null;
};

type DirResult = {
  name: string;
  bestPath: PathResult | null;
  allPaths: PathResult[];
  classification: "SUCCESS" | "NEEDS_MANUAL" | "FAILED" | "NOT_APPLICABLE" | "CLOUDFLARE";
  notes: string;
};

async function checkPath(page: import("playwright").Page, url: string): Promise<PathResult> {
  const result: PathResult = {
    url, status: 0, title: "", cloudflare: false,
    fieldCount: 0, hasForm: false, isLogin: false, hasCaptcha: false,
    buttons: [], error: null,
  };

  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    result.status = resp?.status() || 0;
    await page.waitForTimeout(2000);
    result.title = await page.title();

    const analysis = await page.evaluate(() => {
      const titleLower = (document.title || "").toLowerCase();
      const bodyText = (document.body?.innerText || "").toLowerCase();
      const html = document.documentElement.innerHTML.toLowerCase();

      // Cloudflare challenge
      const cfTitleMarkers = ["just a moment", "attention required", "cloudflare"];
      const hasCfTitle = cfTitleMarkers.some(m => titleLower.includes(m));
      const hasCfBody = bodyText.includes("performing security verification") ||
                        bodyText.includes("checking your browser");
      const hasCfRay = html.includes("cf-ray") || html.includes("_cf_chl_opt");
      const cloudflare = (hasCfTitle && hasCfBody) || (hasCfTitle && html.includes("cf-ray"));

      // Form fields
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
      const fieldCount = inputs.length;

      // Login detection
      const isLogin = bodyText.includes("sign in") || bodyText.includes("log in") ||
                      bodyText.includes("login") || bodyText.includes("password") &&
                      (bodyText.includes("username") || bodyText.includes("email"));

      // Captcha
      const hasCaptcha = !!document.querySelector(".g-recaptcha, .h-captcha, .cf-turnstile, [data-sitekey]");

      // Buttons
      const buttons = Array.from(document.querySelectorAll("button, a[role=button], input[type=submit]"))
        .map(b => (b.textContent || (b as HTMLInputElement).value || "").trim())
        .filter(t => t && t.length > 0 && t.length < 40)
        .slice(0, 8);

      // Has form (more than 3 inputs and not login-only)
      const hasForm = fieldCount > 3 && !cloudflare;

      return { cloudflare, fieldCount, isLogin, hasCaptcha, buttons, hasForm, bodyTextLen: bodyText.length };
    });

    Object.assign(result, analysis);
  } catch (err) {
    result.error = err instanceof Error ? err.message.slice(0, 100) : String(err);
  }

  return result;
}

function classify(name: string, best: PathResult | null, all: PathResult[]): DirResult["classification"] {
  if (!best) return "FAILED";
  if (best.cloudflare) return "CLOUDFLARE";
  if (best.error) return "FAILED";
  if (best.isLogin && best.fieldCount < 5) return "NEEDS_MANUAL";
  if (best.hasForm && best.fieldCount > 5) {
    if (best.hasCaptcha) return "NEEDS_MANUAL";
    return "SUCCESS"; // Potentially automatable
  }
  if (best.fieldCount > 0 && best.fieldCount <= 5) return "NEEDS_MANUAL";
  return "NOT_APPLICABLE";
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results: DirResult[] = [];

  for (const dir of DIRECTORIES) {
    console.log(`\n[${DIRECTORIES.indexOf(dir) + 1}/${DIRECTORIES.length}] ${dir.name} — ${dir.base}`);

    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const pathResults: PathResult[] = [];

    // First check homepage
    console.log(`  Checking homepage...`);
    pathResults.push(await checkPath(page, dir.base));

    // Then check each path
    for (const p of dir.paths) {
      const url = dir.base + p;
      console.log(`  Checking ${p}...`);
      const pr = await checkPath(page, url);
      pathResults.push(pr);
      if (pr.hasForm && pr.fieldCount > 5 && !pr.cloudflare) {
        console.log(`    ✅ FORM FOUND: ${pr.fieldCount} fields`);
        break; // Found a good form, stop checking
      }
    }

    await page.close();

    // Find best path: prefer ones with form, then ones with most fields, then non-cloudflare
    const goodPaths = pathResults.filter(p => p.hasForm && !p.cloudflare && !p.error);
    const bestPath = goodPaths.sort((a, b) => b.fieldCount - a.fieldCount)[0] ||
                     pathResults.find(p => !p.cloudflare && !p.error) ||
                     pathResults[0];

    const classification = classify(dir.name, bestPath, pathResults);
    const icon = classification === "SUCCESS" ? "✅" :
                 classification === "NEEDS_MANUAL" ? "🔶" :
                 classification === "CLOUDFLARE" ? "🛡️" :
                 classification === "NOT_APPLICABLE" ? "⚪" : "❌";

    let notes = "";
    if (bestPath) {
      if (bestPath.cloudflare) notes = "Cloudflare challenge";
      else if (bestPath.hasForm) notes = `${bestPath.fieldCount} fields, captcha=${bestPath.hasCaptcha}, login=${bestPath.isLogin}`;
      else if (bestPath.isLogin) notes = "Login page";
      else if (bestPath.error) notes = bestPath.error.slice(0, 60);
      else notes = `No form (${bestPath.fieldCount} fields)`;
    }

    console.log(`  ${icon} ${classification}: ${notes}`);
    if (bestPath) console.log(`  Best URL: ${bestPath.url} (status ${bestPath.status})`);

    results.push({ name: dir.name, bestPath, allPaths: pathResults, classification, notes });
  }

  await browser.close();

  // Summary
  console.log("\n\n==================================================");
  console.log("  SUMMARY");
  console.log("==================================================");
  const counts: Record<string, number> = {};
  for (const r of results) counts[r.classification] = (counts[r.classification] || 0) + 1;
  for (const [status, count] of Object.entries(counts)) {
    const icon = status === "SUCCESS" ? "✅" : status === "NEEDS_MANUAL" ? "🔶" : status === "CLOUDFLARE" ? "🛡️" : status === "NOT_APPLICABLE" ? "⚪" : "❌";
    console.log(`  ${icon} ${status}: ${count}`);
  }
  console.log("\n| Directory | Status | Fields | Best URL | Notes |");
  console.log("|-----------|--------|--------|----------|-------|");
  for (const r of results) {
    const icon = r.classification === "SUCCESS" ? "✅" : r.classification === "NEEDS_MANUAL" ? "🔶" : r.classification === "CLOUDFLARE" ? "🛡️" : r.classification === "NOT_APPLICABLE" ? "⚪" : "❌";
    const fields = r.bestPath?.fieldCount || 0;
    const url = r.bestPath?.url || "—";
    console.log(`| ${r.name} | ${icon} ${r.classification} | ${fields} | ${url} | ${r.notes} |`);
  }
  console.log("==================================================");
}

main().catch(console.error);
