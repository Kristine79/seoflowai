import type { AiSearchMetrics, AuditConfig, GapResult, ResponseLike } from "./types";

const CATEGORY_IMPORTANCE: Record<string, "HIGH" | "MEDIUM" | "LOW"> = {
  BRAND: "HIGH",
  CATEGORY: "HIGH",
  BUYER_INTENT: "HIGH",
  USE_CASE: "MEDIUM",
  COMPARISON: "MEDIUM",
  ALTERNATIVES: "MEDIUM",
  PROBLEM_SOLUTION: "MEDIUM",
  EXPERT_TECHNICAL: "LOW",
  PRODUCT: "MEDIUM",
  COMPETITOR: "LOW",
};

/**
 * Обнаружение гэпов на основе metric + responses. Каждый гэп ссылается
 * на evidence (promptIds / responseIds / stats). Никаких рекомендаций
 * без наблюдаемых данных.
 */
export function detectGaps(
  cfg: AuditConfig,
  metrics: AiSearchMetrics,
  responses: ResponseLike[]
): GapResult[] {
  const gaps: GapResult[] = [];
  const successful = responses.filter((r) => r.status === "SUCCESS");

  const evidenceOf = (ids: string[], stats: string, promptIds?: string[]) => ({
    promptIds: promptIds ?? responses.filter((r) => ids.includes(r.id)).map((r) => r.promptId),
    responseIds: ids,
    stats,
  });

  // 1. BRAND_ABSENT по категориям
  for (const [cat, stat] of Object.entries(metrics.byCategory)) {
    if (cat === "OTHER") continue;
    if (stat.success >= 2 && stat.mentioned === 0) {
      const catResponses = successful.filter((r) => r.category === cat);
      const competitorNames = Array.from(
        new Set(catResponses.flatMap((r) => r.competitorNames))
      ).slice(0, 3);
      gaps.push({
        type: "BRAND_ABSENT",
        severity: CATEGORY_IMPORTANCE[cat] ?? "MEDIUM",
        title: `Бренд отсутствует в запросах категории «${cat}»`,
        description: `В ${stat.success} успешных ответах на запросы категории «${cat}» бренд ${cfg.brand} не упомянут ни разу${
          competitorNames.length ? `. Упомянуты конкуренты: ${competitorNames.join(", ")}` : ""
        }.`,
        hypothesis:
          "Observed gap в рамках данного набора промптов: по этой категории запросов бренд не появляется. Интерпретация не является установленной причиной; возможна гипотеза о недостатке контента, отвечающего на такие запросы.",
        evidence: evidenceOf(
          catResponses.map((r) => r.id),
          `${stat.success} ответов, ${stat.mentioned} упоминаний бренда`
        ),
      });
    }
  }

  // 2. COMPETITOR_ONLY
  if (metrics.competitorOnlyCount > 0) {
    const ids = responses
      .filter((r) => metrics.competitorOnlyPromptIds.includes(r.promptId))
      .map((r) => r.id);
    gaps.push({
      type: "COMPETITOR_ONLY",
      severity: "HIGH",
      title: "В ответах упомянуты конкуренты без бренда",
      description: `${metrics.competitorOnlyCount} ответов рекомендуют или упоминают конкурентов, но не упоминают ${cfg.brand}. Это наблюдаемый паттерн, не вывод о причине.`,
      hypothesis:
        "Observed pattern в рамках данного набора промптов: конкуренты появляются в ответах без бренда. Причина не установлена.",
      evidence: evidenceOf(ids, `${metrics.competitorOnlyCount} ответов`),
    });
  }

  // 3. MISSING_OFFICIAL_SOURCE / SOURCE_DATA_UNAVAILABLE
  if (cfg.website && metrics.success > 0) {
    if (!metrics.sourceDataAvailable) {
      // Провайдер не вернул citations и в текстах ответов нет источников.
      // Нельзя утверждать, что «AI использует другие источники» или что
      // официальный сайт «не используется» — source data просто недоступна.
      gaps.push({
        type: "SOURCE_DATA_UNAVAILABLE",
        severity: "LOW",
        title: "Source data unavailable from this provider",
        description:
          `Провайдер(ы), использованные в данном аудите, не вернули citations, и в текстах ответов источники не были обнаружены. Source data недоступна: в полученных ответах источники не были обнаружены. Официальный сайт (${cfg.website}) не зафиксирован в citations, но это не является доказательством того, что он не используется.`,
        hypothesis: null,
        evidence: evidenceOf(
          successful.map((r) => r.id),
          `${metrics.success} ответов, 0 citations, 0 sources в тексте`
        ),
      });
    } else {
      const anyOfficial = successful.some((r) => r.officialSources);
      if (!anyOfficial) {
        gaps.push({
          type: "MISSING_OFFICIAL_SOURCE",
          severity: "MEDIUM",
          title: "Официальный источник не встречается в ответах",
          description: `No ${cfg.website} citations were detected in this audit: официальный сайт (${cfg.website}) не упомянут ни в одном из ${metrics.success} проанализированных ответов.`,
          hypothesis:
            "Observed pattern в рамках данного набора промптов: официальный источник не появляется среди обнаруженных citations. Причина не установлена.",
          evidence: evidenceOf(
            successful.map((r) => r.id),
            `${metrics.success} ответов, 0 официальных упоминаний`
          ),
        });
      }
    }
  }

  // 4. WEAK_PRODUCT_REPRESENTATION
  if (cfg.products.length > 0 && metrics.success > 0) {
    const mentionedProducts = new Set(successful.flatMap((r) => r.products));
    const matched = cfg.products.filter((p) =>
      Array.from(mentionedProducts).some((m) => m.toLowerCase().includes(p.toLowerCase().slice(0, 8)) || p.toLowerCase().includes(m.toLowerCase().slice(0, 8)))
    );
    if (matched.length === 0) {
      gaps.push({
        type: "WEAK_PRODUCT_REPRESENTATION",
        severity: "MEDIUM",
        title: "Продукты бренда не упоминаются в ответах",
        description: `Ни один из перечисленных продуктов (${cfg.products.join(", ")}) не упоминается в ответах AI.`,
        hypothesis:
          "Observed pattern в рамках данного набора промптов. Интерпретация не установлена; возможная гипотеза — недостаток материалов о конкретных продуктах.",
        evidence: evidenceOf(successful.map((r) => r.id), `${metrics.success} ответов, 0 упоминаний продуктов`),
      });
    }
  }

  // 5. FACTUAL_ISSUE
  if (metrics.potentialIssues.length > 0) {
    gaps.push({
      type: "FACTUAL_ISSUE",
      severity: "HIGH",
      title: "Потенциально некорректные утверждения о бренде/рынке",
      description: `Analysis пометил ${metrics.potentialIssues.length} утверждений как потенциально некорректные или непроверяемые. Требуется проверка человеком. Это не автоматическое признание фактической ошибки.`,
      hypothesis: null,
      evidence: evidenceOf(
        metrics.potentialIssues.map((p) => p.responseId),
        `${metrics.potentialIssues.length} утверждений`
      ),
    });
  }

  // 6. COMPARISON_GAP
  if (cfg.competitors.length > 0) {
    const compResponses = successful.filter((r) => r.category === "COMPARISON");
    if (compResponses.length >= 2) {
      const brandInComparison = compResponses.filter((r) => r.brandMentioned).length;
      const ratio = brandInComparison / compResponses.length;
      if (ratio < 0.5) {
        gaps.push({
          type: "COMPARISON_GAP",
          severity: "MEDIUM",
          title: "Бренд не фигурирует в сравнениях с конкурентами",
          description: `В ${compResponses.length} ответах на сравнения «${cfg.brand} vs конкуренты» бренд упомянут лишь в ${brandInComparison}.`,
          hypothesis:
            "Observed pattern в рамках данного набора промптов. Причина не установлена; возможная гипотеза — недостаток сравнимого контента.",
          evidence: evidenceOf(
            compResponses.map((r) => r.id),
            `${compResponses.length} ответов, ${brandInComparison} упоминаний бренда`
          ),
        });
      }
    }
  }

  // 7. LOW_MENTION_CATEGORY — бренд упоминается, но редко (< 30%)
  for (const [cat, stat] of Object.entries(metrics.byCategory)) {
    if (cat === "OTHER" || stat.success < 3) continue;
    if (stat.mentionRate !== null && stat.mentionRate > 0 && stat.mentionRate < 30) {
      const catResponses = successful.filter((r) => r.category === cat);
      gaps.push({
        type: "LOW_MENTION_CATEGORY",
        severity: "LOW",
        title: `Низкая частота упоминаний в категории «${cat}»`,
        description: `Бренд упомянут в ${stat.mentioned} из ${stat.success} ответов категории «${cat}» (${stat.mentionRate}%).`,
        hypothesis:
          "Observed pattern в рамках данного набора промптов: низкая частота упоминаний в категории. Причина не установлена.",
        evidence: evidenceOf(
          catResponses.map((r) => r.id),
          `${stat.mentionRate}%`
        ),
      });
    }
  }

  return gaps.sort((a, b) => {
    const order: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });
}