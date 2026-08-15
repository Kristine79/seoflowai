import type { SourceType } from "./sources";
import type {
  AiSearchMetrics,
  AnalysisResult,
  CategoryStat,
  SourceStat,
  SourceTypeCounts,
  StructuredCitation,
} from "./types";

export type MetricsInput = {
  id: string;
  promptId: string;
  status: string;
  promptText: string | null;
  category: string | null;
  provider: string | null;
  model: string | null;
  rawResponse: string | null;
  completedAt: Date | null;
  analysis: AnalysisResult | null;
  structuredCitations?: StructuredCitation[];
};

function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/**
 * Диагностические метрики AI Search. Вычисляются детерминированно из
 * сохранённых analysis. Если данных нет — null («Not enough data» в UI).
 */
export function computeMetrics(inputs: MetricsInput[]): AiSearchMetrics {
  const executed = inputs.filter((r) => r.status === "SUCCESS" || r.status === "FAILED");
  const success = inputs.filter((r) => r.status === "SUCCESS" && r.analysis);

  const providers = Array.from(
    new Set(inputs.map((r) => (r.provider ? `${r.provider} (${r.model ?? "?"})` : "")).filter(Boolean))
  );

  const mentioned = success.filter((r) => r.analysis!.brandMentioned);
  const recommended = success.filter((r) => r.analysis!.recommended);
  const top3 = success.filter(
    (r) =>
      r.analysis!.recommended &&
      r.analysis!.recommendationPosition !== null &&
      r.analysis!.recommendationPosition! <= 3
  );
  const withCompetitor = success.filter((r) => r.analysis!.competitors.length > 0);
  const competitorOnly = success.filter(
    (r) => r.analysis!.competitors.length > 0 && !r.analysis!.brandMentioned
  );

  const potentialIssues = success.flatMap((r) =>
    r.analysis!.claims
      .filter((c) => c.potentialIssue)
      .map((c) => ({ claim: c.text, promptId: r.promptId, responseId: r.id }))
  );

  // источники: все упоминания (instance-level), агрегация по доменам
  const domainAgg = new Map<string, SourceStat>();
  const typeCounts: SourceTypeCounts = {
    official: 0,
    competitor: 0,
    industry: 0,
    documentation: 0,
    review: 0,
    community: 0,
    media: 0,
    other: 0,
  };
  let officialMentions = 0;
  let totalSourceMentions = 0;
  let sourceDetectedResponses = 0;
  for (const r of success) {
    const normalized = mergeSources(r);
    if (normalized.length > 0) sourceDetectedResponses++;
    for (const s of normalized) {
      const key = s.domain || "unknown";
      if (key === "null" || key === "undefined") continue;
      totalSourceMentions++;
      if (s.isOfficial) officialMentions++;
      typeCounts[s.sourceType] = (typeCounts[s.sourceType] ?? 0) + 1;
      const agg = domainAgg.get(key) || {
        domain: key,
        count: 0,
        official: false,
        brandRelated: false,
        competitorRelated: false,
      };
      agg.count++;
      agg.official = agg.official || s.isOfficial;
      agg.brandRelated = agg.brandRelated || s.isOfficial;
      agg.competitorRelated = agg.competitorRelated || s.isCompetitor;
      domainAgg.set(key, agg);
    }
  }
  const sourceCoverage = Array.from(domainAgg.values()).sort((a, b) => b.count - a.count);

  // Source data availability: провайдер вернул citations ИЛИ в текстах есть источники
  const sourceDataAvailable = sourceDetectedResponses > 0 || inputs.some((r) => (r.rawResponse ?? "").match(/https?:\/\/[^\s]+/));

  // официальные источники: только если source data вообще доступна
  const officialSourceRate =
    totalSourceMentions > 0 ? Math.round((officialMentions / totalSourceMentions) * 1000) / 10 : null;

  // по категориям
  const byCategory: Record<string, CategoryStat> = {};
  const byCat = (cat: string): CategoryStat => {
    if (!byCategory[cat]) byCategory[cat] = { total: 0, success: 0, mentioned: 0, recommended: 0, mentionRate: null };
    return byCategory[cat];
  };
  for (const r of inputs) {
    const cat = r.category || "OTHER";
    byCat(cat).total++;
  }
  for (const r of success) {
    const cat = r.category || "OTHER";
    const stat = byCat(cat);
    stat.success++;
    if (r.analysis!.brandMentioned) stat.mentioned++;
    if (r.analysis!.recommended) stat.recommended++;
  }
  for (const stat of Object.values(byCategory)) {
    stat.mentionRate = pct(stat.mentioned, stat.success);
  }

  const successCount = success.length;

  return {
    executed: executed.length,
    success: successCount,
    failed: inputs.filter((r) => r.status === "FAILED").length,
    completedAt: executed.length
      ? executed.reduce((acc, r) => (r.completedAt && r.completedAt > acc ? r.completedAt : acc), new Date(0))
      : null,
    providers,
    mentionRate: pct(mentioned.length, successCount),
    recommendationRate: pct(recommended.length, successCount),
    top3Rate: pct(top3.length, successCount),
    citationRate: pct(sourceDetectedResponses, successCount),
    competitorPresenceRate: pct(withCompetitor.length, successCount),
    competitorOnlyCount: competitorOnly.length,
    competitorOnlyPromptIds: competitorOnly.map((r) => r.promptId),
    officialSourceRate,
    sourceCoverage,
    sourceTypeCounts: typeCounts,
    sourceDataAvailable,
    potentialIssues,
    byCategory,
  };
}

