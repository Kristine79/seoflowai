import OpenAI from "openai";
import type { FormField } from "./form-analyzer";
import { aiChatCompletion } from "./ai-client";

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  UK: "United Kingdom",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  JP: "Japan",
  CN: "China",
  IN: "India",
  BR: "Brazil",
  MX: "Mexico",
  RU: "Russia",
  IL: "Israel",
  SG: "Singapore",
  HK: "Hong Kong",
  KR: "South Korea",
  NZ: "New Zealand",
  IE: "Ireland",
  PT: "Portugal",
  PL: "Poland",
  CZ: "Czech Republic",
  HU: "Hungary",
  RO: "Romania",
  GR: "Greece",
  TR: "Turkey",
  AE: "United Arab Emirates",
  ZA: "South Africa",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  MY: "Malaysia",
  TH: "Thailand",
  VN: "Vietnam",
  PH: "Philippines",
  ID: "Indonesia",
};

const LABEL_RULES: { patterns: RegExp[]; dataKey: string }[] = [
  { patterns: [/business\s*name/i, /company\s*name/i, /organization/i, /company\s*\*?$/i, /^business/i], dataKey: "name" },
  { patterns: [/legal\s*name/i, /legal/i], dataKey: "legalName" },
  { patterns: [/email/i, /e-?mail/i], dataKey: "email" },
  { patterns: [/phone/i, /telephone/i, /mobile/i, /cell/i, /contact\s*number/i, /fax/i], dataKey: "phone" },
  { patterns: [/website/i, /url/i, /web\s*site/i, /homepage/i, /display\s*website/i], dataKey: "website" },
  { patterns: [/address/i, /street/i, /location/i], dataKey: "address" },
  { patterns: [/city/i, /town/i], dataKey: "city" },
  { patterns: [/state/i, /province/i, /region/i], dataKey: "state" },
  { patterns: [/zip/i, /postal/i, /post\s*code/i], dataKey: "zip" },
  { patterns: [/country/i], dataKey: "country" },
  { patterns: [/first\s*name/i, /fname/i], dataKey: "firstName" },
  { patterns: [/last\s*name/i, /lname/i], dataKey: "lastName" },
  { patterns: [/job\s*title/i, /position/i, /your\s*title/i, /role/i], dataKey: "position" },
  { patterns: [/description/i, /about/i, /bio/i, /summary/i, /details/i, /intro/i], dataKey: "description" },
  { patterns: [/category/i, /industry/i, /sector/i], dataKey: "category" },
  { patterns: [/keyword/i, /tag/i, /service/i], dataKey: "keywords" },
  { patterns: [/facebook/i, /fb/i], dataKey: "facebook" },
  { patterns: [/twitter/i, /x\.com/i], dataKey: "twitter" },
  { patterns: [/linkedin/i], dataKey: "linkedin" },
  { patterns: [/instagram/i], dataKey: "instagram" },
  { patterns: [/youtube/i], dataKey: "youtube" },
  { patterns: [/blog/i], dataKey: "blog" },
  { patterns: [/tiktok/i], dataKey: "tiktok" },
  { patterns: [/video/i], dataKey: "video" },
];

const NON_FILLABLE_TYPES = new Set(["checkbox", "radio", "file", "hidden", "button", "submit", "image", "reset"]);

function isFillableType(field: FormField): boolean {
  const t = (field.type || "").toLowerCase();
  return !NON_FILLABLE_TYPES.has(t);
}

function ruleBasedMapping(
  companyData: Record<string, string>,
  formFields: FormField[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of formFields) {
    // Never assign text values to checkbox/radio/file/hidden controls.
    if (!isFillableType(field)) continue;
    const text = `${field.label} ${field.placeholder}`;
    for (const rule of LABEL_RULES) {
      if (rule.patterns.some((p) => p.test(text))) {
        const value = companyData[rule.dataKey];
        if (value) {
          // Transform values for select/combobox fields when the raw code differs
          // from the display text (e.g., "US" → "United States")
          let finalValue = value;
          if (rule.dataKey === "country" && COUNTRY_NAMES[value.toUpperCase()]) {
            finalValue = COUNTRY_NAMES[value.toUpperCase()] as string;
          }
          mapping[field.selector] = finalValue;
          break;
        }
      }
    }
  }
  return mapping;
}

