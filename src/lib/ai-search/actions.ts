import type { ActionResult, AuditConfig, GapResult } from "./types";

/**
 * Правила «гэп → рекомендуемое действие» с полной цепочкой:
 * Evidence → Hypothesis → Recommended action → Target → Verification method.
 * Формулировки: «observed gap», «potential opportunity», «recommended action»,
 * «verification». Никогда не утверждается, что действие гарантированно
 * «увеличит visibility» и никогда не утверждается причинность.
 */
export function buildActions(cfg: AuditConfig, gaps: GapResult[]): ActionResult[] {
  const actions: ActionResult[] = [];
  const add = (a: Omit<ActionResult, "evidence"> & { gapType: string }) => {
    const gap = gaps.find((g) => g.type === a.gapType);
    if (!gap) return;
    actions.push({
      ...a,
      evidence: gap.evidence,
    });
  };

  const cat = cfg.categoryPhrase || cfg.products[0] || "целевой категории";
  const verifySameSet = `Повторно запустить тот же набор промптов после внедрения изменений и сравнить ответы (mention/recommendation rates и наличие citations) с данным запуском.`;
  const verifySources = `Запустить source-aware прогон (web_search) на тех же промптах и проверить, появились ли citations с доменом ${cfg.website ?? "официального сайта"} в ответах.`;

  add({
    gapType: "COMPETITOR_ONLY",
    priority: "HIGH",
    problem: "AI рекомендует конкурентов без упоминания бренда.",
    recommendation: `Потенциальная возможность: усилить присутствие в контенте, который отвечает на те же запросы (${cat}). Начать с чётких ответов на вопросы покупателей на сайте и в базе знаний.`,
    target: "Website / Knowledge Base",
    expectedPurpose: "Увеличить вероятность упоминания бренда в ответах на эти запросы (observed gap, не гарантия).",
    whyThisAction:
      "В рамках данного запуска запросы этой тематики дали ответы с конкурентами без бренда; контент, напрямую отвечающий на такие запросы, — наиболее проверяемая гипотеза.",
    verificationMethod: verifySameSet,
  });

  add({
    gapType: "BRAND_ABSENT",
    priority: "HIGH",
    problem: "Бренд отсутствует в ответах на целую категорию запросов.",
    recommendation: `Observed gap: создать/расширить контент, напрямую отвечающий на запросы этой категории (${cat}), включая разборы use case и критерии выбора.`,
    target: "Website / Knowledge Base",
    expectedPurpose: "Добавить материал, который AI может цитировать в ответах данной категории.",
    whyThisAction:
      "Категории запросов без упоминаний бренда (evidence: stats гэпа) — наблюдаемый паттерн; контент по этим темам — гипотеза, требующая проверки, а не установленная причина.",
    verificationMethod: verifySameSet,
  });

  add({
    gapType: "FACTUAL_ISSUE",
    priority: "HIGH",
    problem: "В ответах AI есть потенциально некорректные утверждения о бренде или рынке.",
    recommendation:
      "Проверить каждое утверждение человеком (статус — human review); подтверждённые факты опубликовать на официальных каналах, чтобы AI мог ссылаться на проверенный источник.",
    target: "Website / Official channels",
    expectedPurpose: "Снизить риск распространения неверных данных о бренде.",
    whyThisAction:
      "Analysis пометил утверждения как потенциально некорректные или непроверяемые; без человеческой проверки их нельзя считать фактическими ошибками или корректными.",
    verificationMethod:
      "Повторно запустить промпты, где встретились проблемные утверждения, и сверить ответы с проверенными фактами; отметить результат в Issues (verified / false positive).",
  });

  add({
    gapType: "MISSING_OFFICIAL_SOURCE",
    priority: "MEDIUM",
    problem: "Официальный сайт не появляется среди источников ответов AI.",
    recommendation:
      "Убедиться, что ключевые страницы о бренде и продуктах индексируемы и содержат структурированные данные (schema.org Organization/Product).",
    target: "Website",
    expectedPurpose: "Увеличить шанс того, что AI сошлётся на официальный источник.",
    whyThisAction:
      "No bolid.ru citations were detected in this audit; структурированные данные и доступность страниц — проверяемая гипотеза для появления официального источника в citations.",
    verificationMethod: verifySources,
  });

  add({
    gapType: "SOURCE_DATA_UNAVAILABLE",
    priority: "LOW",
    problem: "Source data unavailable from this provider.",
    recommendation:
      "Для получения реальных citations использовать search-capable провайдер (например, perplexity/* на OpenRouter) при повторном запуске того же набора промптов.",
    target: "Provider configuration",
    expectedPurpose: "Получить реальные citations, если провайдер их поддерживает; ничего не симулировать.",
    whyThisAction:
      "Провайдер, использованный в этом запуске, не вернул citations и источники не были обнаружены в текстах ответов — source data просто недоступна в данном прогоне.",
    verificationMethod: verifySources,
  });

  add({
    gapType: "WEAK_PRODUCT_REPRESENTATION",
    priority: "MEDIUM",
    problem: "Продукты бренда не упоминаются в ответах AI.",
    recommendation: `Создать/расширить продуктовые страницы и документацию по каждому продукту: возможности, характеристики, примеры внедрений (${cfg.products.join(", ")}).`,
    target: "Website / Knowledge Base",
    expectedPurpose: "Дать AI материал для упоминания конкретных продуктов.",
    whyThisAction:
      "Observed pattern: продукты не упоминаются в рамках данного набора промптов; детальная продуктовая информация — гипотеза для проверки.",
    verificationMethod: verifySameSet,
  });

  add({
    gapType: "COMPARISON_GAP",
    priority: "MEDIUM",
    problem: "Бренд не фигурирует в сравнениях с конкурентами.",
    recommendation: `Опубликовать сравнения ${cfg.brand} с конкурентами (${cfg.competitors.join(", ")}) по критериям: возможности, сценарии, стоимость владения.`,
    target: "Website / Content",
    expectedPurpose: "Создать контент, который AI может использовать в comparison-запросах.",
    whyThisAction:
      "В comparison-запросах данного аудита бренд упоминается реже половины ответов; сравнимый контент — проверяемая гипотеза.",
    verificationMethod: verifySameSet,
  });

  add({
    gapType: "LOW_MENTION_CATEGORY",
    priority: "LOW",
    problem: "Бренд редко упоминается в ответах категории.",
    recommendation: `Observed gap: расширить покрытие запросов категории «${cat}» контентом, который отвечает на типовые вопросы покупателей.`,
    target: "Website / Knowledge Base",
    expectedPurpose: "Увеличить частоту упоминаний в данной категории.",
    whyThisAction:
      "Наблюдаемый паттерн низкой частоты упоминаний в категории («${cat}»); контентные изменения — гипотеза для проверки.",
    verificationMethod: verifySameSet,
  });

  return actions;
}