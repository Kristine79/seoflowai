import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ISSUE_STATUSES = ["PENDING_REVIEW", "VERIFIED", "FALSE_POSITIVE"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const issues = await prisma.aiSearchIssue.findMany({
    where: { auditId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ issues });
}

/**
 * Review потенциально проблемного утверждения человеком:
 * { issueId, status: VERIFIED | FALSE_POSITIVE | PENDING_REVIEW, note? }
 * Raw response остаётся immutable — меняется только статус/заметка.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const issueId = typeof body.issueId === "string" ? body.issueId : null;
  if (!issueId) return NextResponse.json({ error: "issueId is required" }, { status: 400 });

  const issue = await prisma.aiSearchIssue.findFirst({
    where: { id: issueId, auditId: id },
  });
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

  const status = ISSUE_STATUSES.includes(body.status) ? body.status : undefined;
  const note = typeof body.note === "string" ? body.note.trim() || null : undefined;

  const updated = await prisma.aiSearchIssue.update({
    where: { id: issueId },
    data: {
      ...(status ? { status } : {}),
      ...(note !== undefined ? { note } : {}),
      reviewedAt: status && status !== "PENDING_REVIEW" ? new Date() : issue.reviewedAt,
    },
  });

  return NextResponse.json(updated);
}
