/**
 * MONITOR — monitoring pass for SUBMITTED platforms.
 *
 * Checks each platform for public profile existence.
 * ONE pass only — no registration, no repeat submissions.
 *
 * Usage: npx tsx scripts/monitor-submitted.ts
 */
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const QUEUE_FILE = path.resolve(process.cwd(), "human-queue.json");
const OUT_DIR = path.resolve(process.cwd(), "human-submit-out");

interface MonitorResult {
  name: string;
  previousStatus: string;
  currentStatus: string;
  profileUrl: string | null;
  evidence: string[];
  verifiedAt: string;
  notes: string;
}

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

const TARGETS = [
  {
    name: "Brownbook",
    searchUrl: "https://www.brownbook.net/search/business/itllect",
    directUrls: ["https://www.brownbook.net/business/itllect-llc", "https://www.brownbook.net/business/itllect"],
  },
  {
    name: "CityLocalPro",
    searchUrl: "https://www.citylocalpro.com/search?q=itllect",
    directUrls: ["https://www.citylocalpro.com/biz/itllect", "https://www.citylocalpro.com/biz/itllect-llc", "https://www.citylocalpro.com/biz/itllect-agency"],
  },
  {
    name: "DesignRush",
    searchUrl: "https://www.designrush.com/search/agencies?q=itllect",
    directUrls: ["https://www.designrush.com/agency/itllect", "https://www.designrush.com/agency/itllect-llc"],
  },
  {
    name: "GoodFirms",
    searchUrl: "https://www.goodfirms.co/search?q=itllect",
    directUrls: ["https://www.goodfirms.co/company/itllect", "https://www.goodfirms.co/itllect-llc"],
  },
  {
    name: "Digital Agency Net",
    searchUrl: "https://digitalagencynetwork.com/search?q=itllect",
    directUrls: ["https://digitalagencynetwork.com/agency/itllect", "https://digitalagencynetwork.com/agency/itllect-llc"],
  },
  {
    name: "Plantation Chamber",
    searchUrl: "https://business.plantationchamber.org/listings",
    directUrls: ["https://business.plantationchamber.org/listings/itllect", "https://business.plantationchamber.org/members"],
  },
];

async function profileExists(page: any, urls: string[], searchUrl: string, platform: string): Promise<{ found: boolean; url: string | null; evidence: string[]; notes: string }> {
  const evidence: string[] = [];
  const notes: string[] = [];

  const slug = platform.toLowerCase().replace(/\s+/g, "-");
  const shotDir = path.join(OUT_DIR, slug);
  fs.mkdirSync(shotDir, { recursive: true });

  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(2000);
      const curUrl: string = page.url();
      const text: string = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");
      const title: string = await page.title();

      const isCF = text.includes("just a moment") || !!(await page.evaluate(() => document.querySelector("#cf-error-details")));
      if (isCF) { notes.push(`CF on ${curUrl}`); continue; }

      const is404 = text.includes("page not found") || text.includes("not found") || text.includes("404");
      const isLogin = /sign in|log in|login|input type="password"/i.test(text) || !!(await page.evaluate(() => document.querySelector('input[type="password"]')));
      const isSoft404 = text.length < 150 || text.includes("no results") || text.includes("search again");
      const hasItllect = /itllect/i.test(text) || /itllect/i.test(title);

      evidence.push(`Direct: ${url} -> ${curUrl} (len=${text.length}, itllect=${hasItllect}, 404=${is404}, soft404=${isSoft404}, login=${isLogin})`);

      if (hasItllect && !is404 && !isSoft404 && !isLogin) {
        const shot = path.join(shotDir, `monitor-profile-${Date.now()}.png`);
        await page.screenshot({ path: shot, fullPage: true });
        evidence.push(`Screenshot: ${shot}`);
        notes.push(`Profile found at ${curUrl}`);
        return { found: true, url: curUrl, evidence, notes: notes.join("; ") };
      }
    } catch (e) {
      notes.push(`Error on ${url}: ${(e as Error).message?.slice(0, 80)}`);
    }
  }

  // Try search
  try {
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(3000);
    const text: string = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");
    const curUrl: string = page.url();

    const isCF = text.includes("just a moment") || !!(await page.evaluate(() => document.querySelector("#cf-error-details")));
    if (!isCF) {
      const hasItllect = /itllect/i.test(text);
      const noResults = text.includes("no results") || text.includes("0 results") || text.includes("not found") || text.includes("no matching");
      evidence.push(`Search: ${searchUrl} -> ${curUrl} (len=${text.length}, itllect=${hasItllect}, noResults=${noResults})`);

      if (hasItllect && !noResults && !isCF) {
        // Check if there's an actual dedicated profile link (not search/referring page)
        const profileInfo = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a"));
          const profileLink = links.find(a =>
            /itllect/i.test(a.textContent || "") &&
            a.href &&
            !a.href.includes("javascript") &&
            !a.href.includes("search?q=") &&
            a.href !== window.location.href &&
            a.href !== document.baseURI
          );
          const h1 = document.querySelector("h1");
          const heading = h1 ? h1.textContent?.toLowerCase() || "" : "";
          return { profileUrl: profileLink ? profileLink.href : null, heading };
        });

        const hasDedicatedPage = profileInfo.profileUrl || /itllect/i.test(profileInfo.heading);

        if (hasDedicatedPage) {
          const shot = path.join(shotDir, `monitor-profile-${Date.now()}.png`);
          await page.screenshot({ path: shot, fullPage: true });
          evidence.push(`Screenshot: ${shot}`);
          notes.push(`Profile found: ${profileInfo.profileUrl || curUrl}`);
          return { found: true, url: profileInfo.profileUrl || curUrl, evidence, notes: notes.join("; ") };
        } else {
          const shot = path.join(shotDir, `monitor-search-results-${Date.now()}.png`);
          await page.screenshot({ path: shot, fullPage: true });
          evidence.push(`Screenshot: ${shot}`);
          notes.push("Search shows 'itllect' but no dedicated profile link — PENDING");
        }
      } else {
        notes.push("Search: no results");
      }
    } else {
      notes.push("CF on search");
    }
  } catch (e) {
    notes.push(`Search error: ${(e as Error).message?.slice(0, 80)}`);
  }

  return { found: false, url: null, evidence, notes: notes.join("; ") || "No profile found" };
}

