import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import pg from "pg";
import OpenAI from "openai";
import { writeFile } from "fs/promises";
import path from "path";
import { runSubmission } from "../lib/automation/submission-runner";
import type { SubmissionMode, TemplateData } from "../lib/automation/submission-runner";

const raw = process.env.DATABASE_URL || "";
const url = new URL(raw);
url.searchParams.delete("sslmode");

const pool = new pg.Pool({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

const POLL_INTERVAL_MS = 10_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadTemplate(directoryId: string): Promise<TemplateData | null> {
  const tpl = await prisma.submissionTemplate.findUnique({
    where: { directoryId },
  });
  if (!tpl) return null;
  return {
    fieldMapping: tpl.fieldMapping as Record<string, string>,
    formStructure: tpl.formStructure as TemplateData["formStructure"],
    submitSelector: tpl.submitSelector,
  };
}

async function saveTemplate(
  directoryId: string,
  template: TemplateData
): Promise<void> {
  const existing = await prisma.submissionTemplate.findUnique({
    where: { directoryId },
  });

  await prisma.submissionTemplate.upsert({
    where: { directoryId },
    create: {
      directoryId,
      fieldMapping: template.fieldMapping,
      formStructure: template.formStructure,
      submitSelector: template.submitSelector,
      version: 1,
    },
    update: {
      fieldMapping: template.fieldMapping,
      formStructure: template.formStructure,
      submitSelector: template.submitSelector,
      version: { increment: 1 },
    },
  });
}

async function processJob(jobId: string, directoryId: string, mode: SubmissionMode): Promise<void> {
  await prisma.automationJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  const directory = await prisma.directory.findUnique({
    where: { id: directoryId },
    include: { company: true, submission: true, generatedContent: true },
  });

  if (!directory) {
    await prisma.automationJob.update({
      where: { id: jobId },
      data: { status: "FAILED", error: "Directory not found", finishedAt: new Date() },
    });
    return;
  }

  const targetUrl = directory.url || "";

  if (!targetUrl) {
    await prisma.automationJob.update({
      where: { id: jobId },
      data: { status: "FAILED", error: "No URL to submit to", finishedAt: new Date() },
    });
    return;
  }

  const company = directory.company;
  const companyData: Record<string, string> = {
    name: company?.name || "",
    legalName: company?.legalName || "",
    website: company?.website || "",
    email: company?.email || "",
    phone: company?.phone || "",
    address: company?.address || "",
    city: company?.city || "",
    state: company?.state || "",
    country: company?.country || "",
    description: company?.descriptionShort || "",
    services: company?.services || "",
    keywords: company?.keywords || "",
    category: company?.category || "",
  };

  const existingTemplate = await loadTemplate(directoryId);

  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    console.log(`[job ${jobId.slice(0, 8)}] ${msg}`);
  };

  log(`Starting job ${jobId} for directory ${directoryId.slice(0, 8)}`);
  log(`Target URL: ${targetUrl}`);
  log(`Mode: ${mode}`);
  log(`Template: ${existingTemplate ? `v${existingTemplate.formStructure ? "exists" : "partial"}` : "none"}`);

  let result;
  try {
    result = await runSubmission(
      targetUrl,
      companyData,
      openai,
      mode,
      existingTemplate,
      log,
    );
  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack?.slice(0, 300) || ""}` : String(err);
    log(`CRITICAL: runSubmission threw an unhandled exception: ${msg}`);
    await prisma.automationJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: `Критическая ошибка: ${err instanceof Error ? err.message : String(err)}`,
        logs: JSON.stringify(logs),
        finishedAt: new Date(),
      },
    });
    return;
  }

  if (result.success && mode === "PREVIEW" && result.fieldMapping && result.formStructure) {
    await saveTemplate(directoryId, {
      fieldMapping: result.fieldMapping,
      formStructure: result.formStructure,
      submitSelector: result.submitSelector || null,
    });
  }

  const needsManualKeywords = [
    "captcha", "авторизация", "входа", "обязательное", "сопоставить",
    "отправки", "email", "почту", "подтверждение",
  ];
  const jobStatus = result.success
    ? "SUCCESS"
    : result.error && needsManualKeywords.some((kw) => result.error!.toLowerCase().includes(kw))
      ? "NEEDS_MANUAL"
      : "FAILED";

  const screenshotPath = path.resolve(`test-output-${directoryId.slice(0, 8)}.png`);
  if (result.screenshot) {
    try {
      await writeFile(screenshotPath, Buffer.from(result.screenshot, "base64"));
      log(`Screenshot saved: ${screenshotPath}`);
    } catch (e) {
      log(`Failed to save screenshot: ${e instanceof Error ? e.message : e}`);
    }
  }

  await prisma.automationJob.update({
    where: { id: jobId },
    data: {
      status: jobStatus,
      screenshot: result.screenshot || null,
      error: result.error || null,
      logs: JSON.stringify(result.logs),
      finishedAt: new Date(),
    },
  });
}

async function main(): Promise<void> {
  const runOnce = process.argv.includes("--once");
  console.log(`Submission agent started (${runOnce ? "one-shot" : "polling"})`);

  do {
    try {
      const jobs = await prisma.automationJob.findMany({
        where: { status: "PENDING" },
        take: 5,
        orderBy: { createdAt: "asc" },
      });

      for (const job of jobs) {
        const mode = (job.mode || "PREVIEW") as SubmissionMode;
        console.log(`Processing job ${job.id} for directory ${job.directoryId} (mode: ${mode})`);
        await processJob(job.id, job.directoryId, mode);
        console.log(`Job ${job.id} completed`);
      }
    } catch (err) {
      console.error("Agent error:", err instanceof Error ? err.message : err);
    }

    if (!runOnce) {
      await sleep(POLL_INTERVAL_MS);
    }
  } while (!runOnce);
}

main().catch((err) => {
  console.error("Fatal agent error:", err);
  process.exit(1);
});
