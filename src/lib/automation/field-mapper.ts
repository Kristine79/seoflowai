import OpenAI from "openai";
import type { FormField } from "./form-analyzer";

export async function mapFieldsWithAI(
  openai: OpenAI,
  companyData: Record<string, string>,
  formFields: FormField[]
): Promise<Record<string, string>> {
  const fieldDescriptions = formFields
    .map((f, i) => `${i + 1}. selector="${f.selector}" label="${f.label}" placeholder="${f.placeholder}" type="${f.type}" required=${f.required}`)
    .join("\n");

  const companyInfo = Object.entries(companyData)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const prompt = `You are a form-filling assistant. Map company data fields to form fields.

COMPANY DATA:
${companyInfo}

FORM FIELDS:
${fieldDescriptions}

For each form field (by selector), provide the value to fill. Respond with a JSON object where keys are CSS selectors and values are the text to enter. Skip submit buttons, checkboxes, and non-input fields. Use empty string for fields you cannot map.`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return {};

  try {
    return JSON.parse(content) as Record<string, string>;
  } catch {
    return {};
  }
}