export async function mapFieldsWithAI(
  openai: OpenAI,
  companyData: Record<string, string>,
  formFields: FormField[]
): Promise<Record<string, string>> {
  // First try rule-based mapping
  const ruleMapping = ruleBasedMapping(companyData, formFields);
  const ruleFilled = Object.keys(ruleMapping).length;

  // If rule-based mapping found all fields, use it directly (no AI needed)
  if (ruleFilled >= formFields.length - 1) {
    return ruleMapping;
  }

  // Fall back to AI for the remaining fields
  let remainingFields = formFields.filter((f) => !ruleMapping[f.selector] && isFillableType(f));
  if (remainingFields.length === 0) return ruleMapping;

  // Don't ask AI about social/vanity fields when company has no data for them
  // (prevents AI from hallucinating website URL into Twitter/Facebook etc.)
  const strictSocialPatterns: { re: RegExp; key: string }[] = [
    { re: /facebook/i, key: "facebook" },
    { re: /twitter/i, key: "twitter" },
    { re: /x\.com/i, key: "twitter" },
    { re: /linkedin/i, key: "linkedin" },
    { re: /instagram/i, key: "instagram" },
    { re: /youtube/i, key: "youtube" },
    { re: /blog/i, key: "blog" },
    { re: /tiktok/i, key: "tiktok" },
    { re: /video/i, key: "video" },
    { re: /snapchat/i, key: "snapchat" },
  ];
  remainingFields = remainingFields.filter((f) => {
    const text = `${f.label} ${f.placeholder}`;
    for (const sp of strictSocialPatterns) {
      if (sp.re.test(text) && !companyData[sp.key]) return false;
    }
    return true;
  });

  // Use index keys for AI to prevent hallucinated selectors
  const fieldKeys = remainingFields.map((_, i) => `f${i}`);
  const fieldDescriptions = remainingFields
    .map((f, i) => `${i + 1}. key="${fieldKeys[i]}" label="${f.label}" placeholder="${f.placeholder}" type="${f.type}" required=${f.required}`)
    .join("\n");

  const companyInfo = Object.entries(companyData)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const prompt = `You are a form-filling assistant. Map company data fields to remaining form fields.

COMPANY DATA:
${companyInfo}

UNMAPPED FORM FIELDS:
${fieldDescriptions}

ALREADY MAPPED (for context):
${Object.entries(ruleMapping).map(([k, v]) => `${k}=${v}`).join("\n")}

For each unmapped field (by key), provide the value to fill. Respond with a JSON object where keys are the field keys (like "f0", "f1") and values are the text to enter. Skip submit buttons, checkboxes, radio buttons, file uploads, and non-input fields. Use empty string for fields you cannot map.`;

  const messages = [{ role: "user", content: prompt }];

  try {
    const { content } = await aiChatCompletion(messages, { response_format: { type: "json_object" } });
    if (content) {
      try {
        const aiKeyMapping = JSON.parse(content) as Record<string, string>;
        // Map index-based AI keys back to real selectors
        const aiMapping: Record<string, string> = {};
        for (const [key, value] of Object.entries(aiKeyMapping)) {
          const idx = parseInt(key.replace("f", ""), 10);
          if (!isNaN(idx) && remainingFields[idx]) {
            aiMapping[remainingFields[idx].selector] = value;
          }
        }
        return { ...aiMapping, ...ruleMapping };
      } catch {
        // AI response not parseable — use rule mapping only
      }
    }
  } catch {
    // All AI providers unavailable — use rule mapping only
  }

  return ruleMapping;
}
