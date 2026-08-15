import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generatePrompts, parseList } from "@/lib/ai-search/prompt-templates";
import { computeMetrics, parseAnalysis } from "@/lib/ai-search/metrics";
import { computePromptSetHash, buildRunLikes } from "@/lib/ai-search/runs";
import type { AuditConfig } from "@/lib/ai-search/types";

const toStr = (v: unknown): string | null =>
  v === undefined || v === null ? null : String(v);

export async function GET() {
  const audits = await prisma.aiSearchAudit.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { prompts: true, responses: true } },
    },
  });

  const list = await Promise.all(
    audits.map(async (audit) => {
      // метрики — по последнему run (провайдеры не смешиваются между runs)
      const runs = await buildRunLikes(audit.id);
      const last = runs[runs.length - 1];
      const metrics = last?.metrics ?? null;
      return {
        id: audit.id,
        name: audit.name,
        brand: audit.brand,
        status: audit.status,
        createdAt: audit.createdAt,
        executedAt: audit.executedAt,
        promptCount: audit._count.prompts,
        responseCount: audit._count.responses,
        executed: metrics?.executed ?? 0,
        success: metrics?.success ?? 0,
        failed: metrics?.failed ?? 0,
        mentionRate: metrics?.mentionRate ?? null,
        recommendationRate: metrics?.recommendationRate ?? null,
        top3Rate: metrics?.top3Rate ?? null,
        latestRun: last
          ? {
              runNumber: last.runNumber,
              mode: last.mode,
              providers: last.providers,
              total: last.total,
            }
          : null,
      };
    })
  );

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const company = await prisma.company.findFirst();

  const brand = toStr(body.brand) || company?.name || "Brand";
  const website = toStr(body.website) || company?.website || null;
  const description = toStr(body.description) || company?.descriptionMedium || company?.descriptionShort || null;
  const categoryPhrase = toStr(body.categoryPhrase) || company?.category || null;
  const products = toStr(body.products) || company?.services || null;
  const market = toStr(body.market) || company?.serviceArea || null;
  const targetAudience = toStr(body.targetAudience) || null;
  const useCases = toStr(body.useCases) || null;
  const problems = toStr(body.problems) || null;
  const competitors = toStr(body.competitors) || null;
  const promptLanguage = body.promptLanguage === "ru" ? "ru" : "en";

  if (!brand.trim()) {
    return NextResponse.json({ error: "Brand is required" }, { status: 400 });
  }

  const config: AuditConfig = {
    brand: brand.trim(),
    website,
    description,
    categoryPhrase,
    products: parseList(products),
    market,
    targetAudience,
    useCases: parseList(useCases),
    problems: parseList(problems),
    competitors: parseList(competitors),
    promptLanguage,
  };

  const generated = generatePrompts(config);
  const hash = computePromptSetHash(generated.map((g) => ({ text: g.text, enabled: true })));

  const audit = await prisma.aiSearchAudit.create({
    data: {
      name: toStr(body.name)?.trim() || `${brand.trim()} — AI Search Audit`,
      status: "READY",
      brand: config.brand,
      website,
      description,
      categoryPhrase,
      products,
      market,
      targetAudience,
      useCases,
      problems,
      competitors,
      promptLanguage,
      sourceCompanyId: company?.id ?? null,
      promptCount: generated.length,
      promptSetVersion: 1,
      promptSetHash: hash,
      prompts: {
        create: generated.map((g, i) => ({
          category: g.category,
          templateKey: g.templateKey,
          text: g.text,
          position: i,
        })),
      },
    },
    include: {
      prompts: { orderBy: { position: "asc" } },
    },
  });

  return NextResponse.json({ audit, promptCount: generated.length }, { status: 201 });
}