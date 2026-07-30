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

  // DB
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
  console.log("  TEST V2: AI SUBMISSION PREVIEW");
  console.log("  (multi-step + react-select + validation)");
  console.log("============================================");
  console.log(`  Platform:    ${directory.platform}`);
  console.log(`  URL:         ${directory.url}`);
  console.log(`  Company:     ${c.name}`);
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

  const result = await runSubmission(
    directory.url,
    companyData,
    openai,
    "PREVIEW" as SubmissionMode,
    existingTemplate,
    logLine,
  );

  console.log("\n========================================");
  console.log("  RESULT");
  console.log("========================================");
  console.log(`  Success:      ${result.success}`);
  console.log(`  Error:        ${result.error || "—"}`);
  console.log(`  Screenshot:   ${result.screenshot ? `${(result.screenshot.length / 1024).toFixed(0)} KB` : "none"}`);
  console.log(`  Field map:    ${Object.keys(result.fieldMapping || {}).length} entries`);
  console.log(`  Fields found: ${result.formStructure?.fields?.length || 0}`);
  console.log(`  Logs:         ${result.logs.length} lines`);
  console.log("========================================\n");

  // Save screenshot
  if (result.screenshot) {
    const ssPath = path.resolve("test-output-brownbook-v2.png");
    fs.writeFileSync(ssPath, Buffer.from(result.screenshot, "base64"));
    console.log(`Screenshot saved: ${ssPath}\n`);
  }

  // Save AutomationJob
  const job = await prisma.automationJob.create({
    data: {
      directoryId: directory.id,
      mode: "PREVIEW",
      status: result.success ? "SUCCESS" : "FAILED",
      screenshot: result.screenshot || null,
      error: result.error || null,
      logs: JSON.stringify(result.logs),
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });
  console.log(`AutomationJob saved: ${job.id} (${job.status})`);

  // Save template if preview success
  if (result.success && result.fieldMapping && result.formStructure) {
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
  console.log(`  ${result.success ? "✅ TEST COMPLETE" : "❌ TEST FAILED"}`);
  console.log("========================================");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("\n❌ FATAL:", err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack.slice(0, 500));
  process.exit(1);
});
