import { aiChatCompletion } from "@/lib/automation/ai-client";
import type {
  AuditConfig,
  EntityPositioning,
  PhraseStat,
  PositioningGap,
  PositioningKey,
  PositioningResult,
  ResponseLike,
} from "./types";

export const POSITIONING_KEYS: PositioningKey[] = [
  "brandDescriptions",
  "productAssociations",
  "categoryAssociations",
  "useCases",
  "valuePropositions",
  "differentiators",
  "recurringPhrases",
  "adjectives",
  "technicalTerms",
  "buyerCriteria",
];

export const POSITIONING_LABELS: Record<PositioningKey, string> = {
  brandDescriptions: "Описания бренда",
  productAssociations: "Продукты",
  categoryAssociations: "Категории",
  useCases: "Сценарии использования",
  valuePropositions: "Ценностные предложения",
  differentiators: "Отличия",
  recurringPhrases: "Повторяющиеся формулировки",
  adjectives: "Прилагательные",
  technicalTerms: "Технические термины",
  buyerCriteria: "Критерии покупателя",
};

const POSITIONING_SYSTEM = `You are an analyst extracting how an AI assistant describes a company and its market.
Analyze the given AI response. Extract ONLY statements actually present in the response text.
Return ONLY valid JSON (no markdown) with this exact structure:

{
  "brandDescriptions": ["short factual descriptions of the company as stated"],
  "productAssociations": ["product/solution names associated with the company"],
  "categoryAssociations": ["market/category names the company is placed in"],
  "useCases": ["use cases / scenarios mentioned for the company or its products"],
  "valuePropositions": ["value statements: benefits, guarantees, positioning claims"],
  "differentiators": ["distinctive features / what sets it apart"],
  "recurringPhrases": ["repeated descriptive phrases about the company"],
  "adjectives": ["adjectives used to describe the company or its products"],
  "technicalTerms": ["technical terms / standards / protocols mentioned"],
  "buyerCriteria": ["criteria/considerations a buyer should evaluate"]
}

RULES:
- Extract only what is present in the response text. Do not infer or add knowledge.
- Use the original language of the response.
- Keep phrases short (2-6 words), deduplicate.
- If a category has nothing present, return an empty array.`;

function sanitizeJsonText(text: string): string {
  const trimmed = text.trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
}

function strList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x.trim() : null))
    .filter((x): x is string => !!x)
    .filter((x, i, arr) => arr.indexOf(x) === i)
    .slice(0, 30);
}

export function normalizePositioning(raw: unknown): PositioningResult {
  const rec = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    brandDescriptions: strList(rec.brandDescriptions),
    productAssociations: strList(rec.productAssociations),
    categoryAssociations: strList(rec.categoryAssociations),
    useCases: strList(rec.useCases),
    valuePropositions: strList(rec.valuePropositions),
    differentiators: strList(rec.differentiators),
    recurringPhrases: strList(rec.recurringPhrases),
    adjectives: strList(rec.adjectives),
    technicalTerms: strList(rec.technicalTerms),
    buyerCriteria: strList(rec.buyerCriteria),
  };
}

export const EMPTY_POSITIONING: PositioningResult = {
  brandDescriptions: [],
  productAssociations: [],
  categoryAssociations: [],
  useCases: [],
  valuePropositions: [],
  differentiators: [],
  recurringPhrases: [],
  adjectives: [],
  technicalTerms: [],
  buyerCriteria: [],
};

/** LLM-извлечение positioning из raw-ответа. Ничего не добавляется от себя. */
export async function extractPositioning(opts: {
  promptText: string;
  rawResponse: string;
  brand: string;
}): Promise<PositioningResult | null> {
  try {
    const res = await aiChatCompletion(
      [
        { role: "system", content: POSITIONING_SYSTEM },
        {
          role: "user",
          content: `BRAND: ${opts.brand}

USER QUESTION:
${opts.promptText}

AI RESPONSE:
${opts.rawResponse}`,
        },
        { role: "user", content: "Return only the analysis JSON." },
      ],
      { response_format: { type: "json_object" } }
    );
    if (!res.content) return null;
    const parsed = JSON.parse(sanitizeJsonText(res.content));
    return normalizePositioning(parsed);
  } catch (err) {
    console.error("[ai-search] positioning extraction failed:", err);
    return null;
  }
}

/** Безопасное чтение сохранённого positioning JSON. */
export function parsePositioning(json: unknown): PositioningResult | null {
  if (!json || typeof json !== "object") return null;
  return normalizePositioning(json);
}

/**
 * Частотная агрегация фраз по набору ответов.
 * denominator: ответы, где сущность упомянута (для бренда — brandMentioned).
 */
