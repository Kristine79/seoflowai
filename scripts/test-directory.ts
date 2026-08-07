import "dotenv/config";
import OpenAI from "openai";
import { runSubmission, closeBrowser } from "../src/lib/automation/submission-runner";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  timeout: 10000,
  maxRetries: 0,
});

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
  country: "United States",
  description: "ITllect is a technology consulting firm specializing in AI, cloud infrastructure, and digital transformation solutions for enterprise clients.",
  services: "AI Consulting, Cloud Infrastructure, Digital Transformation, Enterprise IT Solutions",
  keywords: "AI consulting, cloud infrastructure, digital transformation, technology consulting, enterprise IT",
  category: "Technology Consulting",
};

async function main() {
  const dir = process.argv[2];
  const url = process.argv[3];
  const mode = (process.argv[4] as "PREVIEW" | "SUBMIT") || "PREVIEW";

  if (!dir || !url) {
    console.log("Usage: npx tsx scripts/test-directory.ts <name> <url> [PREVIEW|SUBMIT]");
    process.exit(1);
  }

  console.log(`=== ${dir} ${mode} ===`);
  console.log(`URL: ${url}\n`);

  const logs: string[] = [];
  const logLine = (msg: string) => {
    logs.push(msg);
    console.log(`  ${msg}`);
  };

  const result = await runSubmission(url, COMPANY_DATA, openai, mode, null, logLine);

  console.log(`\n=== RESULT ===`);
  console.log(`Success: ${result.success}`);
  console.log(`Error: ${result.error || "—"}`);
  console.log(`Fields: ${result.formStructure?.fields?.length || 0}`);
  console.log(`Mapping: ${Object.keys(result.fieldMapping || {}).length} entries`);

  if (result.screenshot) {
    const ssPath = `${dir.toLowerCase()}-${mode.toLowerCase()}.png`;
    fs.writeFileSync(ssPath, Buffer.from(result.screenshot, "base64"));
    console.log(`Screenshot: ${ssPath}`);
  }

  fs.writeFileSync(`${dir.toLowerCase()}-${mode.toLowerCase()}.log`, logs.join("\n"), "utf-8");
  console.log(`Log: ${dir.toLowerCase()}-${mode.toLowerCase()}.log`);

  await closeBrowser();
  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err instanceof Error ? err.message : err);
  closeBrowser().catch(() => {});
  process.exit(1);
});