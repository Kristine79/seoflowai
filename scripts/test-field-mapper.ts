/**
 * Safe Field Mapper regression harness.
 *
 * Uses synthetic FormField objects and a local mock OpenAI endpoint. It never
 * opens a real form, fills controls, submits, or sends company data externally.
 */

import http from "node:http";
import OpenAI from "openai";
import type { FormField } from "../src/lib/automation/form-analyzer";
import { mapFieldsWithAI } from "../src/lib/automation/field-mapper";

type TestField = FormField & {
  name?: string;
  id?: string;
  ariaLabel?: string;
  visible?: boolean;
  inViewport?: boolean;
  disabled?: boolean;
};

type MockMode = "valid" | "invalid" | "empty" | "error" | "timeout";

const COMPANY_DATA = {
  name: "ITllect",
  legalName: "ITllect Consulting Inc.",
  email: "info@itllect.com",
  website: "https://itllect.com",
  phone: "(123) 636-4087",
  description: "SEO and digital marketing consulting.",
  address: "123 Main St",
  city: "Anytown",
  state: "NY",
  zip: "10001",
  country: "US",
};

function field(input: Partial<TestField> & Pick<TestField, "selector" | "type">): TestField {
  return {
    label: "",
    placeholder: "",
    required: false,
    visible: true,
    inViewport: true,
    ...input,
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertMapping(mapping: Record<string, string>, expected: Record<string, string>) {
  assert(JSON.stringify(mapping) === JSON.stringify(expected), `mapping mismatch\nexpected=${JSON.stringify(expected)}\nactual=${JSON.stringify(mapping)}`);
}

async function withMockAi<T>(mode: MockMode, callback: (payloads: string[]) => Promise<T>): Promise<T> {
  const payloads: string[] = [];
  const server = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    request.on("end", () => {
      payloads.push(body);
      if (mode === "timeout") {
        response.writeHead(408, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: { message: "synthetic request timeout" } }));
        return;
      }
      if (mode === "error") {
        response.writeHead(500, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: { message: "synthetic provider failure" } }));
        return;
      }
      response.writeHead(200, { "content-type": "application/json" });
      const content = mode === "valid"
        ? JSON.stringify({ f0: COMPANY_DATA.description })
        : mode === "invalid"
          ? "not-json"
          : null;
      response.end(JSON.stringify({ choices: [{ message: { content } }] }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string", "mock AI server did not start");
  const previous = {
    key: process.env.OPENAI_API_KEY,
    base: process.env.OPENAI_BASE_URL,
    model: process.env.OPENAI_MODEL,
  };
  process.env.OPENAI_API_KEY = "synthetic-key";
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${address.port}/v1`;
  process.env.OPENAI_MODEL = "synthetic-model";
  try {
    return await callback(payloads);
  } finally {
    if (previous.key === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous.key;
    if (previous.base === undefined) delete process.env.OPENAI_BASE_URL;
    else process.env.OPENAI_BASE_URL = previous.base;
    if (previous.model === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = previous.model;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function map(fields: TestField[]) {
  return mapFieldsWithAI({} as OpenAI, COMPANY_DATA, fields);
}

async function runDeterministicCases() {
  assertMapping(await map([
    field({ selector: "#business", type: "text", label: "Business name" }),
    field({ selector: "#email", type: "email", label: "Email" }),
    field({ selector: "#website", type: "url", label: "Website" }),
    field({ selector: "#phone", type: "tel", label: "Phone" }),
    field({ selector: "#description", type: "textarea", label: "Description" }),
  ]), {
    "#business": COMPANY_DATA.name,
    "#email": COMPANY_DATA.email,
    "#website": COMPANY_DATA.website,
    "#phone": COMPANY_DATA.phone,
    "#description": COMPANY_DATA.description,
  });
  console.log("PASS: standard form");

  assertMapping(await map([
    field({ selector: "#company", type: "text", label: "Company Name" }),
    field({ selector: "#business", type: "text", label: "Business Name" }),
    field({ selector: "#organization", type: "text", label: "Organization" }),
    field({ selector: "#url", type: "url", label: "Website URL" }),
    field({ selector: "#phone", type: "tel", label: "Phone Number" }),
  ]), {
    "#company": COMPANY_DATA.name,
    "#business": COMPANY_DATA.name,
    "#organization": COMPANY_DATA.name,
    "#url": COMPANY_DATA.website,
    "#phone": COMPANY_DATA.phone,
  });
  console.log("PASS: synonym labels");

  assertMapping(await map([
    field({ selector: "#business-name", type: "text", label: "Business name" }),
    field({ selector: "#business-address", type: "text", label: "Business address" }),
    field({ selector: "#business-city", type: "text", label: "Business city" }),
    field({ selector: "#business-state", type: "text", label: "Business state" }),
    field({ selector: "#business-zip", type: "text", label: "Business zip code" }),
    field({ selector: "#business-country", type: "text", label: "Business country" }),
    field({ selector: "#organization-name", type: "text", label: "Organization name" }),
    field({ selector: "#organization-address", type: "text", label: "Organization address" }),
    field({ selector: "#business-email", type: "text", label: "Business email" }),
    field({ selector: "#business-website", type: "text", label: "Business website" }),
  ]), {
    "#business-name": COMPANY_DATA.name,
    "#business-address": COMPANY_DATA.address,
    "#business-city": COMPANY_DATA.city,
    "#business-state": COMPANY_DATA.state,
    "#business-zip": COMPANY_DATA.zip,
    "#business-country": "United States",
    "#organization-name": COMPANY_DATA.name,
    "#organization-address": COMPANY_DATA.address,
    "#business-email": COMPANY_DATA.email,
    "#business-website": COMPANY_DATA.website,
  });
  console.log("PASS: business/organization prefix does not capture non-name fields");

  assertMapping(await map([
    field({ selector: "#company_name", type: "text", name: "company_name" }),
    field({ selector: "#emailAddress", type: "email", ariaLabel: "Email address" }),
    field({ selector: "#companyWebsite", type: "url", id: "companyWebsite" }),
    field({ selector: "#phoneNumber", type: "tel", name: "phoneNumber" }),
  ]), {
    "#company_name": COMPANY_DATA.name,
    "#emailAddress": COMPANY_DATA.email,
    "#companyWebsite": COMPANY_DATA.website,
    "#phoneNumber": COMPANY_DATA.phone,
  });
  console.log("PASS: name/id/aria-label signals");

  assertMapping(await map([
    field({ selector: "#newsletter", type: "email", label: "Newsletter email", visible: false, inViewport: false }),
    field({ selector: "#registration-email", type: "email", label: "Email", required: true }),
  ]), { "#registration-email": COMPANY_DATA.email });
  console.log("PASS: hidden duplicate email");

  assertMapping(await map([
    field({ selector: "#search", type: "search", label: "Search" }),
    field({ selector: "#login-email", type: "email", label: "Login email" }),
    field({ selector: "#newsletter-email", type: "email", label: "Newsletter email" }),
    field({ selector: "#fax", type: "tel", label: "Fax number" }),
    field({ selector: "#cookie-email", type: "email", label: "Cookie email", visible: false, inViewport: false }),
    field({ selector: "#registration-email", type: "email", label: "Email", required: true }),
  ]), { "#registration-email": COMPANY_DATA.email });
  console.log("PASS: search/login/newsletter/cookie noise");

  const ambiguous = await map([
    field({ selector: "#company-name", type: "text", label: "Company name", required: true }),
    field({ selector: "#organization", type: "text", label: "Organization" }),
    field({ selector: "#social-website", type: "url", label: "LinkedIn website" }),
    field({ selector: "#website", type: "url", label: "Website", required: true }),
  ]);
  assert(ambiguous["#website"] === COMPANY_DATA.website, "strong website candidate was not mapped");
  assert(Object.keys(ambiguous).length < 4, "ambiguous candidates were all mapped without confidence");
  console.log("PASS: ambiguous candidates remain bounded");

  assertMapping(await map([
    field({ selector: "#signup-choose-category", type: "text", placeholder: "What service do you provide?" }),
  ]), {});
  console.log("PASS: SPA active-step input remains unmapped when no canonical data exists");
}

async function runAiCases() {
  const unknownField = [field({ selector: "#about", type: "textarea", label: "Tell us more" })];

  await withMockAi("valid", async (payloads) => {
    const mapping = await map(unknownField);
    assertMapping(mapping, { "#about": COMPANY_DATA.description });
    assert(payloads.length === 1, `expected one AI request, got ${payloads.length}`);
    assert(!payloads[0].includes("<form") && !payloads[0].includes("<html"), "AI payload contains raw DOM");
    assert(Buffer.byteLength(payloads[0], "utf8") < 5000, `AI payload is too large: ${Buffer.byteLength(payloads[0], "utf8")} bytes`);
    console.log(`PASS: AI valid response and compact payload (${Buffer.byteLength(payloads[0], "utf8")} bytes)`);
  });

  for (const mode of ["invalid", "empty", "error", "timeout"] as const) {
    await withMockAi(mode, async () => {
      const mapping = await map(unknownField);
      assertMapping(mapping, {});
      console.log(`PASS: AI ${mode} response fallback`);
    });
  }

  await withMockAi("valid", async (payloads) => {
    const mapping = await map([
      field({ selector: "#email", type: "email", label: "Email" }),
      field({ selector: "#about", type: "textarea", label: "Tell us more" }),
    ]);
    assert(mapping["#email"] === COMPANY_DATA.email, "AI replaced an obvious deterministic email mapping");
    const prompt = JSON.parse(payloads[0]).messages[0].content as string;
    const unmappedSection = prompt.split("UNMAPPED FORM FIELDS:")[1]?.split("ALREADY MAPPED")[0] || "";
    assert(!unmappedSection.includes("#email") && !unmappedSection.includes('label="Email"'), "obvious deterministic field was sent to AI");
    console.log("PASS: AI cannot override obvious deterministic email match");
  });
}

async function main() {
  await runDeterministicCases();
  await runAiCases();
  console.log("Field Mapper synthetic regression: PASS");
}

main().catch((error) => {
  console.error("Field Mapper regression: FAIL");
  console.error(error);
  process.exitCode = 1;
});
