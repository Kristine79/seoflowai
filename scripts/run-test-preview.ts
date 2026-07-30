import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import OpenAI from "openai";
import { runSubmission } from "../src/lib/automation/submission-runner";
import type { SubmissionMode, TemplateData } from "../src/lib/automation/submission-runner";

const url = new URL(process.env.DATABASE_URL || "");
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

async function main() {
  const directoryId = process.argv[2];
  if (!directoryId) {
    console.error("Usage: npx tsx scripts/run-test-preview.ts <directoryId>");
    process.exit(1);
  }

  const mode: SubmissionMode = "PREVIEW";
  console.log(`\n=== TEST PREVIEW RUN ===`);
  console.log(`Directory ID: ${directoryId}`);
  console.log(`Mode: ${mode}\n`);

  // 1. Load directory
  const directory = await prisma.directory.findUnique({
    where: { id: directoryId },
    include: { company: true, submission: true, generatedContent: true },
  });

  if (!directory) { console.error("Directory not found"); process.exit(1); }
  if (!directory.url) { console.error("No URL"); process.exit(1); }
  if (!directory.company) { console.error("No company"); process.exit(1); }

  console.log(`Platform: ${directory.platform}`);
  console.log(`URL: ${directory.url}`);
  console.log(`Company: ${directory.company.name}\n`);

  // 2. Build companyData
  const companyData: Record<string, string> = {
    name: directory.company.name || "",
    legalName: directory.company.legalName || "",
    website: directory.company.website || "",
    email: directory.company.email || "",
    phone: directory.company.phone || "",
    address: directory.company.address || "",
    city: directory.company.city || "",
    state: directory.company.state || "",
    country: directory.company.country || "",
    description: directory.company.descriptionShort || "",
    services: directory.company.services || "",
    keywords: directory.company.keywords || "",
    category: directory.company.category || "",
  };

  console.log("Company data keys with values:");
  for (const [k, v] of Object.entries(companyData)) {
    if (v) console.log(`  ${k}: "${v.slice(0, 60)}"`);
  }
  console.log("");

  // 3. Load existing template
  const existingTemplate: TemplateData | null = (() => {
    // Not using DB template lookup since this is a test script
    return null;
  })();

  // 4. Run submission
  const logs: string[] = [];
  const logLine = (msg: string) => {
    logs.push(msg);
    console.log(`  [LOG] ${msg}`);
  };

  console.log("Starting runSubmission...\n");
  const result = await runSubmission(
    directory.url,
    companyData,
    openai,
    mode,
    existingTemplate,
    logLine,
  );

  console.log(`\n=== RESULT ===`);
  console.log(`Success: ${result.success}`);
  console.log(`Error: ${result.error || "—"}`);
  console.log(`Screenshot: ${result.screenshot ? `${result.screenshot.length} chars (base64)` : "none"}`);
  console.log(`Field mapping entries: ${Object.keys(result.fieldMapping || {}).length}`);
  console.log(`Form structure fields: ${result.formStructure?.fields?.length || 0}`);
  console.log(`Submit selector: ${result.submitSelector || "—"}`);
  console.log(`Full logs count: ${logs.length} lines\n`);

  console.log("=== FULL LOGS ===");
  for (const line of result.logs) {
    console.log(`  ${line}`);
  }

  // 5. Save AutomationJob result
  const job = await prisma.automationJob.create({
    data: {
      directoryId,
      mode,
      status: result.success ? "SUCCESS" : "FAILED",
      screenshot: result.screenshot || null,
      error: result.error || null,
      logs: JSON.stringify(result.logs || logs),
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });
  console.log(`\nSaved AutomationJob: ${job.id} (${job.status})`);

  // 6. Save template if preview success
  if (result.success && result.fieldMapping && result.formStructure) {
    await prisma.submissionTemplate.upsert({
      where: { directoryId },
      create: {
        directoryId,
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
    console.log("Saved/updated SubmissionTemplate");
  }

  console.log("\n=== DONE ===");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("\nFATAL:", err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
