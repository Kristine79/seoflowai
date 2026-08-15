import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { executeAiPrompt, searchCapableProviders } from "@/lib/ai-search/provider";
import { analyzeResponse } from "@/lib/ai-search/analysis";
import { extractPositioning } from "@/lib/ai-search/positioning";
import { parseList } from "@/lib/ai-search/prompt-templates";
import { computePromptSetHash } from "@/lib/ai-search/runs";
import { classifySource } from "@/lib/ai-search/sources";

export const maxDuration = 300;

/**
 * Финализация статуса аудита по последнему run.
 * COMPLETED / PARTIAL / FAILED — если run покрыл все включённые промпты.
 */
async function finalizeAuditStatus(
  auditId: string,
  enabledPromptCount: number,
  runId: string
): Promise<string> {
  const [responses, lastRun] = await Promise.all([
    prisma.aiSearchResponse.findMany({
      where: { auditId, runId },
      select: { status: true },
    }),
    prisma.aiSearchRun.findFirst({ where: { auditId }, orderBy: { runNumber: "desc" } }),
  ]);
  const executed = responses.length;
  if (executed < enabledPromptCount) {
    return "RUNNING";
  }
  const failed = responses.filter((r) => r.status === "FAILED").length;
  const runStatus = failed === executed ? "FAILED" : failed > 0 ? "PARTIAL" : "COMPLETED";
  await prisma.aiSearchRun.update({
    where: { id: runId },
    data: { status: runStatus, completedAt: new Date() },
  });
  return runStatus;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const promptIds: string[] = Array.isArray(body.promptIds) ? body.promptIds : [];
  const mode: "chat" | "web_search" = body.mode === "web_search" ? "web_search" : "chat";

  const audit = await prisma.aiSearchAudit.findUnique({
    where: { id },
    include: { prompts: { where: { enabled: true }, orderBy: { position: "asc" } } },
  });
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  if (audit.status === "RUNNING") {
    const activeRun = await prisma.aiSearchRun.findFirst({
      where: { auditId: id, status: "RUNNING" },
    });
    if (activeRun) {
      return NextResponse.json(
        { error: "Another run is already in progress for this audit" },
        { status: 409 }
      );
    }
  }

  const prompts = audit.prompts.filter((p) => promptIds.includes(p.id));
  if (prompts.length === 0) {
    return NextResponse.json({ error: "No prompts to run" }, { status: 400 });
  }

  if (mode === "web_search" && searchCapableProviders().length === 0) {
    return NextResponse.json(
      {
        error:
          "Source data unavailable: no web-search-capable provider is configured. Add OPENAI_WEB_SEARCH_MODELS or use a perplexity/* model.",
      },
      { status: 400 }
    );
  }

  // run + prompt set snapshot
  const enabledTexts = audit.prompts.map((p) => ({ text: p.text, enabled: true }));
  const hash = computePromptSetHash(enabledTexts);
  const lastRun = await prisma.aiSearchRun.findFirst({
    where: { auditId: id },
    orderBy: { runNumber: "desc" },
  });
  const run = await prisma.aiSearchRun.create({
    data: {
      auditId: id,
      runNumber: (lastRun?.runNumber ?? 0) + 1,
      mode,
      status: "RUNNING",
      startedAt: new Date(),
      promptSetVersion: audit.promptSetVersion,
      promptSetHash: hash,
    },
  });

  await prisma.aiSearchAudit.update({ where: { id }, data: { status: "RUNNING" } });

  const config = {
    brand: audit.brand,
    website: audit.website,
    products: parseList(audit.products),
    competitors: parseList(audit.competitors),
  };

  let officialDomain: string | null = null;
  if (audit.website) {
    try {
      officialDomain = new URL(
        audit.website.includes("://") ? audit.website : `https://${audit.website}`
      ).hostname.replace(/^www\./, "");
    } catch {
      officialDomain = null;
    }
  }
  const sourceCtx = {
    officialDomain,
    competitorDomains: config.competitors.map((c) => c.toLowerCase().replace(/[^a-zа-яё0-9.]+/gi, "")).filter((s) => s.length >= 4),
    brand: config.brand,
    competitors: config.competitors,
  };

  let success = 0;
  let failed = 0;

  for (const prompt of prompts) {
    const response = await prisma.aiSearchResponse.create({
      data: {
        auditId: id,
        runId: run.id,
        promptId: prompt.id,
        promptText: prompt.text,
        status: "PENDING",
        startedAt: new Date(),
        webSearchUsed: mode === "web_search",
      },
    });

    try {
      const execution = await executeAiPrompt(prompt.text, { mode });
      const citations = execution.citations
        ? execution.citations.map((c) => {
            let domain: string | null = null;
            try {
              domain = new URL(c.url).hostname.replace(/^www\./, "");
            } catch {
              domain = null;
            }
            const cls = domain ? classifySource(domain, sourceCtx) : null;
            return {
              url: c.url,
              domain,
              title: c.title,
              sourceType: cls?.sourceType ?? null,
              citationText:
                c.startIndex !== null && c.endIndex !== null
                  ? execution.content.slice(c.startIndex, c.endIndex).trim() || null
                  : null,
            };
          })
        : [];
      await prisma.aiSearchResponse.update({
        where: { id: response.id },
        data: {
          status: "SUCCESS",
          provider: execution.provider,
          model: execution.model,
          rawResponse: execution.content,
          citations: citations.length > 0 ? (citations as object) : null,
          usage: execution.usage ? JSON.parse(JSON.stringify(execution.usage)) : null,
          latencyMs: execution.latencyMs,
          completedAt: new Date(),
          error: null,
        },
      });

      const analysis = await analyzeResponse({
        promptText: prompt.text,
        rawResponse: execution.content,
        ...config,
      });

      const positioning = await extractPositioning({
        promptText: prompt.text,
        rawResponse: execution.content,
        brand: config.brand,
      });

      await prisma.aiSearchResponse.update({
        where: { id: response.id },
        data: {
          analysis: analysis ? (analysis as object) : undefined,
          positioning: positioning ? (positioning as object) : undefined,
        },
      });
      success++;
    } catch (err) {
      failed++;
      await prisma.aiSearchResponse.update({
        where: { id: response.id },
        data: {
          status: "FAILED",
          error: err instanceof Error ? err.message.slice(0, 500) : String(err).slice(0, 500),
          completedAt: new Date(),
        },
      });
    }
  }

  const runStatus = await finalizeAuditStatus(id, audit.prompts.length, run.id);
  const providers = Array.from(
    new Set(
      (
        await prisma.aiSearchResponse.findMany({
          where: { auditId: id, runId: run.id, status: "SUCCESS" },
          select: { provider: true, model: true },
        })
      ).map((r) => (r.provider ? `${r.provider} (${r.model ?? "?"})` : ""))
    )
  ).filter(Boolean);
  await prisma.aiSearchRun.update({
    where: { id: run.id },
    data: { providers: providers as object },
  });
  await prisma.aiSearchAudit.update({
    where: { id },
    data: {
      status: runStatus as never,
      executedAt: new Date(),
      completedAt: runStatus === "RUNNING" ? null : new Date(),
    },
  });

  return NextResponse.json({
    runId: run.id,
    runNumber: run.runNumber,
    mode,
    processed: prompts.length,
    success,
    failed,
    runStatus,
    auditStatus: runStatus,
  });
}
