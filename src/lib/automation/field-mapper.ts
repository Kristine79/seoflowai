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
  { patterns: [/business\s*name/i, /company\s*name/i, /^organization\b(\s*name)?\s*\*?$/i, /company\s*\*?$/i, /^business\b(\s*name)?\s*\*?$/i], dataKey: "name" },
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
const MIN_DETERMINISTIC_SCORE = 30;
const NOISE_PATTERN = /search|navigation|nav[-_ ]?search|filter|login|log[-_ ]?in|sign[-_ ]?in|newsletter|subscribe|marketing|cookie|consent|captcha|recaptcha|turnstile|hcaptcha/i;
const SOCIAL_PATTERN = /facebook|twitter|linkedin|instagram|youtube|tiktok|snapchat|x\.com/i;
const UNRELATED_PHONE_PATTERN = /fax|emergency|billing|support|alternate|secondary/i;

type FieldSignal = {
  value: string;
  weight: number;
};

function isFillableType(field: FormField): boolean {
  const t = (field.type || "").toLowerCase();
  return (
    !NON_FILLABLE_TYPES.has(t) &&
    t !== "search" &&
    field.visible !== false &&
    field.inViewport !== false &&
    field.disabled !== true
  );
}

function fieldSignals(field: FormField): FieldSignal[] {
  return [
    { value: field.label || "", weight: 100 },
    { value: field.ariaLabel || "", weight: 85 },
    { value: field.name || "", weight: 75 },
    { value: field.id || "", weight: 65 },
    { value: field.placeholder || "", weight: 50 },
    { value: field.autocomplete || "", weight: 40 },
  ].filter((signal) => signal.value.trim());
}

function fieldText(field: FormField): string {
  return fieldSignals(field).map((signal) => signal.value).join(" ");
}

function normalizeSignal(value: string): string {
  return value.replace(/[_-]+/g, " ");
}

function isNoiseField(field: FormField): boolean {
  return NOISE_PATTERN.test(fieldText(field)) || isUnrelatedPhoneField(field);
}

function isUnrelatedPhoneField(field: FormField): boolean {
  const type = (field.type || "").toLowerCase();
  return (type === "tel" || type === "phone") && UNRELATED_PHONE_PATTERN.test(fieldText(field));
}

function typeScore(field: FormField, dataKey: string): number {
  const type = (field.type || "").toLowerCase();
  if (dataKey === "email" && type === "email") return 35;
  if (dataKey === "phone" && (type === "tel" || type === "phone")) return 35;
  if (dataKey === "website" && (type === "url" || type === "uri")) return 30;
  if (dataKey === "description" && type === "textarea") return 15;
  return 0;
}

function scoreRule(field: FormField, rule: { patterns: RegExp[]; dataKey: string }): number {
  const text = fieldText(field);
  if (!text || isNoiseField(field)) return 0;

  let bestSignalScore = 0;
  for (const signal of fieldSignals(field)) {
    const normalizedSignal = normalizeSignal(signal.value);
    for (const pattern of rule.patterns) {
      if (pattern.test(normalizedSignal)) {
        bestSignalScore = Math.max(bestSignalScore, signal.weight);
      }
    }
  }

  // A social URL must never fall through to the generic website rule.
  if (rule.dataKey === "website" && SOCIAL_PATTERN.test(text)) return 0;
  if (SOCIAL_PATTERN.test(text) && rule.dataKey !== "facebook" && rule.dataKey !== "twitter" && rule.dataKey !== "linkedin" && rule.dataKey !== "instagram" && rule.dataKey !== "youtube" && rule.dataKey !== "tiktok") return 0;

  return bestSignalScore + typeScore(field, rule.dataKey);
}

function bestRule(field: FormField): { dataKey: string; score: number } | null {
  let best: { dataKey: string; score: number } | null = null;
  for (const rule of LABEL_RULES) {
    const score = scoreRule(field, rule);
    if (score > (best?.score || 0)) best = { dataKey: rule.dataKey, score };
  }
  return best && best.score >= MIN_DETERMINISTIC_SCORE ? best : null;
}

function ruleBasedMapping(
  companyData: Record<string, string>,
  formFields: FormField[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of formFields) {
    // Never assign text values to checkbox/radio/file/hidden controls.
    if (!isFillableType(field)) continue;
    const candidate = bestRule(field);
    if (!candidate) continue;
    const value = companyData[candidate.dataKey];
    if (!value) continue;

    // Transform values for select/combobox fields when the raw code differs
    // from the display text (e.g., "US" → "United States")
    let finalValue = value;
    if (candidate.dataKey === "country" && COUNTRY_NAMES[value.toUpperCase()]) {
      finalValue = COUNTRY_NAMES[value.toUpperCase()] as string;
    }
    mapping[field.selector] = finalValue;
  }
  return mapping;
}

export async function mapFieldsWithAI(
  openai: OpenAI,
  companyData: Record<string, string>,
  formFields: FormField[]
): Promise<Record<string, string>> {
  // Kept in the public signature for existing callers; provider selection is
  // centralized in ai-client.ts.
  void openai;

  // First try rule-based mapping
  const ruleMapping = ruleBasedMapping(companyData, formFields);

  // Fall back to AI for the remaining fields
  let remainingFields = formFields.filter(
    (f) => !ruleMapping[f.selector] && isFillableType(f) && !isNoiseField(f)
  );
  if (remainingFields.length === 0) return ruleMapping;

  // Don't ask AI about social/vanity fields when company has no data for them
  // (prevents AI from hallucinating website URL into Twitter/Facebook etc.)
  const strictSocialPatterns: { re: RegExp; key: string }[] = [
    { re: /facebook/i, key: "facebook" }, { re: /twitter|x\.com/i, key: "twitter" },
    { re: /linkedin/i, key: "linkedin" }, { re: /instagram/i, key: "instagram" },
    { re: /youtube/i, key: "youtube" }, { re: /blog/i, key: "blog" },
    { re: /tiktok/i, key: "tiktok" }, { re: /video/i, key: "video" },
    { re: /snapchat/i, key: "snapchat" },
  ];
  remainingFields = remainingFields.filter((f) => {
    const text = fieldText(f);
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
          const match = /^f(\d+)$/.exec(key);
          const idx = match ? Number(match[1]) : NaN;
          if (!isNaN(idx) && remainingFields[idx] && typeof value === "string" && value.trim()) {
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
