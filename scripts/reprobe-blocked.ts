/**
 * RE-PROBE — re-check 14 BLOCKED platforms.
 *
 * Headed browser, no stealth/proxies.
 * One attempt per platform.
 */
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const QUEUE_FILE = path.resolve(process.cwd(), "human-queue.json");
const OUT_DIR = path.resolve(process.cwd(), "human-submit-out");

interface QueueEntry {
  name: string;
  url: string;
  submissionUrl: string;
  type: string;
  status: string;
  notes?: string;
  result?: string | null;
  history?: any[];
  [key: string]: any;
}

interface ReProbeResult {
  name: string;
  accessible: boolean;
  newStatus: string;
  notes: string;
  screenshot: string | null;
  evidence: string[];
}

const BLOCKED_PLATFORMS: { name: string; submissionUrl: string }[] = [
  { name: "Yellow Pages", submissionUrl: "https://www.yellowpages.com/biz" },
  { name: "Manta", submissionUrl: "https://www.manta.com/claim" },
  { name: "Hotfrog", submissionUrl: "https://www.hotfrog.com/add-business" },
  { name: "Superpages", submissionUrl: "https://www.superpages.com/add-listing" },
  { name: "EZlocal", submissionUrl: "https://www.ezlocal.com/business-directory/add-business" },
  { name: "Opendi", submissionUrl: "https://service.opendi.us/listings" },
  { name: "n49", submissionUrl: "https://www.n49.com/business/" },
  { name: "Agency Spotter", submissionUrl: "https://www.agencyspotter.com/add-agency" },
  { name: "The Manifest", submissionUrl: "https://www.clutch.co/get-listed" },
  { name: "Sortlist", submissionUrl: "https://www.sortlist.com/become-partner" },
  { name: "G2", submissionUrl: "https://www.g2.com/claim-listing" },
  { name: "ProvenExpert", submissionUrl: "https://www.provenexpert.com/en/business/" },
  { name: "South FL Biz Journal", submissionUrl: "https://www.bizjournals.com/southflorida/submit" },
  { name: "Stack Overflow", submissionUrl: "https://stackoverflow.com/users/signup" },
];

async function checkAccessibility(page: any, url: string, timeoutMs = 30000): Promise<{
  accessible: boolean;
  finalUrl: string;
  isCF: boolean;
  is403: boolean;
  is5xx: boolean;
  textLen: number;
  textSample: string;
}> {
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForTimeout(3000);
    const finalUrl = page.url();
    const text = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");
    const status = resp?.status() || 0;

    const isCF = text.includes("just a moment") || !!(await page.evaluate(() => document.querySelector("#cf-error-details")));
    const is403 = status === 403 || text.includes("403") || text.includes("access denied") || text.includes("you have been blocked");
    const is5xx = status >= 500 && status < 600;

    // If CF, wait a bit to see if it clears itself
    if (isCF) {
      await page.waitForTimeout(15000);
      const textAfter = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");
      const cfCleared = !(textAfter.includes("just a moment") || !!(await page.evaluate(() => document.querySelector("#cf-error-details"))));
      if (cfCleared) {
        return { accessible: true, finalUrl: page.url(), isCF: false, is403: false, is5xx: false, textLen: textAfter.length, textSample: textAfter.slice(0, 200) };
      }
    }

    return {
      accessible: !isCF && !is403 && !is5xx && status < 400,
      finalUrl,
      isCF,
      is403,
      is5xx,
      textLen: text.length,
      textSample: text.slice(0, 200),
    };
  } catch (e) {
    return {
      accessible: false,
      finalUrl: url,
      isCF: false,
      is403: false,
      is5xx: false,
      textLen: 0,
      textSample: `Error: ${(e as Error).message?.slice(0, 100)}`,
    };
  }
}