async function main() {
  const queue: QueueEntry[] = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  const results: MonitorResult[] = [];
  let verifiedBefore = 0;

  console.log("\n=== MONITORING PASS: 6 SUBMITTED PLATFORMS ===\n");

  // Count initial VERIFIED_SUCCESS
  for (const q of queue) {
    if (q.status === "VERIFIED_SUCCESS") verifiedBefore++;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  for (const target of TARGETS) {
    const entry = queue.find((q: QueueEntry) => q.name === target.name);
    if (!entry) {
      console.log(`  ${target.name}: NOT in queue`);
      continue;
    }

    console.log(`\n--- ${target.name} ---`);
    console.log(`  Status: ${entry.status}`);

    const check = await profileExists(page, target.directUrls, target.searchUrl, target.name);
    const prevStatus = entry.status;
    let newStatus = prevStatus;

    if (check.found) {
      newStatus = "VERIFIED_SUCCESS";
      console.log(`  ✅ Profile found: ${check.url}`);
    } else {
      console.log(`  ⏳ Not found — keeping ${prevStatus}`);
    }

    for (const ev of check.evidence) {
      console.log(`  ${ev}`);
    }

    const mr: MonitorResult = {
      name: target.name,
      previousStatus: prevStatus,
      currentStatus: newStatus,
      profileUrl: check.url,
      evidence: check.evidence,
      verifiedAt: new Date().toISOString(),
      notes: check.notes,
    };
    results.push(mr);

    // Update queue
    entry.status = newStatus;
    if (!entry.history) entry.history = [];
    entry.history.push({
      date: mr.verifiedAt,
      action: "verify",
      outcome: newStatus === "VERIFIED_SUCCESS" ? "VERIFIED_SUCCESS" : "PENDING",
      error: newStatus === "VERIFIED_SUCCESS" ? null : "profile not yet published",
      evidence: check.evidence,
    });
    if (check.url && newStatus === "VERIFIED_SUCCESS") {
      entry.result = check.url;
    }
  }

  await browser.close();

  // Write updated queue
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  console.log("\nhuman-queue.json updated");

  // Summary
  console.log("\n====================================================");
  console.log("MONITORING SUMMARY");
  console.log("====================================================\n");
  console.log("Platform".padEnd(22) + " | Previous".padEnd(12) + " | Current".padEnd(18) + " | Profile URL");
  console.log("-".repeat(80));
  let verifiedCount = 0;
  let submittedCount = 0;
  for (const r of results) {
    const icon = r.currentStatus === "VERIFIED_SUCCESS" ? "✅" : "⏳";
    console.log(`${icon} ${r.name.padEnd(20)} | ${r.previousStatus.padEnd(10)} | ${r.currentStatus.padEnd(16)} | ${r.profileUrl || "—"}`);
    if (r.currentStatus === "VERIFIED_SUCCESS") verifiedCount++;
    if (r.currentStatus === "SUBMITTED") submittedCount++;
  }
  console.log("\nCounters:");
  console.log(`  VERIFIED_SUCCESS (total): ${verifiedBefore} -> ${verifiedBefore + verifiedCount}`);
  console.log(`  New VERIFIED_SUCCESS:     ${verifiedCount}`);
  console.log(`  Remaining SUBMITTED:      ${submittedCount}`);
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});