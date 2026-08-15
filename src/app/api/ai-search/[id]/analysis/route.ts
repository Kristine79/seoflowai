import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { computeMetrics } from "@/lib/ai-search/metrics";
import { detectGaps } from "@/lib/ai-search/gaps";
import { buildActions } from "@/lib/ai-search/actions";
import { detectInsights } from "@/lib/ai-search/insights";
import { toAuditConfig, toResponseLike } from "@/lib/ai-search/data";
import { runMetricsFor } from "@/lib/ai-search/runs";
import type { ResponseLike } from "@/lib/ai-search/types";

async function loadRunContext(auditId: string, runIdQuery: string | null) {
  const { metrics, likes, run } = await runMetricsFor(auditId, runIdQuery);
  const audit = await prisma.aiSearchAudit.findUnique({ where: { id: auditId } });
  if (!audit) throw new Error("Audit not found");
  const config = toAuditConfig(audit);
  const gaps = detectGaps(config, metrics, likes);
  const actions = buildActions(config, gaps);
  const insights = detectInsights(config, metrics, likes);
  return { audit, config, metrics, likes, gaps, actions, insights, run };
}

type Loaded = Awaited<ReturnType<typeof loadRunContext>>;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");

  try {
    const ctx = await loadRunContext(id, runId);
    return NextResponse.json({
      metrics: ctx.metrics,
      gaps: ctx.gaps,
      actions: ctx.actions,
      insights: ctx.insights,
      run: ctx.run
        ? { id: ctx.run.id, runNumber: ctx.run.runNumber, mode: ctx.run.mode }
        : null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not found" },
      { status: 404 }
    );
  }
}

/** Пересоздание issues из potentialIssues (upsert по claim+responseId). */
async function syncIssues(ctx: Loaded) {
  const existing = await prisma.aiSearchIssue.findMany({
    where: { auditId: ctx.audit.id },
    select: { id: true, claim: true, responseId: true },
  });
  const keyOf = (claim: string, responseId: string | null) => `${claim}\u0000${responseId ?? ""}`;
  const seen = new Set(existing.map((e) => keyOf(e.claim, e.responseId)));
  for (const p of ctx.metrics.potentialIssues) {
    const key = keyOf(p.claim, p.responseId);
    if (seen.has(key)) continue;
    await prisma.aiSearchIssue.create({
      data: {
        auditId: ctx.audit.id,
        promptId: p.promptId,
        responseId: p.responseId,
        claim: p.claim,
        status: "PENDING_REVIEW",
      },
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");

  let ctx: Loaded;
  try {
    ctx = await loadRunContext(id, runId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not found" },
      { status: 404 }
    );
  }

  const { audit, metrics, gaps, actions, insights } = ctx;

  await prisma.$transaction([
    prisma.aiSearchGap.deleteMany({ where: { auditId: id } }),
    prisma.aiSearchAction.deleteMany({ where: { auditId: id } }),
  ]);

  for (const gap of gaps) {
    await prisma.aiSearchGap.create({
      data: {
        auditId: id,
        type: gap.type,
        severity: gap.severity,
        title: gap.title,
        description: gap.description,
        hypothesis: gap.hypothesis,
        evidence: gap.evidence as object,
        status: "OPEN",
      },
    });
  }

  const gapsWithIds = await prisma.aiSearchGap.findMany({ where: { auditId: id } });
  for (const action of actions) {
    const gap = gapsWithIds.find((g) => g.type === action.gapType);
    await prisma.aiSearchAction.create({
      data: {
        auditId: id,
        gapId: gap?.id ?? null,
        priority: action.priority,
        problem: action.problem,
        recommendation: action.recommendation,
        target: action.target,
        expectedPurpose: action.expectedPurpose,
        whyThisAction: action.whyThisAction,
        verificationMethod: action.verificationMethod,
        evidence: action.evidence as object,
        status: "SUGGESTED",
      },
    });
  }

  await syncIssues(ctx);

  // финализация статуса аудита по факту выполнения
  const enabledCount = await prisma.aiSearchPrompt.count({
    where: { auditId: id, enabled: true },
  });
  let status = audit.status;
  if (metrics.executed === enabledCount && enabledCount > 0) {
    status = metrics.failed === 0 ? "COMPLETED" : metrics.success === 0 ? "FAILED" : "PARTIAL";
    await prisma.aiSearchAudit.update({
      where: { id },
      data: { status, completedAt: new Date() },
    });
  }

  return NextResponse.json({
    metrics,
    gaps: gaps.length,
    actions: actions.length,
    insights: insights.length,
    issues: metrics.potentialIssues.length,
    status,
  });
}