async function main() {
  console.log("\n=== RE-PROBE: 14 BLOCKED PLATFORMS ===\n");

  const results: ReProbeResult[] = [];
  const queue: QueueEntry[] = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  for (const platform of BLOCKED_PLATFORMS) {
    const entry = queue.find(q => q.name === platform.name);
    const slug = platform.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const shotDir = path.join(OUT_DIR, slug, "reprobe");
    fs.mkdirSync(shotDir, { recursive: true });

    console.log(`\n--- ${platform.name} ---`);
    console.log(`  submissionUrl: ${platform.submissionUrl}`);
    console.log(`  Previous notes: ${entry?.notes || "none"}`);

    let result: ReProbeResult;
    try {
      // Check accessibility
      const check = await checkAccessibility(page, platform.submissionUrl);
      let screenshotPath: string | null = null;
      try {
        screenshotPath = path.join(shotDir, `reprobe-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      } catch { /* browser may be closed */ }

      console.log(`  Final URL: ${check.finalUrl}`);
      console.log(`  Accessible: ${check.accessible}`);
      console.log(`  CF: ${check.isCF}, 403: ${check.is403}, 5xx: ${check.is5xx}`);
      console.log(`  Text length: ${check.textLen}`);

      const evidence: string[] = [
        `Accessed: ${check.finalUrl}`,
        `Accessible: ${check.accessible}`,
        `CF: ${check.isCF}, 403: ${check.is403}, 5xx: ${check.is5xx}`,
        `Text len: ${check.textLen}`,
      ];
      if (screenshotPath) evidence.push(`Screenshot: ${screenshotPath}`);

      let newStatus = "BLOCKED";
      let notes = "";

      if (!check.accessible) {
        if (check.isCF) {
          notes = "Still Cloudflare blocked after 15s wait";
        } else if (check.is403) {
          notes = "Still returning 403 / access denied";
        } else if (check.is5xx) {
          notes = "Still returning server error";
        } else {
          notes = "Still inaccessible";
        }
        console.log(`  ❌ ${notes}`);
      } else {
        // Site is accessible — check what we found
        const hasForm = check.textLen > 300 &&
          !check.textSample.includes("page not found") &&
          !check.textSample.includes("404") &&
          !check.textSample.includes("no results");

        if (hasForm) {
          newStatus = "FORM_READY";
          notes = "Site accessible, form detected — needs submission attempt";
          console.log(`  ✅ Accessible — form likely present (${check.textLen} bytes)`);
        } else if (check.textLen < 100) {
          newStatus = "NOT_APPLICABLE";
          notes = "Site accessible but no form content — likely not a directory";
          console.log(`  ⚠️  Accessible but no listing form (${check.textLen} bytes)`);
        } else {
          newStatus = "FORM_READY";
          notes = "Site accessible, needs manual check";
          console.log(`  ✅ Accessible (${check.textLen} bytes)`);
        }
      }

      // n49 special case
      if (platform.name === "n49" && check.accessible) {
        try {
          const bodyText = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");
          if (bodyText.includes("add your business") || bodyText.includes("add listing")) {
            newStatus = "FORM_READY";
            notes = "n49 accessible, add business form found";
          } else {
            newStatus = "NOT_APPLICABLE";
            notes = "n49 accessible but no business listing form — not a directory";
            console.log(`  ⚠️  n49 — NOT_APPLICABLE (no add business form)`);
          }
        } catch {
          notes = "n49 accessible but evaluation failed";
        }
      }

      result = { name: platform.name, accessible: check.accessible, newStatus, notes, screenshot: screenshotPath, evidence };
    } catch (e) {
      const errMsg = (e as Error).message?.slice(0, 150) || String(e).slice(0, 150);
      console.log(`  ❌ Error: ${errMsg}`);
      result = {
        name: platform.name,
        accessible: false,
        newStatus: "BLOCKED",
        notes: `Error during reprobe: ${errMsg}`,
        screenshot: null,
        evidence: [`Error: ${errMsg}`],
      };
    }
    results.push(result);

    // Update queue entry
    if (entry) {
      entry.history = entry.history || [];
      entry.history.push({
        date: new Date().toISOString(),
        action: "reprobe",
        outcome: result.newStatus,
        error: result.notes.includes("Still") || result.notes.includes("Error") ? result.notes : null,
        evidence: result.evidence,
      });
      if (result.newStatus !== "BLOCKED") {
        entry.status = result.newStatus;
        entry.notes = (entry.notes || "") + `; REPROBE ${new Date().toISOString().slice(0, 10)}: ${result.notes}`;
      }
    }

    // Re-create page if it was closed
    try {
      await page.evaluate(() => 1);
    } catch {
      console.log("  (re-opening closed page)");
      const newPage = await context.newPage();
      await page.close().catch(() => {});
    }
  }

  await browser.close();

  // Write updated queue
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

  // Summary
  console.log("\n=========================================");
  console.log("RE-PROBE SUMMARY");
  console.log("=========================================\n");
  console.log("Platform".padEnd(22) + " | Accessible | New Status | Notes");
  console.log("-".repeat(70));
  let stillBlocked = 0;
  let formReady = 0;
  let na = 0;
  for (const r of results) {
    const icon = r.accessible ? "✅" : "❌";
    console.log(`${icon} ${r.name.padEnd(20)} | ${String(r.accessible).padEnd(9)} | ${r.newStatus.padEnd(15)} | ${r.notes.slice(0, 50)}`);
    if (r.newStatus === "BLOCKED") stillBlocked++;
    if (r.newStatus === "FORM_READY") formReady++;
    if (r.newStatus === "NOT_APPLICABLE") na++;
  }
  console.log(`\nStill BLOCKED: ${stillBlocked}`);
  console.log(`Now FORM_READY (needs submission): ${formReady}`);
  console.log(`Now NOT_APPLICABLE: ${na}`);
  console.log("\nDone.");
}

main().catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});