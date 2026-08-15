import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateReport } from "@/lib/ai-search/report";
import { detectGaps } from "@/lib/ai-search/gaps";
import { buildActions } from "@/lib/ai-search/actions";
import { detectInsights } from "@/lib/ai-search/insights";
import { toAuditConfig, toResponseLike } from "@/lib/ai-search/data";
import { buildRunLikes, runMetricsFor } from "@/lib/ai-search/runs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");

  const audit = await prisma.aiSearchAudit.findUnique({
    where: { id },
    include: { prompts: true },
  });
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  const runs = await buildRunLikes(id);
  const { metrics, likes, run } = await runMetricsFor(id, runId);

  const config = toAuditConfig(audit);
  const gaps = detectGaps(config, metrics, likes);
  const actions = buildActions(config, gaps);
  const insights = detectInsights(config, metrics, likes);

  const report = generateReport({
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
  });

  await prisma.aiSearchAudit.update({
    where: { id },
    data: { report, reportGeneratedAt: new Date() },
  });

  return NextResponse.json({ report, generatedAt: new Date().toISOString(), run: run?.id ?? null });
}
