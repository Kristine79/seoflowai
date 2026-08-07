import "dotenv/config";
import OpenAI from "openai";
import { runSubmission } from "../src/lib/automation/submission-runner";
import { closeBrowser } from "../src/lib/automation/browser";
import type { SubmissionMode } from "../src/lib/automation/submission-runner";
import fs from "fs";
import path from "path";

const COMPANY_DATA: Record<string, string> = {
  name: "ITllect",
  legalName: "ITllect Consulting Inc.",
  website: "https://itllect.com",
  email: "info@itllect.com",
  phone: "(123) 636-4087",
  address: "100 N University Dr",
  city: "Coral Springs",
  state: "FL",
  zip: "33071",
  country: "US",
  description: "ITllect is a technology consulting firm specializing in AI, cloud infrastructure, and digital transformation solutions for enterprise clients.",
  services: "AI Consulting, Cloud Infrastructure, Digital Transformation, Enterprise IT Solutions",
  keywords: "AI consulting, cloud infrastructure, digital transformation, technology consulting, enterprise IT",
  category: "Technology Consulting",
};

// Diagnosed candidates with real Add Business forms (direct add-business URLs)
// Prioritize these first while the IP is clean. Client-priority follow after.
const DIRECTORIES = [
  // Previously working
  { name: "Brownbook", url: "https://www.brownbook.net/add-business" },
  { name: "Tupalo", url: "https://www.tupalo.com/en/api/v5/spot/new" },
  // Replacement candidates (classical directories, likely no Cloudflare)
  { name: "Yalwa", url: "https://www.yalwa.com/" },
  { name: "ShowMeLocal", url: "https://www.showmelocal.com/" },
  { name: "BizHwy", url: "https://www.bizhwy.com/" },
  { name: "YellowBot", url: "https://www.yellowbot.com/" },
  { name: "MojoPages", url: "https://www.mojopages.com/" },
  { name: "Naymz", url: "https://www.naymz.com/" },
  { name: "Hotfrog", url: "https://www.hotfrog.com/" },
  { name: "Cylex", url: "https://www.cylex.us.com/" },
];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  timeout: 10000,
  maxRetries: 0,
});

interface DirResult {
  name: string;
  url: string;
  success: boolean;
  status: "SUCCESS" | "NEEDS_MANUAL" | "FAILED";
  error: string | null;
  fieldCount: number;
  filledCount: number;
  duration: number;
  logs: string[];
  screenshotFile: string | null;
}

function classifyStatus(result: { success: boolean; error?: string }): "SUCCESS" | "NEEDS_MANUAL" | "FAILED" {
  if (result.success) return "SUCCESS";
  const err = (result.error || "").toLowerCase();
  if (
    err.includes("captcha") ||
    err.includes("авторизация") ||
    err.includes("login") ||
    err.includes("email") ||
    err.includes("модерац") ||
    err.includes("verification") ||
    err.includes("подтверд")
  ) {
    return "NEEDS_MANUAL";
  }
  return "FAILED";
}

