import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const VALID_STATUSES = ["SUGGESTED", "PLANNED", "DONE"];

/**
 * Обновление статуса action (декларация пользователя):
 * SUGGESTED → PLANNED → DONE (+ note, implementation date, affected URL).
 * Система НЕ проверяет фактическое внесение изменений — это declaration.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const actionId = typeof body.actionId === "string" ? body.actionId : null;
  if (!actionId) return NextResponse.json({ error: "actionId is required" }, { status: 400 });

  const action = await prisma.aiSearchAction.findFirst({
    where: { id: actionId, auditId: id },
  });
  if (!action) return NextResponse.json({ error: "Action not found" }, { status: 404 });

  const status = VALID_STATUSES.includes(body.status) ? body.status : undefined;
  const note = typeof body.note === "string" ? body.note.trim() || null : undefined;
  const affectedUrl = typeof body.affectedUrl === "string" ? body.affectedUrl.trim() || null : undefined;
  const implementedDate =
    typeof body.implementedDate === "string" && body.implementedDate
      ? new Date(body.implementedDate)
      : undefined;

  const updated = await prisma.aiSearchAction.update({
    where: { id: actionId },
    data: {
      ...(status ? { status } : {}),
      ...(note !== undefined ? { note } : {}),
      ...(affectedUrl !== undefined ? { affectedUrl } : {}),
      ...(implementedDate !== undefined ? { implementedDate } : {}),
    },
  });

  return NextResponse.json(updated);
}
