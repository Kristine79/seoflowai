import type {
  AiSearchMetrics,
  ActionResult,
  AuditConfig,
  GapResult,
  InsightResult,
  ResponseLike,
  RunLike,
} from "./types";
import { PROMPT_CATEGORY_LABELS } from "./types";
import { classifySource, toSourceContext } from "./sources";
import { POSITIONING_LABELS, brandPositioning, competitorPositioning, detectPositioningGaps, parsePositioning } from "./positioning";
import type { PositioningKey } from "./types";

export type ReportData = {
  auditName: string;
  createdAt: Date;
  executedAt: Date | null;
  config: AuditConfig;
  promptCount: number;
  enabledPromptCount: number;
  promptSetVersion: number;
  promptSetHash: string | null;
  runs: RunLike[];
  currentRun: RunLike | null;
  metrics: AiSearchMetrics;
  gaps: GapResult[];
  insights: InsightResult[];
  actions: ActionResult[];
  responses: ResponseLike[];
};

function fmt(v: number | null, suffix = "%"): string {
  return v === null ? "Not enough data" : `${v}${suffix}`;
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeStyle: "short" }).format(d);
}

const pctRows = (title: string, value: number | null) =>
  `| ${title} | ${fmt(value)} |`;

const SOURCE_TYPE_LABELS: Record<string, string> = {
  official: "Официальный",
  competitor: "Конкурент",
  industry: "Отраслевой",
  documentation: "Документация",
  review: "Обзоры/отзывы",
  community: "Сообщества",
  media: "СМИ",
  other: "Прочее",
};

/**
 * Генерирует отчёт AI_SEARCH_AUDIT_REPORT.md на основе реальных данных аудита.
 * 16 секций: Executive Summary → Methodology → Providers → Coverage →
 * Metrics → Intent → Awareness/Recommendation → Competitors → Source
 * Intelligence → Gaps → Evidence → Action Plan → Verification → Limitations →
 * Next Measurement.
 * Явно указывает дату, провайдеров/модели, runId, promptSetVersion,
 * источник данных, failed queries, sampling и ограничения.
 */