async function main() {
  const modeArg = (process.argv[2] || "PREVIEW").toUpperCase() as SubmissionMode;
  const mode: SubmissionMode = modeArg === "SUBMIT" ? "SUBMIT" : "PREVIEW";
  const outputDir = path.resolve(mode === "SUBMIT" ? "business-submit" : "business-preview");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log("==================================================");
  console.log(`  BATCH ${mode}: BUSINESS DIRECTORIES`);
  console.log("  Company: ITllect");
  console.log(`  Directories: ${DIRECTORIES.length}`);
  console.log(`  Mode: ${mode}`);
  console.log("==================================================\n");

  const results: DirResult[] = [];

  for (let i = 0; i < DIRECTORIES.length; i++) {
    if (i > 0) {
      // Brief pause between directories to be gentle on sites and avoid rate limiting
      await new Promise((r) => setTimeout(r, 15000));
    }

    const dir = DIRECTORIES[i];
    console.log(`\n[${i + 1}/${DIRECTORIES.length}] ${dir.name} — ${dir.url}`);
    console.log("─".repeat(60));

    const startTime = Date.now();
    const logCapture: string[] = [];
    const logLine = (msg: string) => logCapture.push(msg);

    try {
      const result = await runSubmission(
        dir.url,
        COMPANY_DATA,
        openai,
        mode,
        null,
        logLine,
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const elapsed = parseFloat(duration);
      const status = classifyStatus(result);

      const screenshotFile = result.screenshot
        ? path.join(outputDir, `${dir.name.toLowerCase()}-${mode.toLowerCase()}.png`)
        : null;
      if (screenshotFile && result.screenshot) {
        fs.writeFileSync(screenshotFile, Buffer.from(result.screenshot, "base64"));
      }

      const filled = Object.values(result.fieldMapping || {}).filter(v => v && v.length > 0).length;
      const fieldsFound = result.formStructure?.fields?.length || 0;

      const dr: DirResult = {
        name: dir.name,
        url: dir.url,
        success: result.success,
        status,
        error: result.error || null,
        fieldCount: fieldsFound,
        filledCount: filled,
        duration: elapsed,
        logs: result.logs,
        screenshotFile,
      };
      results.push(dr);

      const icon = status === "SUCCESS" ? "✅" : status === "NEEDS_MANUAL" ? "🔶" : "❌";
      console.log(`  ${icon} ${status}`);
      console.log(`  Time: ${duration}s | Fields: ${fieldsFound} found, ${filled} filled`);
      if (result.error) console.log(`  Error: ${result.error}`);
      if (screenshotFile) console.log(`  Screenshot: ${screenshotFile}`);

      // Persist per-directory log for the client report
      fs.writeFileSync(
        path.join(outputDir, `${dir.name.toLowerCase()}-${mode.toLowerCase()}.log`),
        result.logs.join("\n"),
        "utf-8",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      results.push({
        name: dir.name,
        url: dir.url,
        success: false,
        status: "FAILED",
        error: `Script error: ${msg}`,
        fieldCount: 0,
        filledCount: 0,
        duration: parseFloat(elapsed),
        logs: logCapture,
        screenshotFile: null,
      });
      console.log(`  ❌ FAILED — ${msg}`);
    }
  }

  // ---- GENERATE REPORT ----
  const reportPath = path.join(outputDir, "report.md");
  const summary = results.map(r =>
    `| ${r.name} | ${r.url} | ${r.status === "SUCCESS" ? "✅ SUCCESS" : r.status === "NEEDS_MANUAL" ? "🔶 NEEDS_MANUAL" : "❌ FAILED"} | ${r.fieldCount} | ${r.filledCount} | ${r.duration}s | ${r.error || "—"} |`
  ).join("\n");

  const counts = { SUCCESS: 0, NEEDS_MANUAL: 0, FAILED: 0 };
  for (const r of results) counts[r.status]++;

  const report = `# Batch ${mode}: Business Directories

**Date:** ${new Date().toISOString().split("T")[0]}
**Company:** ITllect (https://itllect.com)
**Mode:** ${mode}
**Directories tested:** ${results.length}

## Summary

| Status | Count |
|--------|-------|
| ✅ SUCCESS | ${counts.SUCCESS} |
| 🔶 NEEDS_MANUAL | ${counts.NEEDS_MANUAL} |
| ❌ FAILED | ${counts.FAILED} |

## Results

| Directory | URL | Status | Fields Found | Fields Filled | Time | Error |
|-----------|-----|--------|-------------|--------------|------|-------|
${summary}

## Detailed Results

${results.map(r => `
### ${r.name}

- **URL:** ${r.url}
- **Status:** ${r.status === "SUCCESS" ? "✅ SUCCESS" : r.status === "NEEDS_MANUAL" ? "🔶 NEEDS_MANUAL" : "❌ FAILED"}
- **Time:** ${r.duration}s
- **Fields found:** ${r.fieldCount}
- **Fields filled:** ${r.filledCount}
- **Error:** ${r.error || "—"}
- **Screenshot:** ${r.screenshotFile ? `\`${r.screenshotFile}\`` : "—"}
- **Log file:** \`./${path.basename(outputDir)}/${r.name.toLowerCase()}-${mode.toLowerCase()}.log\`
`).join("\n")}
`;

  fs.writeFileSync(reportPath, report, "utf-8");
  console.log(`\n\nReport saved: ${reportPath}`);

  console.log("\n==================================================");
  console.log("  FINAL RESULTS");
  console.log("==================================================");
  console.log(`| ${"Directory".padEnd(15)} | Status           | Fields | Filled | Time    |`);
  console.log(`|${"─".repeat(17)}|${"─".repeat(18)}|${"─".repeat(8)}|${"─".repeat(8)}|${"─".repeat(8)}|`);
  for (const r of results) {
    const icon = r.status === "SUCCESS" ? "✅" : r.status === "NEEDS_MANUAL" ? "🔶" : "❌";
    console.log(`| ${r.name.padEnd(15)} | ${icon} ${r.status.padEnd(13)} | ${String(r.fieldCount).padEnd(6)} | ${String(r.filledCount).padEnd(6)} | ${r.duration}s |`);
  }
  console.log("==================================================");
  console.log(`\n✅ SUCCESS: ${counts.SUCCESS} | 🔶 NEEDS_MANUAL: ${counts.NEEDS_MANUAL} | ❌ FAILED: ${counts.FAILED}`);
  console.log(`Total: ${results.length}`);

  await closeBrowser();
}

main().catch((err) => {
  console.error("\nFATAL:", err instanceof Error ? err.message : err);
  closeBrowser().catch(() => {});
  process.exit(1);
});
