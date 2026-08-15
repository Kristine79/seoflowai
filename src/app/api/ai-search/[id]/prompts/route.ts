import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { computePromptSetHash } from "@/lib/ai-search/runs";

const VALID_CATEGORIES = new Set([
  "BRAND",
  "PRODUCT",
  "CATEGORY",
  "BUYER_INTENT",
  "USE_CASE",
  "COMPARISON",
  "ALTERNATIVES",
  "PROBLEM_SOLUTION",
  "EXPERT_TECHNICAL",
  "COMPETITOR",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const items: { id?: string; category?: string; text?: string; enabled?: boolean }[] = Array.isArray(body.prompts)
    ? body.prompts
    : [];
  const deletedIds: string[] = Array.isArray(body.deletedIds) ? body.deletedIds : [];

  const audit = await prisma.aiSearchAudit.findUnique({ where: { id } });
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  if (deletedIds.length > 0) {
    await prisma.aiSearchPrompt.deleteMany({ where: { id: { in: deletedIds }, auditId: id } });
  }

  let created = 0;
  let updated = 0;

  for (const item of items) {
    const category = item.category && VALID_CATEGORIES.has(item.category) ? item.category : undefined;
    const text = typeof item.text === "string" ? item.text.trim() : "";
    if (!text) continue;

    if (item.id) {
      await prisma.aiSearchPrompt.update({
        where: { id: item.id },
        data: {
          ...(category ? { category: category as never } : {}),
          text,
          enabled: typeof item.enabled === "boolean" ? item.enabled : undefined,
        },
      });
      updated++;
    } else {
      const maxPos = await prisma.aiSearchPrompt.aggregate({
        where: { auditId: id },
        _max: { position: true },
      });
      await prisma.aiSearchPrompt.create({
        data: {
          auditId: id,
          category: (category ?? "BRAND") as never,
          text,
          enabled: item.enabled !== false,
          custom: true,
          position: (maxPos._max.position ?? 0) + 1,
        },
      });
      created++;
    }
  }

  const all = await prisma.aiSearchPrompt.findMany({ where: { auditId: id } });
  const hash = computePromptSetHash(all.map((p) => ({ text: p.text, enabled: p.enabled })));
  await prisma.aiSearchAudit.update({
    where: { id },
    data: {
      promptCount: all.length,
      promptSetVersion: { increment: 1 },
      promptSetHash: hash,
    },
  });

  return NextResponse.json({ updated, created, deleted: deletedIds.length, promptSetVersion: audit.promptSetVersion + 1, promptSetHash: hash });
}