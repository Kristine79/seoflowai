import "dotenv/config";
import OpenAI from "openai";
import { runSubmission } from "../src/lib/automation/submission-runner";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

const COMPANY_DATA: Record<string, string> = {
  name: "ITllect",
  website: "https://itllect.com",
  email: "info@itllect.com",
  phone: "(123) 636-4087",
  address: "100 N University Dr",
  city: "Coral Springs",
  state: "FL",
  country: "US",
  description: "ITllect is a technology consulting firm specializing in AI and cloud infrastructure.",
  category: "Technology Consulting",
};

async function testOne(name: string, url: string) {
  console.log(`\n=== Testing ${name}: ${url} ===`);
  const logs: string[] = [];
  const logLine = (msg: string) => {
    logs.push(msg);
    console.log(`  ${msg}`);
  };

  try {
    const result = await runSubmission(url, COMPANY_DATA, openai, "PREVIEW", null, logLine);
    console.log(`\nResult: ${result.success ? "SUCCESS" : "FAILED"}`);
    console.log(`Error: ${result.error || "—"}`);
    console.log(`Fields: ${result.formStructure?.fields?.length || 0}`);
    console.log(`Mapping: ${Object.keys(result.fieldMapping || {}).length} entries`);

    if (result.screenshot) {
      const ssPath = `test-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`;
      fs.writeFileSync(ssPath, Buffer.from(result.screenshot, "base64"));
      console.log(`Screenshot: ${ssPath}`);
    }

    return { name, success: result.success, error: result.error, fields: result.formStructure?.fields?.length || 0 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`Exception: ${msg}`);
    return { name, success: false, error: msg, fields: 0 };
  }
}

async function main() {
  const dirs = [
    { name: "Brownbook", url: "https://www.brownbook.net/" },
    { name: "FindUsHere", url: "https://www.find-us-here.com/" },
    { name: "iGlobal", url: "https://www.iglobal.co/" },
  ];

  const results = [];
  for (const d of dirs) {
    results.push(await testOne(d.name, d.url));
  }

  console.log("\n\n=== SUMMARY ===");
  for (const r of results) {
    console.log(`${r.name}: ${r.success ? "✅" : "❌"} ${r.error || "OK"} (${r.fields} fields)`);
  }
}

main().catch(console.error);
