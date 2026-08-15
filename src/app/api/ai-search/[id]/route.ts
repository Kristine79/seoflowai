import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { buildRunLikes } from "@/lib/ai-search/runs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const audit = await prisma.aiSearchAudit.findUnique({
    where: { id },
    include: {
      prompts: { orderBy: { position: "asc" } },
      responses: {
        orderBy: { completedAt: "desc" },
        include: { prompt: { select: { category: true, text: true } } },
      },
      gaps: { orderBy: { createdAt: "asc" } },
      actions: { orderBy: { createdAt: "asc" } },
      issues: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  const runs = await buildRunLikes(id);

  return NextResponse.json({ ...audit, runs });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const audit = await prisma.aiSearchAudit.findUnique({ where: { id } });
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  if (audit.status === "RUNNING") {
    return NextResponse.json({ error: "Cannot delete an audit while it is running" }, { status: 409 });
  }
  await prisma.aiSearchAudit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
