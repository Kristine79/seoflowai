import { aiChatCompletion } from "@/lib/automation/ai-client";
import type { AnalysisResult } from "./types";

export type AnalyzeOptions = {
  promptText: string;
  rawResponse: string;
  brand: string;
  website: string | null;
  products: string[];
  competitors: string[];
};

function officialDomain(website: string | null): string | null {
  if (!website) return null;
  try {
    return new URL(website.includes("://") ? website : `https://${website}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const ANALYSIS_SYSTEM = `You are an analyst that extracts structured facts from AI assistant responses.
Analyze the given AI response to a user question. Return ONLY valid JSON (no markdown) with this exact structure:

{
  "brandMentioned": true,
  "recommended": false,
  "recommendationPosition": 2,
  "competitors": [
    { "name": "CompetitorName", "mentioned": true, "recommended": false, "position": 1 }
  ],
  "products": ["product names mentioned"],
  "claims": [
    { "text": "claim statement from the response", "potentialIssue": false }
  ],
  "sources": [
    { "name": "source name or null", "domain": "example.com or null", "url": "https://... or null", "type": "official_site | review_platform | social | media | documentation | directory | comparison_article | forum | other", "official": false, "brandRelated": false, "competitorRelated": false }
  ],
  "citations": [
    { "title": "link title or null", "url": "https://... or null" }
  ],
  "intent": "what the user is looking for",
  "insight": "one sentence: how the brand is represented in this response"
}

RULES:
- brandMentioned: true only if the brand (or an obvious variant of it) is actually mentioned.
- recommended: true only if the response recommends or lists the brand as a good/valid option.
- recommendationPosition: the position (1-based) of the brand inside a list of recommended vendors, or null if not applicable.
- competitors: only entities that are actual competitor companies mentioned in the response. position = position in recommendation list, or null.
- claims: factual statements ABOUT the brand, its products or the market. potentialIssue = the claim looks wrong, outdated or unverifiable.
- sources: sources that appear to inform the response, only if the response actually references them (named, linked, or clearly quoted). If none are visible, return an empty array.
- citations: only links/URLs actually present in the response text. Never invent URLs.
- Write intent and insight in the same language as the response.
- Never invent facts that are not in the response.`;

function sanitizeJsonText(text: string): string {
  const trimmed = text.trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
}

export function normalizeAnalysis(raw: unknown, opts: AnalyzeOptions): AnalysisResult {
  const official = officialDomain(opts.website);
  const competitorNames = opts.competitors.filter(Boolean);

  const asRecord = (v: unknown): Record<string, unknown> =>
    v && typeof v === "object" ? (v as Record<string, unknown>) : {};

  const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
  const bool = (v: unknown): boolean => v === true || v === "true";

  const rec = asRecord(raw);
  const sourceMentions = Array.isArray(rec.sources)
    ? rec.sources.map((s) => asRecord(s)).filter((s) => Object.keys(s).length > 0)
    : [];

  const sources = sourceMentions.map((s) => {
    let domain = str(s.domain);
    const url = str(s.url);
    if (!domain && url) {
      try {
        domain = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        domain = null;
      }
    }
    const isOfficial = official
      ? domain === official || !!domain?.endsWith(`.${official}`)
      : false;
    return {
      name: str(s.name),
      domain,
      url,
      type: str(s.type) || "other",
      official: isOfficial || bool(s.official),
      brandRelated: bool(s.brandRelated) || isOfficial,
      competitorRelated: bool(s.competitorRelated),
    };
  });

  const citations = Array.isArray(rec.citations)
    ? rec.citations
        .map((c) => {
          const r = asRecord(c);
          const url = str(r.url);
          if (!url) return null;
          let domain: string | null = null;
          try {
            domain = new URL(url).hostname.replace(/^www\./, "");
          } catch {
            domain = null;
          }
          return { title: str(r.title), url, domain };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)
    : [];

  const competitors = Array.isArray(rec.competitors)
    ? rec.competitors
        .map((c) => {
          const r = asRecord(c);
          const name = str(r.name);
          if (!name) return null;
          return {
            name,
            mentioned: bool(r.mentioned),
            recommended: bool(r.recommended),
            position:
              typeof r.position === "number" && r.position > 0
                ? Math.round(r.position)
                : null,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)
    : [];

  const knownCompetitors = competitors.filter((c) =>
    competitorNames.some((n) => c.name.toLowerCase().includes(n.split(" ")[0].toLowerCase()))
  );

  const claims = Array.isArray(rec.claims)
    ? rec.claims
        .map((c) => {
          const r = asRecord(c);
          const text = str(r.text);
          if (!text) return null;
          return { text, potentialIssue: bool(r.potentialIssue) };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)
    : [];

  return {
    brandMentioned: bool(rec.brandMentioned),
    recommended: bool(rec.recommended),
    recommendationPosition:
      typeof rec.recommendationPosition === "number" && rec.recommendationPosition > 0
        ? Math.round(rec.recommendationPosition)
        : null,
    competitors: knownCompetitors,
    products: Array.isArray(rec.products)
      ? rec.products.map((p) => str(p)).filter((p): p is string => p !== null)
      : [],
    claims,
    sources,
    citations,
    intent: str(rec.intent),
    insight: str(rec.insight),
  };
}

/**
 * Анализирует raw-ответ: извлекает структурированные данные.
 * Возвращает null при ошибке провайдера или парсинга — raw-ответ сохраняется
 * независимо, анализ восстанавливается позже («переанализировать»).
 */
export async function analyzeResponse(opts: AnalyzeOptions): Promise<AnalysisResult | null> {
  try {
    const res = await aiChatCompletion(
      [
        { role: "system", content: ANALYSIS_SYSTEM },
        {
          role: "user",
          content: `BRAND: ${opts.brand}
WEBSITE: ${opts.website ?? "unknown"}
PRODUCTS: ${opts.products.join(", ") || "unknown"}
COMPETITORS: ${opts.competitors.join(", ") || "unknown"}

USER QUESTION:
${opts.promptText}

AI RESPONSE TO ANALYZE:
${opts.rawResponse}`,
        },
        { role: "user", content: "Return only the analysis JSON." },
      ],
      { response_format: { type: "json_object" } }
    );
    if (!res.content) return null;
    const parsed = JSON.parse(sanitizeJsonText(res.content));
    return normalizeAnalysis(parsed, opts);
  } catch (err) {
    console.error("[ai-search] analysis failed:", err);
    return null;
  }
}