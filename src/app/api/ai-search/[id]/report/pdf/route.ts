import { NextResponse } from "next/server";
import { buildReportData } from "@/lib/ai-search/report-data";
import { generateReportPdf } from "@/lib/ai-search/report-pdf";
import { reportBaseName } from "@/lib/ai-search/filename";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");

  const data = await buildReportData(id, runId);
  if (!data) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  try {
    const pdf = await generateReportPdf(data);
    const filename = `${reportBaseName(data.config.brand)}.pdf`;
    const body = new Uint8Array(pdf);
    return new Response(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PDF generation failed", err);
    return NextResponse.json(
      { error: "Не удалось подготовить PDF. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}