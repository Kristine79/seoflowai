import { prisma } from "@/lib/prisma";
import { computeMetrics, parseAnalysis } from "./metrics";
import { toAuditConfig, toResponseLike } from "./data";
import { classifySource, toSourceContext } from "./sources";
import type { SourceContext } from "./sources";
import type { AiSearchMetrics, ResponseLike, RunLike, StructuredCitation } from "./types";

/**
 * Детерминированный хэш набора включённых промптов (для сравнения запусков).
 */
export function computePromptSetHash(prompts: { text: string; enabled: boolean }[]): string {
  const s = prompts
    .filter((p) => p.enabled)
    .map((p) => p.text.trim())
    .sort()
    .join("\n---\n");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

type ResponseRow = {
  id: string;
  promptId: string;
  status: string;
  promptText: string | null;
  provider: string | null;
  model: string | null;
  rawResponse: string | null;
  completedAt: Date | null;
  analysis: unknown;
  positioning?: unknown;
  citations?: unknown;
  webSearchUsed?: boolean;
  runId?: string | null;
  prompt: { category: string; text: string };
};

/** Преобразует сохранённые citations (JSON) в StructuredCitation[] с rule-based классификацией. */
function toStructuredCitations(raw: unknown, ctx: SourceContext): StructuredCitation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => {
      const rec = c && typeof c === "object" ? (c as Record<string, unknown>) : {};
      const url = typeof rec.url === "string" ? rec.url : null;
      if (!url) return null;
      let domain: string | null = null;
      try {
        domain = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        domain = null;
      }
      const cls = domain ? classifySource(domain, ctx) : null;
      const storedType = typeof rec.sourceType === "string" ? rec.sourceType : null;
      return {
        url,
        domain,
        title: typeof rec.title === "string" && rec.title.trim() ? rec.title.trim() : null,
        sourceType: cls ? cls.sourceType : storedType,
        citationText: typeof rec.citationText === "string" && rec.citationText.trim() ? rec.citationText.trim() : null,
      };
    })
    .filter((c): c is StructuredCitation => c !== null);
}

async function loadSourceCtx(audit: { brand: string; website: string | null; competitors: string | null }): Promise<SourceContext> {
  return toSourceContext({
    website: audit.website,
    brand: audit.brand,
    competitors: audit.competitors ? audit.competitors.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean) : [],
  });
}

function toMetricsInput(r: ResponseRow, ctx: SourceContext) {
  return {
    id: r.id,
    promptId: r.promptId,
    status: r.status,
    promptText: r.promptText ?? r.prompt.text,
    category: r.prompt.category,
    provider: r.provider,
    model: r.model,
    rawResponse: r.rawResponse,
    completedAt: r.completedAt,
    analysis: parseAnalysis(r.analysis),
    structuredCitations: toStructuredCitations(r.citations, ctx),
  };
}

function toLike(r: ResponseRow): ResponseLike {
  return toResponseLike(
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
  );
}

/**
 * Все запуски аудита с пересчитанными метриками (детерминированно из сохранённых
 * ответов). Ответы без runId (созданные до введения runs) объединяются в
 * псевдо-run #0 ("legacy").
 */
export async function buildRunLikes(auditId: string): Promise<RunLike[]> {
  const [audit, runs, responses] = await Promise.all([
    prisma.aiSearchAudit.findUnique({
      where: { id: auditId },
      select: { brand: true, website: true, competitors: true },
    }),
    prisma.aiSearchRun.findMany({ where: { auditId }, orderBy: { runNumber: "asc" } }),
    prisma.aiSearchResponse.findMany({
      where: { auditId },
      orderBy: { completedAt: "asc" },
      include: { prompt: { select: { category: true, text: true } } },
    }),
  ]);
  const ctx = await loadSourceCtx(audit ?? { brand: "", website: null, competitors: null });

  const byRun = new Map<string, ResponseRow[]>();
  const unassigned: ResponseRow[] = [];
  for (const r of responses) {
    if (r.runId) {
      if (!byRun.has(r.runId)) byRun.set(r.runId, []);
      byRun.get(r.runId)!.push(r);
    } else {
      unassigned.push(r);
    }
  }

  const out: RunLike[] = [];
  const makeRun = (
    run: {
      id: string;
      runNumber: number;
      mode: string;
      status: string;
      startedAt: Date | null;
      completedAt: Date | null;
      promptSetVersion: number;
      promptSetHash: string | null;
      providers: unknown;
    },
    list: ResponseRow[]
  ): RunLike => {
    const metrics: AiSearchMetrics = computeMetrics(list.map((r) => toMetricsInput(r, ctx)));
    const likes = list.map(toLike);
    const sourceDetectedResponses = likes.filter(
      (r) => (r.structuredCitations?.length ?? 0) > 0 || r.sourceDomains.length > 0
    ).length;
    const providers = Array.from(
      new Set(list.map((r) => r.provider).filter((p): p is string => !!p))
    );
    return {
      id: run.id,
      runNumber: run.runNumber,
      mode: run.mode,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      promptSetVersion: run.promptSetVersion,
      promptSetHash: run.promptSetHash,
      providers,
      success: metrics.success,
      failed: metrics.failed,
      total: list.length,
      sourceDetectedResponses,
      metrics,
    };
  };

  for (const run of runs) {
    out.push(makeRun(run, byRun.get(run.id) ?? []));
  }

  if (unassigned.length > 0) {
    const legacy: RunLike = makeRun(
      {
        id: "legacy",
        runNumber: 0,
        mode: "chat",
        status: "COMPLETED",
        startedAt: null,
        completedAt: null,
        promptSetVersion: 0,
        promptSetHash: null,
        providers: null,
      },
      unassigned
    );
    legacy.providers = Array.from(new Set(unassigned.map((r) => r.provider).filter(Boolean))) as string[];
    out.unshift(legacy);
  }

  return out;
}

/** Метрики для выбранного run (или legacy/всех, если runId не указан). */
export async function runMetricsFor(
  auditId: string,
  runId: string | null
): Promise<{ metrics: AiSearchMetrics; likes: ResponseLike[]; run: RunLike | null }> {
  const runs = await buildRunLikes(auditId);
  const audit = await prisma.aiSearchAudit.findUnique({
    where: { id: auditId },
    select: { brand: true, website: true, competitors: true },
  });
  const ctx = await loadSourceCtx(audit ?? { brand: "", website: null, competitors: null });
  if (runId) {
    const run = runs.find((r) => r.id === runId) ?? null;
    if (run) {
      // likes для выбранного run
      const responses = await prisma.aiSearchResponse.findMany({
        where: { auditId, runId },
        include: { prompt: { select: { category: true, text: true } } },
      });
      return { metrics: run.metrics, likes: responses.map(toLike), run };
    }
  }
  // без runId: метрики по всем ответам аудита
  const responses = await prisma.aiSearchResponse.findMany({
    where: { auditId },
    include: { prompt: { select: { category: true, text: true } } },
  });
  const likes = responses.map(toLike);
  const metrics = computeMetrics(responses.map((r) => toMetricsInput(r, ctx)));
  return { metrics, likes, run: runs[runs.length - 1] ?? null };
}

export { toAuditConfig };
