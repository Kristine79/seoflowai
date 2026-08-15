import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { toAuditConfig } from "@/lib/ai-search/data";
import { runMetricsFor } from "@/lib/ai-search/runs";
import {
  POSITIONING_KEYS,
  POSITIONING_LABELS,
  brandPositioning,
  competitorPositioning,
  detectPositioningGaps,
  extractPositioning,
  parsePositioning,
} from "@/lib/ai-search/positioning";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");

  const audit = await prisma.aiSearchAudit.findUnique({ where: { id } });
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  const config = toAuditConfig(audit);
  const { likes, run } = await runMetricsFor(id, runId);

  const rows = likes
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

  const brand = brandPositioning(rows);
  const competitors = competitorPositioning(rows, config.competitors);
  const gaps = detectPositioningGaps(config, rows);

  const backfillMissing = rows.filter((r) => {
    const p = parsePositioning(r.positioning ?? null);
    return !p || POSITIONING_KEYS.every((k) => (p?.[k]?.length ?? 0) === 0);
  }).length;

  return NextResponse.json({
    labels: POSITIONING_LABELS,
    keys: POSITIONING_KEYS,
    run: run
      ? { runNumber: run.runNumber, mode: run.mode, providers: run.providers, total: run.total }
      : null,
    brand,
    competitors,
    gaps,
    backfillMissing,
  });
}

/**
 * Backfill positioning для ответов выбранного run (или последнего), у которых
 * positioning отсутствует/пустой. Реальные LLM-запросы; ничего не симулируется.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");

  const audit = await prisma.aiSearchAudit.findUnique({ where: { id } });
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  const responses = await prisma.aiSearchResponse.findMany({
    where: { auditId: id, ...(runId ? { runId } : {}) },
    include: { prompt: { select: { text: true } } },
  });

  let updated = 0;
  let skipped = 0;
  for (const r of responses) {
    if (r.status !== "SUCCESS" || !r.rawResponse) {
      skipped++;
      continue;
    }
    const existing = parsePositioning(r.positioning ?? null);
    const hasData = existing && POSITIONING_KEYS.some((k) => (existing[k]?.length ?? 0) > 0);
    if (hasData) {
      skipped++;
      continue;
    }
    const positioning = await extractPositioning({
      promptText: r.promptText ?? r.prompt.text,
      rawResponse: r.rawResponse,
      brand: audit.brand,
    });
    if (positioning) {
      await prisma.aiSearchResponse.update({
        where: { id: r.id },
        data: { positioning: positioning as object },
      });
      updated++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ updated, skipped, auditId: id });
}
