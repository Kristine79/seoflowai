import type { AiSearchMetrics, AuditConfig, InsightResult, ResponseLike } from "./types";
import { PROMPT_CATEGORY_LABELS } from "./types";

/**
 * Диагностические insights (отдельно от gaps): наблюдаемые паттерны
 * в рамках данного набора промптов. Никаких утверждений о причинах —
 * только «observed pattern» и «potential opportunity».
 */
export function detectInsights(
  cfg: AuditConfig,
  metrics: AiSearchMetrics,
  responses: ResponseLike[]
): InsightResult[] {
  const insights: InsightResult[] = [];
  const successful = responses.filter((r) => r.status === "SUCCESS");
  const idsOf = (list: ResponseLike[]) => list.map((r) => r.id);
  const promptIdsOf = (list: ResponseLike[]) => list.map((r) => r.promptId);

  // INTENT GAP: бренд хорошо представлен в брендовых/продуктовых/сравнительных
  // запросах, но отсутствует в задачных категориях (buyer intent / use case / ...)
  const intentCats = ["BUYER_INTENT", "USE_CASE", "PROBLEM_SOLUTION", "EXPERT_TECHNICAL"];
  const intentRows: { cat: string; total: number; mentioned: number; competitors: string[] }[] = [];
  for (const cat of intentCats) {
    const stat = metrics.byCategory[cat];
    if (!stat || stat.success < 1) continue;
    const catResponses = successful.filter((r) => r.category === cat);
    const competitors = Array.from(new Set(catResponses.flatMap((r) => r.competitorNames))).slice(0, 5);
    intentRows.push({ cat, total: stat.success, mentioned: stat.mentioned, competitors });
  }
  if (intentRows.length >= 2) {
    const zeroRows = intentRows.filter((r) => r.mentioned === 0);
    if (zeroRows.length >= 2) {
      const rowText = zeroRows
        .map(
          (r) =>
            `${PROMPT_CATEGORY_LABELS[r.cat] ?? r.cat}: ${r.total} промптов, ${r.mentioned} упоминаний бренда${
              r.competitors.length ? `, конкуренты: ${r.competitors.join(", ")}` : ""
            }`
        )
        .join("\n");
      insights.push({
        type: "INTENT_GAP",
        severity: "HIGH",
        title: "Intent gap: бренд не обнаружен в задачных категориях запросов",
        description:
          `В рамках данного набора промптов бренд ${cfg.brand} хорошо представлен в запросах, напрямую связанных с брендом, продуктом и сравнениями, но не был обнаружен в отдельных задачных категориях.\n\n` +
          rowText +
          "\n\nObserved visibility pattern. Potential content / information opportunity: проверить, покрыта ли информация о сценариях использования и критериях выбора.",
        evidence: {
          promptIds: promptIdsOf(zeroRows.flatMap((r) => successful.filter((s) => s.category === r.cat))),
          responseIds: idsOf(zeroRows.flatMap((r) => successful.filter((s) => s.category === r.cat))),
          stats: zeroRows.map((r) => `${r.cat}: ${r.total} prompts, ${r.mentioned} brand mentions`).join("; "),
        },
      });
    }
  }

  // AWARENESS → RECOMMENDATION GAP
  const mention = metrics.mentionRate;
  const recommendation = metrics.recommendationRate;
  if (
    mention !== null &&
    recommendation !== null &&
    metrics.success >= 5 &&
    mention >= 30 &&
    recommendation < 10
  ) {
    insights.push({
      type: "AWARENESS_RECOMMENDATION_GAP",
      severity: "MEDIUM",
      title: "Awareness → Recommendation gap",
      description:
        `Brand mentions were observed more frequently than brand recommendations in this audit (mention rate ${mention}% vs recommendation rate ${recommendation}%).\n\n` +
        `Potential opportunity: investigate whether product/category/use-case information is sufficiently explicit for buyer-oriented queries. Причина не установлена: это наблюдаемый паттерн данного набора промптов.`,
      evidence: {
        promptIds: successful.filter((r) => r.brandMentioned && !r.recommended).map((r) => r.promptId),
        responseIds: successful.filter((r) => r.brandMentioned && !r.recommended).map((r) => r.id),
        stats: `mention rate ${mention}% vs recommendation rate ${recommendation}% (${metrics.success} success responses)`,
      },
    });
  }

  return insights;
}
