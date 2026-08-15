import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { buildRunLikes } from "@/lib/ai-search/runs";
import { compareRuns } from "@/lib/ai-search/compare";
import { toAuditConfig, toResponseLike } from "@/lib/ai-search/data";
import { toSourceContext } from "@/lib/ai-search/sources";

/**
 * Сравнение двух runs: /api/ai-search/[id]/compare?runA=<id>&runB=<id>
 * Возвращает observed changes (метрики, intent, sources, positioning).
 * Никаких причинных утверждений.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const runAId = url.searchParams.get("runA");
  const runBId = url.searchParams.get("runB");
  if (!runAId || !runBId) {
    return NextResponse.json({ error: "runA and runB are required" }, { status: 400 });
  }

  const audit = await prisma.aiSearchAudit.findUnique({ where: { id } });
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  const runs = await buildRunLikes(id);
  const runA = runs.find((r) => r.id === runAId) ?? null;
  const runB = runs.find((r) => r.id === runBId) ?? null;
  if (!runA || !runB) {
    return NextResponse.json({ error: "One of the runs was not found" }, { status: 404 });
  }

  const loadRows = async (runId: string) => {
    const responses = await prisma.aiSearchResponse.findMany({
      where: { auditId: id, runId },
      include: { prompt: { select: { category: true, text: true } } },
    });
    return responses.map((r) =>
      toResponseLike(
        {
          id: r.id,
          promptId: r.promptId,
          status: r.status,
          promptText: r.promptText ?? r.prompt.text,
          provider: r.provider,
          model: r.model,
          rawResponse: r.rawResponse,
          completedAt: r.completedAt,
          analysis: r.analysis,
          positioning: r.positioning,
          citations: r.citations,
          webSearchUsed: r.webSearchUsed,
          runId: r.runId,
        },
        r.prompt.category
      )
    );
  };

  const [likesA, likesB] = await Promise.all([loadRows(runAId), loadRows(runBId)]);

  const config = toAuditConfig(audit);
  const ctx = toSourceContext({
    website: config.website,
    brand: config.brand,
    competitors: config.competitors,
  });

  const comparison = compareRuns(runA, runB, likesA, likesB, ctx);
  return NextResponse.json(comparison);
}
