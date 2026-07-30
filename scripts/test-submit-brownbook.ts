import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import pg from "pg";
import OpenAI from "openai";
import { runSubmission } from "../src/lib/automation/submission-runner";
import type { SubmissionMode, TemplateData } from "../src/lib/automation/submission-runner";
import fs from "fs";
import path from "path";

async function main() {
  const directoryId = process.argv[2] || "cms3phboh0009bsutz7uqe7b5";

  // DB setup
  const raw = process.env.DATABASE_URL || "";
  const urlObj = new URL(raw);
  urlObj.searchParams.delete("sslmode");
  const pool = new pg.Pool({ connectionString: urlObj.toString(), ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  // Load directory
  const directory = await prisma.directory.findUnique({
    where: { id: directoryId },
    include: { company: true, submissionTemplate: true },
  });

  if (!directory) throw new Error("Directory not found");
  if (!directory.company) throw new Error("No company");
  if (!directory.url) throw new Error("No URL");

  const c = directory.company;

  console.log("============================================");
  console.log("  SUBMIT TEST: FIRST REAL SUBMIT");
  console.log("============================================");
  console.log(`  Platform:    ${directory.platform}`);
  console.log(`  URL:         ${directory.url}`);
  console.log(`  Company:     ${c.name}`);
  console.log(`  Mode:        SUBMIT`);
  console.log("============================================\n");

  // Company data
  const companyData: Record<string, string> = {
    name: c.name || "",
    legalName: c.legalName || "",
    website: c.website || "",
    email: c.email || "",
    phone: c.phone || "",
    address: c.address || "",
    city: c.city || "",
    state: c.state || "",
    country: c.country || "",
    description: c.descriptionShort || c.descriptionMedium || "",
    services: c.services || "",
    keywords: c.keywords || "",
    category: c.category || "",
  };

  // Existing template
  const existingTemplate: TemplateData | null = directory.submissionTemplate
    ? {
        fieldMapping: directory.submissionTemplate.fieldMapping as Record<string, string>,
        formStructure: directory.submissionTemplate.formStructure as TemplateData["formStructure"],
        submitSelector: directory.submissionTemplate.submitSelector,
      }
    : null;

  if (existingTemplate) {
    console.log(`Existing template v${directory.submissionTemplate!.version}: ${Object.keys(existingTemplate.fieldMapping).length} fields mapped\n`);
  }

  // Run submission
  const logs: string[] = [];
  const logLine = (msg: string) => {
    logs.push(msg);
    console.log(`  ${msg}`);
  };

  console.log("--- Starting SUBMIT ---\n");
  const result = await runSubmission(
    directory.url,
    companyData,
    openai,
    "SUBMIT" as SubmissionMode,
    existingTemplate,
    logLine,
  );

  console.log("\n========================================");
  console.log("  SUBMIT RESULT");
  console.log("========================================");

  // Determine job status
  let jobStatus: string;
  let jobError: string | null = null;

  if (result.success) {
    jobStatus = "SUCCESS";
    console.log("  Status: ✅ SUCCESS");
  } else if (result.error?.includes("Требуется авторизация")) {
    jobStatus = "NEEDS_MANUAL";
    jobError = result.error;
    console.log("  Status: ⚠ NEEDS_MANUAL (login required)");
  } else if (result.error?.includes("captcha")) {
    jobStatus = "NEEDS_MANUAL";
    jobError = result.error;
    console.log("  Status: ⚠ NEEDS_MANUAL (captcha detected)");
  } else if (result.error?.includes("подтверждение email")) {
    jobStatus = "NEEDS_MANUAL";
    jobError = result.error;
    console.log("  Status: ⚠ NEEDS_MANUAL (email verification)");
  } else if (result.error?.includes("модерац") || result.error?.includes("moderation")) {
    jobStatus = "NEEDS_MANUAL";
    jobError = result.error;
    console.log("  Status: ⚠ NEEDS_MANUAL (moderation)");
  } else if (result.error?.includes("отправки")) {
    jobStatus = "NEEDS_MANUAL";
    jobError = result.error;
    console.log("  Status: ⚠ NEEDS_MANUAL (submit button not found)");
  } else {
    jobStatus = result.success ? "SUCCESS" : "FAILED";
    jobError = result.error || null;
    console.log(`  Status: ${result.success ? "✅ SUCCESS" : "❌ " + (result.error || "FAILED")}`);
  }

  console.log(`  Error:        ${result.error || "—"}`);

  // Save screenshots
  let screenshotBefore: string | null = null;
  let screenshotAfter: string | null = null;

  if (result.screenshot) {
    const ssPathBefore = path.resolve("brownbook-submit-before.png");
    fs.writeFileSync(ssPathBefore, Buffer.from(result.screenshot, "base64"));
    screenshotBefore = result.screenshot;
    console.log(`  Screenshot before: ${ssPathBefore} (${(result.screenshot.length / 1024).toFixed(0)} KB)`);
  }

  // Try to get after-submit screenshot if different
  // (runSubmission already captures final state)

  console.log(`  Submit button: ${result.submitSelector || "not checked"}`);
  console.log(`  Field map:     ${Object.keys(result.fieldMapping || {}).length} entries`);
  console.log(`  Fields found:  ${result.formStructure?.fields?.length || 0}`);
  console.log(`  Logs:          ${result.logs.length} lines`);
  console.log("========================================\n");

  // Save AutomationJob
  const job = await prisma.automationJob.create({
    data: {
      directoryId: directory.id,
      mode: "SUBMIT",
      status: jobStatus,
      screenshot: screenshotBefore,
      error: jobError,
      logs: JSON.stringify(result.logs),
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });
  console.log(`AutomationJob saved: ${job.id} (${job.status})\n`);

  // Save template if completed
  if (result.fieldMapping && result.formStructure) {
    await prisma.submissionTemplate.upsert({
      where: { directoryId: directory.id },
      create: {
        directoryId: directory.id,
        fieldMapping: result.fieldMapping,
        formStructure: result.formStructure,
        submitSelector: result.submitSelector || null,
        version: 1,
      },
      update: {
        fieldMapping: result.fieldMapping,
        formStructure: result.formStructure,
        submitSelector: result.submitSelector || null,
        version: { increment: 1 },
      },
    });
    console.log(`SubmissionTemplate saved/updated`);
  }

  console.log("\n========================================");
  console.log(`  ${result.success ? "✅ SUBMIT COMPLETE" : "❌ SUBMIT FAILED — " + (jobError || result.error || "unknown")}`);
  console.log("  Job status: " + jobStatus);
  console.log("========================================");

  await prisma.$disconnect();
  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.error("\n❌ FATAL:", err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack.slice(0, 500));
  process.exit(1);
});
