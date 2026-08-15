import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { buildReportData, generateReport } from "@/lib/ai-search/report-data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");

  const data = await buildReportData(id, runId);
  if (!data) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  const report = generateReport(data);

  await prisma.aiSearchAudit.update({
    where: { id },
    data: { report, reportGeneratedAt: new Date() },
  });

  return NextResponse.json({
    report,
    generatedAt: new Date().toISOString(),
    run: data.currentRun?.id ?? null,
  });
}