export function aggregatePhrases(
  responses: { id: string; promptId: string; promptText: string | null; positioning: PositioningResult }[],
  key: PositioningKey,
  denominator: number
): PhraseStat[] {
  const map = new Map<string, { count: number; prompts: { promptId: string; promptText: string | null; responseId: string }[] }>();
  for (const r of responses) {
    for (const phrase of r.positioning[key] ?? []) {
      const lower = phrase.toLowerCase();
      const existing = map.get(lower) ?? { count: 0, prompts: [] };
      existing.count++;
      if (!existing.prompts.some((p) => p.responseId === r.id)) {
        existing.prompts.push({ promptId: r.promptId, promptText: r.promptText, responseId: r.id });
      }
      map.set(lower, existing);
    }
  }
  return Array.from(map.entries())
    .map(([phrase, v]) => ({
      phrase: v.prompts[0]?.promptText?.length ? phrase : phrase,
      count: v.count,
      percentage: denominator > 0 ? Math.round((v.count / denominator) * 1000) / 10 : null,
      prompts: v.prompts,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);
}

type PositioningRow = {
  id: string;
  promptId: string;
  promptText: string | null;
  brandMentioned: boolean;
  competitorNames: string[];
  positioning: PositioningResult;
};
export function brandPositioning(rows: PositioningRow[]): {
  entity: string;
  mentionCount: number;
  byKey: Partial<Record<PositioningKey, PhraseStat[]>>;
} {
  const brandRows = rows.filter((r) => r.brandMentioned && r.positioning);
  const byKey: Partial<Record<PositioningKey, PhraseStat[]>> = {};
  for (const key of POSITIONING_KEYS) {
    byKey[key] = aggregatePhrases(brandRows, key, brandRows.length);
  }
  return { entity: "brand", mentionCount: brandRows.length, byKey };
}

/** Positioning конкурента: ответы, где конкурент упомянут. */
export function competitorPositioning(
  rows: PositioningRow[],
  competitors: string[]
): EntityPositioning[] {
  return competitors
    .map((name) => {
      const key = name.split(" ")[0].toLowerCase();
      const compRows = rows.filter((r) =>
        r.competitorNames.some((c) => c.toLowerCase().includes(key))
      );
      const toTop = (k: PositioningKey): PhraseStat[] =>
        aggregatePhrases(compRows, k, compRows.length).slice(0, 8);
      return {
        entity: name,
        topDescriptions: toTop("brandDescriptions"),
        topProducts: toTop("productAssociations"),
        topUseCases: toTop("useCases"),
        topTechnical: toTop("technicalTerms"),
        topRecurring: toTop("recurringPhrases"),
        topBuyerCriteria: toTop("buyerCriteria"),
        mentions: compRows.length,
      };
    })
    .filter((e) => e.mentions > 0);
}

/**
 * Positioning gaps: ассоциации из конфигурации, не наблюдавшиеся в ответах.
 * Формулировка: «not observed in this prompt set» — не «AI не знает продукт».
 */
export function detectPositioningGaps(cfg: AuditConfig, rows: PositioningRow[]): PositioningGap[] {
  const gaps: PositioningGap[] = [];
  const all = rows.filter((r) => r.brandMentioned);
  const stats = (ids: string[], text: string) => ({
    promptIds: ids,
    responseIds: rows.filter((r) => r.positioning && r.brandMentioned).map((r) => r.id),
    stats: text,
  });
  const observed = (key: PositioningKey): string[] =>
    Array.from(new Set(all.flatMap((r) => (r.positioning[key] ?? []).map((p) => p.toLowerCase()))));

  const matches = (item: string, list: string[]): boolean => {
    const i = item.toLowerCase();
    return list.some((x) => x.includes(i.slice(0, Math.min(8, i.length))) || i.includes(x.slice(0, Math.min(8, x.length))));
  };

  if (all.length > 0) {
    for (const product of cfg.products) {
      if (!matches(product, observed("productAssociations"))) {
        gaps.push({
          type: "PRODUCT",
          item: product,
          severity: "MEDIUM",
          title: `Product association was not observed: «${product}»`,
          description: `Product association «${product}» was not observed in this prompt set (${all.length} responses with brand mentions).`,
          evidence: stats(all.map((r) => r.promptId), `${all.length} промптов, 0 упоминаний продукта`),
        });
      }
    }
    for (const uc of cfg.useCases) {
      if (!matches(uc, observed("useCases")) && !matches(uc, observed("categoryAssociations"))) {
        gaps.push({
          type: "USE_CASE",
          item: uc,
          severity: "MEDIUM",
          title: `Use case association was not observed: «${uc}»`,
          description: `Use case «${uc}» was not observed in this prompt set (${all.length} responses with brand mentions).`,
          evidence: stats(all.map((r) => r.promptId), `${all.length} промптов, 0 упоминаний сценария`),
        });
      }
    }
  }

  return gaps;
}