export function generateReport(data: ReportData): string {
  const { metrics, config, gaps, insights, actions, responses, runs, currentRun } = data;
  const lines: string[] = [];
  const run = currentRun;

  const officialDomain = config.website
    ? (() => {
        try {
          return new URL(config.website.includes("://") ? config.website : `https://${config.website}`).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })()
    : null;

  lines.push("# AI Search Intelligence Audit");
  lines.push("");
  lines.push(`> Отчёт сгенерирован автоматически. Дата: **${fmtDate(new Date())}**`);
  lines.push(
    `> Формулировки: «в рамках данного набора промптов», «observed pattern», «observed gap», «potential opportunity», «recommended action». Никаких утверждений о причинности.`
  );
  lines.push("");

  // ============ 1. EXECUTIVE SUMMARY ============
  lines.push("## 1. Executive Summary");
  lines.push("");
  if (metrics.success === 0) {
    lines.push(
      "Недостаточно данных: ни один промпт не был успешно выполнен и проанализирован. Проверьте конфигурацию провайдеров и повторите запуск."
    );
  } else {
    lines.push(
      `Проанализировано **${metrics.success}** из **${metrics.executed}** выполненных запросов (${metrics.failed} failed).`
    );
    lines.push(`- Бренд упомянут в **${fmt(metrics.mentionRate)}** ответов (в рамках данного набора промптов).`);
    lines.push(`- Бренд рекомендован в **${fmt(metrics.recommendationRate)}** ответов.`);
    lines.push(`- Бренд в топ-3 рекомендаций: **${fmt(metrics.top3Rate)}** ответов.`);
    lines.push(`- Ответов с источниками: **${fmt(metrics.citationRate)}**.`);
    lines.push(`- Ответов, где упомянуты конкуренты без бренда: **${metrics.competitorOnlyCount}**.`);
    if (metrics.sourceDataAvailable) {
      lines.push(`- Обнаружено источников: **${metrics.sourceCoverage.reduce((a, s) => a + s.count, 0)}** упоминаний (${metrics.sourceCoverage.length} уникальных доменов).`);
      if (officialDomain) {
        lines.push(`- Citations с официальным доменом (${officialDomain}): **${metrics.sourceCoverage.filter((s) => s.official).reduce((a, s) => a + s.count, 0)}**.`);
      }
    } else {
      lines.push(
        "- Source data unavailable: в полученных ответах источники не были обнаружены (провайдер не вернул citations, и в текстах ответов их не было)."
      );
    }
    lines.push(
      "Данные — это срез ответов AI на ограниченном наборе запросов в конкретном запуске, а не статистически доказанное измерение рынка."
    );
  }
  lines.push("");

  // ============ 2. AUDIT SCOPE ============
  lines.push("## 2. Audit Scope");
  lines.push("");
  lines.push(`- Название: ${data.auditName}`);
  lines.push(`- Создан: ${fmtDate(data.createdAt)}`);
  lines.push(`- Выполнен: ${fmtDate(data.executedAt ?? run?.completedAt ?? null)}`);
  lines.push(`- Промптов всего: ${data.promptCount} (включено: ${data.enabledPromptCount})`);
  lines.push(`- Язык промптов: ${config.promptLanguage === "ru" ? "русский" : "english"}`);
  lines.push(`- Prompt set version: ${data.promptSetVersion}${data.promptSetHash ? ` (hash: \`${data.promptSetHash.slice(0, 10)}…\`)` : ""}`);
  if (run) {
    lines.push(`- Run: #${run.runNumber} (mode: ${run.mode === "web_search" ? "web_search (source-aware)" : "chat (baseline)"}, status: ${run.status})`);
    lines.push(`- Run date: ${fmtDate(run.completedAt ?? run.startedAt)}`);
    lines.push(`- Run prompt set version: ${run.promptSetVersion}${run.promptSetHash ? ` (hash: \`${run.promptSetHash.slice(0, 10)}…\`)` : ""}`);
    const prev = runs.find((r) => r.runNumber < run.runNumber);
    if (prev && prev.promptSetHash && run.promptSetHash && prev.promptSetHash !== run.promptSetHash) {
      lines.push("> ⚠ Prompt set changed since the previous run — direct comparison may be unreliable.");
    }
  }
  lines.push(`- **Бренд:** ${config.brand}`);
  lines.push(`- **Сайт:** ${config.website ?? "—"}`);
  lines.push(`- **Рынок:** ${config.market ?? "—"}`);
  lines.push(`- **Продукты:** ${config.products.join(", ") || "—"}`);
  lines.push(`- **Конкуренты:** ${config.competitors.join(", ") || "—"}`);
  lines.push(`- **Целевая аудитория:** ${config.targetAudience ?? "—"}`);
  lines.push("");

  // ============ 3. METHODOLOGY ============
  lines.push("## 3. Methodology");
  lines.push("");
  lines.push(
    `- Выполнено ${metrics.executed} запросов к AI-провайдерам через единую точку выполнения (aiChatCompletion): каждый промпт — отдельный запрос, ответ сохранён целиком (rawResponse).`
  );
  lines.push(
    "- Analysis-шаг извлекает структурированные данные: упоминание бренда, рекомендации, позиции, конкуренты, claims, sources, citations. Analysis выполняется отдельным AI-запросом; при его сбое raw-ответ сохраняется и анализ можно повторить."
  );
  lines.push(
    "- Citations сохраняются только если провайдер их реально вернул (structured, с url/title/span). Отсутствие citations не интерпретируется как «AI не использует источники» — это фиксируется как «no sources detected in returned response» / «Source data unavailable from this provider»."
  );
  lines.push(
    "- Классификация источников (official/competitor/industry/…) — rule-based, детерминированная; LLM-метки не являются источником истины."
  );
  lines.push("- Metrics/gaps/insights/actions вычисляются детерминированно из сохранённых ответов; повторный пересчёт не требует новых AI-запросов.");
  lines.push(
    "- Ни одно значение не симулируется: отсутствие данных = «Not enough data»."
  );
  lines.push("");

  // ============ 4. PROVIDERS AND MODELS ============
  lines.push("## 4. Providers and Models");
  lines.push("");
  if (metrics.providers.length === 0) {
    lines.push("Провайдеры не зафиксированы (аудит не выполнен или все запросы упали).");
  } else {
    metrics.providers.forEach((p) => lines.push(`- ${p}`));
  }
  if (run) {
    lines.push("");
    lines.push(`- Execution mode: **${run.mode === "web_search" ? "web_search" : "chat"}**`);
    if (run.mode === "web_search") {
      lines.push("- Citations сохранялись из ответов провайдера (message.annotations), если они были возвращены.");
    } else {
      lines.push("- Source data unavailable from this provider (если citations не были возвращены провайдером) — ничего не симулируется.");
    }
  }
  lines.push("");

  // ============ 5. PROMPT COVERAGE ============
  lines.push("## 5. Prompt Coverage");
  lines.push("");
  lines.push("| Категория | Всего | Успешно | Упоминаний бренда | Рекомендаций | Mention Rate |");
  lines.push("|---|---|---|---|---|---|");
  const cats = Object.keys(metrics.byCategory).sort();
  for (const cat of cats) {
    const s = metrics.byCategory[cat];
    lines.push(
      `| ${PROMPT_CATEGORY_LABELS[cat] ?? cat} | ${s.total} | ${s.success} | ${s.mentioned} | ${s.recommended} | ${fmt(s.mentionRate)} |`
    );
  }
  lines.push(`| **Итого** | ${metrics.executed} | ${metrics.success} | — | — | — |`);
  lines.push("");

  // ============ 6. AI VISIBILITY METRICS ============
  lines.push("## 6. AI Visibility Metrics");
  lines.push("");
  lines.push(`| Метрика | Значение |`);
  lines.push("|---|---|");
  lines.push(pctRows("Mention Rate", metrics.mentionRate));
  lines.push(pctRows("Recommendation Rate", metrics.recommendationRate));
  lines.push(pctRows("Top-3 Rate", metrics.top3Rate));
  lines.push(pctRows("Citation Rate", metrics.citationRate));
  lines.push(pctRows("Competitor Presence", metrics.competitorPresenceRate));
  lines.push(pctRows("Official Source Rate", metrics.officialSourceRate));
  lines.push("");
  lines.push("> Эти метрики относятся только к данному набору промптов и провайдерам данного запуска. Это не утверждение о «видимости бренда на рынке».");
  lines.push("");

  // ============ 7. INTENT-LEVEL ANALYSIS ============
  lines.push("## 7. Intent-level Analysis");
  lines.push("");
  const intentGap = insights.find((i) => i.type === "INTENT_GAP");
  if (intentGap) {
    lines.push(`### ${intentGap.title}`);
    lines.push("");
    lines.push(intentGap.description ?? "");
    lines.push("");
    lines.push(`**Evidence:** ${intentGap.evidence.stats}`);
  } else {
    lines.push("Intent gap не обнаружен в рамках данного набора промптов.");
  }
  lines.push("");

  // ============ 8. AWARENESS → RECOMMENDATION GAP ============
  lines.push("## 8. Awareness → Recommendation Gap");
  lines.push("");
  const awr = insights.find((i) => i.type === "AWARENESS_RECOMMENDATION_GAP");
  if (awr) {
    lines.push(awr.description ?? "");
    lines.push("");
    lines.push(`**Evidence:** ${awr.evidence.stats}`);
  } else {
    lines.push("В рамках данного набора промптов заметного разрыва между упоминаниями и рекомендациями не наблюдается (или данных недостаточно).");
  }
  lines.push("");

  // ============ 9. COMPETITOR ANALYSIS ============
  lines.push("## 9. Competitor Analysis");
  lines.push("");
  const compAgg = new Map<string, { mentioned: number; recommended: number; positions: number[] }>();
  for (const r of responses) {
    if (r.status !== "SUCCESS") continue;
    for (const c of r.competitorNames) {
      const agg = compAgg.get(c) || { mentioned: 0, recommended: 0, positions: [] };
      agg.mentioned++;
      compAgg.set(c, agg);
    }
  }
  if (compAgg.size === 0) {
    lines.push("Конкуренты из конфигурации не встречаются в ответах.");
  } else {
    lines.push("| Конкурент | Упоминаний | Рекомендаций | Позиции |");
    lines.push("|---|---|---|---|");
    for (const [name, agg] of compAgg) {
      lines.push(`| ${name} | ${agg.mentioned} | ${agg.recommended} | ${agg.positions.join(", ") || "—"} |`);
    }
  }
  lines.push("");

  // ============ 9.5 AI POSITIONING ============
  const posRows = responses
    .filter((r) => r.status === "SUCCESS")
    .map((r) => ({
      id: r.id,
      promptId: r.promptId,
      promptText: r.promptText,
      brandMentioned: r.brandMentioned,
      competitorNames: r.competitorNames,
      positioning: parsePositioning(r.positioning ?? null) ?? {
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
      },
    }));
  const posBrand = brandPositioning(posRows);
  const posCompetitors = competitorPositioning(posRows, config.competitors);
  const posGaps = detectPositioningGaps(config, posRows);
  const hasPositioning = posBrand.mentionCount > 0;

  lines.push("## 9.5 AI Positioning");
  lines.push("");
  if (!hasPositioning) {
    lines.push("Positioning data not yet available (позиционирование не извлечено или аудит не выполнен).");
  } else {
    lines.push("> How AI describes the brand — только то, что реально присутствует в raw responses.");
    lines.push("");
    lines.push(`Бренд упомянут в **${posBrand.mentionCount}** ответах.`);
    lines.push("");
    const posKeys: PositioningKey[] = ["categoryAssociations", "productAssociations", "useCases", "technicalTerms", "buyerCriteria", "brandDescriptions", "recurringPhrases", "differentiators"];
    for (const key of posKeys) {
      const stats = posBrand.byKey[key] ?? [];
      lines.push(`### ${POSITIONING_LABELS[key]}`);
      lines.push("");
      if (stats.length === 0) {
        lines.push("Не обнаружено.");
      } else {
        lines.push("| Фраза | Встречаемость | % |");
        lines.push("|---|---|---|");
        for (const s of stats.slice(0, 10)) {
          lines.push(`| ${s.phrase} | ${s.count} | ${s.percentage === null ? "—" : `${s.percentage}%`} |`);
        }
      }
      lines.push("");
    }
  }

  // ============ 9.6 COMPETITOR POSITIONING ============
  lines.push("## 9.6 Competitor Positioning");
  lines.push("");
  if (posCompetitors.length === 0) {
    lines.push("Competitor positioning не обнаружено (конкуренты не встречаются в ответах или positioning не извлечено).");
  } else {
    lines.push("> Observed AI positioning — как AI описывает конкурентов в рамках данного набора промптов. Не официальное позиционирование.");
    lines.push("");
    for (const c of posCompetitors) {
      lines.push(`### ${c.entity} (${c.mentions} упоминаний)`);
      lines.push("");
      lines.push(`- **Описания:** ${c.topDescriptions.slice(0, 5).map((s) => `«${s.phrase}» (${s.count})`).join(", ") || "—"}`);
      lines.push(`- **Продукты:** ${c.topProducts.slice(0, 5).map((s) => `«${s.phrase}» (${s.count})`).join(", ") || "—"}`);
      lines.push(`- **Use cases:** ${c.topUseCases.slice(0, 5).map((s) => `«${s.phrase}» (${s.count})`).join(", ") || "—"}`);
      lines.push(`- **Технические термины:** ${c.topTechnical.slice(0, 5).map((s) => `«${s.phrase}» (${s.count})`).join(", ") || "—"}`);
      lines.push("");
    }
  }

  // ============ 9.7 POSITIONING GAPS ============
  lines.push("## 9.7 Positioning Gaps");
  lines.push("");
  if (posGaps.length === 0) {
    lines.push("Positioning gaps не обнаружены (или данные отсутствуют).");
  } else {
    for (const g of posGaps) {
      lines.push(`- **${g.title}** (${g.severity})`);
      lines.push(`  - ${g.description}`);
      lines.push(`  - Evidence: ${g.evidence.stats}`);
    }
  }
  lines.push("");

  // ============ 10. SOURCE INTELLIGENCE ============
  lines.push("## 10. Source Intelligence");
  lines.push("");
  lines.push(
    "> Observed source pattern: какие источники реально были обнаружены в ответах (citations от провайдера + источники в тексте). Это не вывод о причинно-следственной связи."
  );
  lines.push("");
  if (!metrics.sourceDataAvailable && metrics.sourceCoverage.length === 0) {
    lines.push("В полученных ответах источники не были обнаружены (no sources detected in returned response).");
    lines.push("");
    lines.push("> Source data unavailable from this provider. Отсутствие citations не является доказательством того, что официальный сайт не используется.");
    lines.push("");
  } else {
    lines.push(`- Всего упоминаний источников: **${metrics.sourceCoverage.reduce((a, s) => a + s.count, 0)}**`);
    lines.push(`- Уникальных доменов: **${metrics.sourceCoverage.length}**`);
    const byType = metrics.sourceTypeCounts;
    for (const [t, label] of Object.entries(SOURCE_TYPE_LABELS)) {
      lines.push(`- ${label}: **${byType[t as keyof typeof byType] ?? 0}**`);
    }
    if (officialDomain) {
      const officialMentions = metrics.sourceCoverage.filter((s) => s.official).reduce((a, s) => a + s.count, 0);
      lines.push("");
      lines.push(`### Source Gap`);
      lines.push("");
      if (officialMentions === 0) {
        lines.push(`No ${officialDomain} citations were detected in this audit (0 из ${metrics.success} ответов).`);
      } else {
        lines.push(`Citations с официальным доменом ${officialDomain} обнаружены в ${officialMentions} упоминаниях.`);
      }
    }
    lines.push("");
    const sourceCtx = toSourceContext({
      website: config.website,
      brand: config.brand,
      competitors: config.competitors,
    });
    const domainTypes = new Map<string, string>();
    for (const r of responses) {
      if (r.status !== "SUCCESS") continue;
      for (const c of r.structuredCitations ?? []) {
        if (c.domain) {
          const cls = classifySource(c.domain, sourceCtx);
          domainTypes.set(c.domain, cls.sourceType);
        }
      }
    }
    lines.push("| Домен | Тип | Упоминаний | Официальный | Конкурент |");
    lines.push("|---|---|---|---|---|");
    for (const s of metrics.sourceCoverage) {
      const st = domainTypes.get(s.domain) ?? "other";
      lines.push(`| ${s.domain} | ${SOURCE_TYPE_LABELS[st] ?? st} | ${s.count} | ${s.official ? "да" : "нет"} | ${s.competitorRelated ? "да" : "нет"} |`);
    }
  }
  lines.push("");

  // ============ 11. VISIBILITY GAPS ============
  lines.push("## 11. Visibility Gaps");
  lines.push("");
  if (gaps.length === 0) {
    lines.push("Гэпы не обнаружены при текущем наборе данных.");
  } else {
    for (const g of gaps) {
      lines.push(`### ${g.title} (${g.severity})`);
      lines.push("");
      lines.push(g.description ?? "");
      lines.push("");
      lines.push(`**Evidence:** ${g.evidence.stats}`);
      if (g.hypothesis) {
        lines.push("");
        lines.push(`**Interpretation (hypothesis):** ${g.hypothesis}`);
        lines.push("");
        lines.push("> Гипотеза явно отделена от evidence: она не является установленной причиной.");
      } else {
        lines.push("");
      }
    }
  }

  // ============ 12. EVIDENCE ============
  lines.push("## 12. Evidence");
  lines.push("");
  lines.push(
    "Raw ответы AI хранятся в системе для каждого промпта каждого run (таблица AiSearchResponse, поле rawResponse, immutable). All metrics and gaps построены только на сохранённых ответах. Analysis сохраняется отдельно и не изменяет raw."
  );
  lines.push("");
  if (run) {
    lines.push(
      `- Run #${run.runNumber}: ${run.success} успешно / ${run.failed} failed из ${run.total}; провайдеры: ${run.providers.join(", ") || "—"}.`
    );
  }
  lines.push("");

  // ============ 13. ACTION PLAN ============
  lines.push("## 13. Action Plan");
  lines.push("");
  if (actions.length === 0) {
    lines.push("Действия не сгенерированы (нет гэпов).");
  } else {
    for (const a of actions) {
      lines.push(`### [${a.priority}] ${a.problem}`);
      lines.push("");
      lines.push(`- **Evidence:** ${a.evidence.promptIds.length} prompts, ${a.evidence.responseIds.length} responses`);
      lines.push(`- **Recommended action:** ${a.recommendation}`);
      lines.push(`- **Target:** ${a.target ?? "—"}`);
      if (a.whyThisAction) {
        lines.push(`- **Why this action?** ${a.whyThisAction}`);
      }
      if (a.expectedPurpose) {
        lines.push(`- **Expected purpose:** ${a.expectedPurpose}`);
      }
      lines.push(`- **How to verify?** ${a.verificationMethod ?? "—"}`);
      lines.push(`- **Status:** SUGGESTED`);
      lines.push("");
    }
  }

  // ============ 14. VERIFICATION PLAN ============
  lines.push("## 14. Verification Plan");
  lines.push("");
  lines.push(
    `- Повторный запуск того же набора промптов (${data.enabledPromptCount}, prompt set version ${data.promptSetVersion}) создаст сравнимый run (runId фиксируется, timestamp фиксируется).`
  );
  lines.push(
    "- Сравнение корректно только при неизменном prompt set: если prompts изменены — отображается «Prompt set changed — direct comparison may be unreliable»."
  );
  lines.push(
    "- Для проверки sources: запуск в режиме web_search с search-capable провайдером (например, perplexity/*) на том же наборе промптов; сравниваются citations и их типы."
  );
  lines.push(
    "- Potential factual issues проходят human review (verified / false positive + note); raw ответы не изменяются."
  );
  if (run && run.mode === "chat" && metrics.sourceCoverage.length === 0) {
    lines.push(
      `- Рекомендуется source-aware прогон: текущий run #${run.runNumber} выполнен в режиме chat, источники не обнаружены.`
    );
  }
  lines.push("");

  // ============ 14.5 VERIFICATION RUN (если существует) ============
  const runB = currentRun;
  const runA = runs
    .filter((r) => r.runNumber < (runB?.runNumber ?? 0) && r.total > 0 && r.promptSetHash === runB?.promptSetHash)
    .sort((a, b) => b.runNumber - a.runNumber)[0] ?? null;
  const verificationAvailable = !!runA && !!runB && runA.id !== runB.id;

  lines.push("## 14.5 Verification Run");
  lines.push("");
  if (!verificationAvailable) {
    lines.push("Verification not yet available: повторный запуск с тем же prompt set ещё не выполнен.");
    lines.push("");
  } else {
    lines.push(`- Before: Run #${runA.runNumber} (${runA.mode}, ${runA.providers.join(", ") || "—"})`);
    lines.push(`- After: Run #${runB.runNumber} (${runB.mode}, ${runB.providers.join(", ") || "—"})`);
    lines.push("- Все изменения — «observed change» в рамках данного набора промптов; причинность не утверждается.");
    lines.push("");

    const a = runA.metrics;
    const b = runB.metrics;
    const delta = (x: number | null, y: number | null) => {
      if (x === null || y === null) return "—";
      const d = Math.round((y - x) * 10) / 10;
      return `${d > 0 ? "+" : ""}${d} pp`;
    };
    lines.push("### Observed Changes — metrics");
    lines.push("");
    lines.push("| Метрика | Before | After | Observed change |");
    lines.push("|---|---|---|---|");
    lines.push(`| Mention Rate | ${fmt(a.mentionRate)} | ${fmt(b.mentionRate)} | ${delta(a.mentionRate, b.mentionRate)} |`);
    lines.push(`| Recommendation Rate | ${fmt(a.recommendationRate)} | ${fmt(b.recommendationRate)} | ${delta(a.recommendationRate, b.recommendationRate)} |`);
    lines.push(`| Top-3 Rate | ${fmt(a.top3Rate)} | ${fmt(b.top3Rate)} | ${delta(a.top3Rate, b.top3Rate)} |`);
    lines.push(`| Citation Rate | ${fmt(a.citationRate)} | ${fmt(b.citationRate)} | ${delta(a.citationRate, b.citationRate)} |`);
    lines.push(`| Official Source Rate | ${fmt(a.officialSourceRate)} | ${fmt(b.officialSourceRate)} | ${delta(a.officialSourceRate, b.officialSourceRate)} |`);
    lines.push(`| Competitor-only responses | ${a.competitorOnlyCount} | ${b.competitorOnlyCount} | ${b.competitorOnlyCount - a.competitorOnlyCount >= 0 ? "+" : ""}${b.competitorOnlyCount - a.competitorOnlyCount} |`);
    lines.push("");
    lines.push("### Observed Changes — intent-level");
    lines.push("");
    lines.push("| Категория | Before | After | Observed change |");
    lines.push("|---|---|---|---|");
    const cats = new Set([...Object.keys(a.byCategory), ...Object.keys(b.byCategory)]);
    for (const cat of Array.from(cats).sort()) {
      const sa = a.byCategory[cat];
      const sb = b.byCategory[cat];
      const before = sa ? `${sa.mentioned}/${sa.success}` : "—";
      const after = sb ? `${sb.mentioned}/${sb.success}` : "—";
      const change =
        sa && sb ? `${sb.mentioned - sa.mentioned >= 0 ? "+" : ""}${sb.mentioned - sa.mentioned} mentions` : "—";
      lines.push(`| ${PROMPT_CATEGORY_LABELS[cat] ?? cat} | ${before} | ${after} | ${change} |`);
    }
    lines.push("");

    lines.push("### Observed Source Changes");
    lines.push("");
    lines.push(`- Official source mentions: ${a.sourceCoverage.filter((s) => s.official).reduce((x, s) => x + s.count, 0)} → ${b.sourceCoverage.filter((s) => s.official).reduce((x, s) => x + s.count, 0)}`);
    lines.push(`- Уникальных доменов: ${a.sourceCoverage.length} → ${b.sourceCoverage.length}`);
    lines.push("");

    lines.push("### Observed Positioning Changes");
    lines.push("");
    lines.push("Positioning comparison доступен в UI (вкладка Runs) — здесь фиксируется факт наличия двух сравнимых runs.");
    lines.push("");
  }

  // ============ 15. LIMITATIONS ============
  lines.push("## 15. Limitations");
  lines.push("");
  lines.push("- Срез ограничен количеством промптов и провайдерами, настроенными на момент запуска.");
  lines.push("- Ответы AI нестабильны: повторные запуски могут отличаться без каких-либо изменений бренда.");
  lines.push("- Sources фиксируются только если провайдер вернул citations или источники видны в тексте ответа; провайдер может не раскрывать все источники.");
  lines.push("- Отсутствие citations не является доказательством отсутствия влияния официального сайта.");
  lines.push("- Никаких утверждений о причинно-следственных связях между действиями и метриками.");
  lines.push("- Экспериментальный замер, не статистическое исследование рынка.");
  lines.push(`- Результаты разных провайдеров в одном запуске не смешиваются в одну метрику без обозначения (providers указаны).`);
  lines.push("");

  // ============ 16. NEXT MEASUREMENT ============
  lines.push("## 16. Next Measurement");
  lines.push("");
  lines.push(
    `Повторный запуск этого же набора промптов (${data.promptCount} промптов, prompt set version ${data.promptSetVersion}) на тех же провайдерах создаст baseline-сравнение. Рекомендуемый интервал: 2–4 недели после выполнения Action Plan.`
  );
  lines.push("");

  return lines.join("\n");
}