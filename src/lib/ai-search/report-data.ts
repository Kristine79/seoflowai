import { prisma } from "@/lib/prisma";
import { generateReport, type ReportData } from "./report";
import { detectGaps } from "./gaps";
import { buildActions } from "./actions";
import { detectInsights } from "./insights";
import { toAuditConfig } from "./data";
import { buildRunLikes, runMetricsFor } from "./runs";

/**
 * Собирает данные отчёта из единого data layer (audit + runs + метрики,
 * пересчитанные детерминированно из сохранённых ответов, + gaps/actions/
 * insights). Используется и Markdown-маршрутом, и PDF-маршрутом —
 * без дублирования расчётов и хардкода метрик.
 */
export async function buildReportData(id: string, runId: string | null): Promise<ReportData | null> {
  const audit = await prisma.aiSearchAudit.findUnique({
    where: { id },
    include: { prompts: true },
  });
  if (!audit) return null;

  const runs = await buildRunLikes(id);
  const { metrics, likes, run } = await runMetricsFor(id, runId);

  const config = toAuditConfig(audit);
  const gaps = detectGaps(config, metrics, likes);
  const actions = buildActions(config, gaps);
  const insights = detectInsights(config, metrics, likes);

  return {
    auditName: audit.name,
    createdAt: audit.createdAt,
    executedAt: audit.executedAt,
    config,
    promptCount: audit.prompts.length,
    enabledPromptCount: audit.prompts.filter((p) => p.enabled).length,
    promptSetVersion: audit.promptSetVersion,
    promptSetHash: audit.promptSetHash,
    runs,
    currentRun: run,
    metrics,
    gaps,
    insights,
    actions,
    responses: likes,
  };
}

export { generateReport };