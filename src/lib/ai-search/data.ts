import type { AuditConfig, AnalysisResult, ResponseLike, StructuredCitation } from "./types";
import { parseAnalysis } from "./metrics";
import { parsePositioning } from "./positioning";
import { normalizeTextSource, type SourceContext } from "./sources";

type ResponseInput = {
  id: string;
  promptId: string;
  status: string;
  promptText: string | null;
  provider: string | null;
  model: string | null;
  rawResponse: string | null;
  completedAt: Date | null;
  analysis: unknown;
  positioning?: unknown;
  citations?: unknown;
  webSearchUsed?: boolean;
  runId?: string | null;
  category?: string | null;
  auditBrand?: string | null;
  auditWebsite?: string | null;
  auditCompetitors?: string | null;
};

export function toAuditConfig(a: {
  brand: string;
  website: string | null;
  description: string | null;
  categoryPhrase?: string | null;
  products: string | null;
  market: string | null;
  targetAudience: string | null;
  useCases?: string | null;
  problems?: string | null;
  competitors: string | null;
  promptLanguage?: string | null;
}): AuditConfig {
  return {
    brand: a.brand,
    website: a.website,
    description: a.description,
    categoryPhrase: a.categoryPhrase || null,
    products: parseList(a.products),
    market: a.market,
    targetAudience: a.targetAudience,
    useCases: parseList(a.useCases),
    problems: parseList(a.problems),
    competitors: parseList(a.competitors),
    promptLanguage: a.promptLanguage === "ru" ? "ru" : "en",
  };
}

function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s, i, arr) => arr.indexOf(s) === i);
}

export function toResponseLike(r: ResponseInput, category?: string | null, ctx?: SourceContext): ResponseLike {
  const analysis: AnalysisResult | null = parseAnalysis(r.analysis);
  const sourceCtx: SourceContext =
    ctx ?? {
      officialDomain: r.auditWebsite
        ? (() => {
            try {
              return new URL(r.auditWebsite.includes("://") ? r.auditWebsite : `https://${r.auditWebsite}`).hostname.replace(/^www\./, "");
            } catch {
              return null;
            }
          })()
        : null,
      competitorDomains: [],
      brand: r.auditBrand ?? "",
      competitors: r.auditCompetitors ? r.auditCompetitors.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean) : [],
    };

  // structured citations: из citations, реально возвращённых провайдером
  const structuredCitations: StructuredCitation[] = Array.isArray(r.citations)
    ? r.citations
        .map((c) => {
          const rec = c && typeof c === "object" ? (c as Record<string, unknown>) : {};
          const url = typeof rec.url === "string" ? rec.url : null;
          if (!url) return null;
          let domain: string | null = null;
          try {
            domain = new URL(url).hostname.replace(/^www\./, "");
          } catch {
            domain = null;
          }
          return {
            url,
            domain,
            title: typeof rec.title === "string" && rec.title.trim() ? rec.title.trim() : null,
            sourceType: typeof rec.sourceType === "string" ? rec.sourceType : null,
            citationText: typeof rec.citationText === "string" && rec.citationText.trim() ? rec.citationText.trim() : null,
          };
        })
        .filter((c): c is StructuredCitation => c !== null)
    : [];

  // text sources из analysis, нормализованные rule-based классификатором
  const textSources = (analysis?.sources ?? [])
    .map((s) => normalizeTextSource(s, sourceCtx))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return {
    id: r.id,
    promptId: r.promptId,
    status: r.status,
    promptText: r.promptText,
    category: r.category ?? category ?? null,
    brandMentioned: analysis?.brandMentioned ?? false,
    recommended: analysis?.recommended ?? false,
    recommendationPosition: analysis?.recommendationPosition ?? null,
    competitorNames: analysis?.competitors.map((c) => c.name) ?? [],
    products: analysis?.products ?? [],
    sourceDomains: textSources.map((s) => s.domain),
    officialSources: textSources.some((s) => s.isOfficial),
    brandRelatedSources: textSources.some((s) => s.isOfficial),
    competitorRelatedSources: textSources.some((s) => s.isCompetitor),
    citations: analysis?.citations ?? [],
    potentialIssues: analysis?.claims.filter((c) => c.potentialIssue) ?? [],
    provider: r.provider,
    model: r.model,
    rawResponse: r.rawResponse,
    completedAt: r.completedAt,
    runId: r.runId ?? null,
    webSearchUsed: r.webSearchUsed ?? false,
    structuredCitations,
    positioning: parsePositioning(r.positioning ?? null),
  };
}