/** Объединение structured citations (от провайдера) и text sources (из анализа) в нормализованные записи. */
export function mergeSources(r: { analysis: AnalysisResult | null; structuredCitations?: StructuredCitation[] }): {
  domain: string;
  sourceType: SourceType;
  isOfficial: boolean;
  isCompetitor: boolean;
}[] {
  const out: { domain: string; sourceType: SourceType; isOfficial: boolean; isCompetitor: boolean }[] = [];
  const seen = new Set<string>();
  for (const c of r.structuredCitations ?? []) {
    const domain = c.domain ?? "";
    if (domain && !seen.has(domain)) {
      seen.add(domain);
      const st = c.sourceType as SourceType;
      out.push({
        domain,
        sourceType: ["official", "competitor", "industry", "documentation", "review", "community", "media", "other"].includes(st)
          ? st
          : "other",
        isOfficial: st === "official",
        isCompetitor: st === "competitor",
      });
    }
  }
  for (const s of r.analysis?.sources ?? []) {
    const domain = s.domain ?? "";
    if (domain && !seen.has(domain)) {
      seen.add(domain);
      const st = (s.type ?? "other") as SourceType;
      out.push({
        domain,
        sourceType: ["official", "competitor", "industry", "documentation", "review", "community", "media", "other"].includes(st)
          ? st
          : "other",
        isOfficial: s.official,
        isCompetitor: s.competitorRelated,
      });
    }
  }
  return out;
}


/** Преобразует строку JSON analysis в типизированный объект (безопасно). */
export function parseAnalysis(json: unknown): AnalysisResult | null {
  if (!json || typeof json !== "object") return null;
  const r = json as Record<string, unknown>;
  return {
    brandMentioned: r.brandMentioned === true,
    recommended: r.recommended === true,
    recommendationPosition:
      typeof r.recommendationPosition === "number" && r.recommendationPosition! > 0
        ? Math.round(r.recommendationPosition)
        : null,
    competitors: Array.isArray(r.competitors)
      ? r.competitors.map((c) => c as AnalysisResult["competitors"][number])
      : [],
    products: Array.isArray(r.products) ? r.products.map((p) => String(p)) : [],
    claims: Array.isArray(r.claims)
      ? r.claims.map((c) => c as AnalysisResult["claims"][number])
      : [],
    sources: Array.isArray(r.sources)
      ? r.sources.map((s) => s as AnalysisResult["sources"][number])
      : [],
    citations: Array.isArray(r.citations)
      ? r.citations.map((c) => c as AnalysisResult["citations"][number])
      : [],
    intent: typeof r.intent === "string" ? r.intent : null,
    insight: typeof r.insight === "string" ? r.insight : null,
  };
}