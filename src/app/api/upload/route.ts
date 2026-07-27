import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const campaignId = formData.get("campaignId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`[XLSX] File received: ${file.name}, size: ${file.size}, type: ${file.type}`);

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`[XLSX] Buffer size: ${buffer.length} bytes`);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    console.log(`[XLSX] Sheets: ${workbook.SheetNames.join(", ")}`);

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];
    console.log(`[XLSX] Raw rows extracted: ${rawRows.length}`);

    if (rawRows.length === 0) {
      return NextResponse.json({
        total: 0,
        imported: 0,
        failed: 0,
        errors: ["No rows found in the Excel file. Check that data starts from the first sheet."],
        columns: [],
        filename: file.name,
      });
    }

    const sampleColumns = Object.keys(rawRows[0]);
    console.log(`[XLSX] Columns detected: ${sampleColumns.join(", ")}`);

    const directories = [];
    const errors: { row: number; platform: string; error: string }[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];

      const platform = String(row["Platform"] || row["platform"] || row["Platform Name"] || row["platform_name"] || "").trim();
      const url = String(row["URL"] || row["url"] || row["Website"] || row["website"] || row["Site URL"] || "").trim();
      const priorityRaw = String(row["Priority"] || row["priority"] || "MEDIUM").trim().toUpperCase();
      const category = String(row["Category"] || row["category"] || row["Directory Category"] || "").trim();
      const notes = String(
        row["Notes"] || row["Instructions"] || row["Notes / Instructions"] || row["notes"] || row["instructions"] || ""
      ).trim();
      const statusRaw = String(row["Status"] || row["status"] || row["Listing Status"] || "PENDING").trim().toUpperCase();
      const liveUrl = String(row["Live Listing URL"] || row["Live URL"] || row["liveUrl"] || "").trim();

      if (!platform) {
        errors.push({ row: i + 2, platform: "(empty)", error: "Platform name is required" });
        continue;
      }

      const validPriorities = ["HIGH", "MEDIUM", "LOW"];
      const finalPriority = validPriorities.includes(priorityRaw) ? priorityRaw : "MEDIUM";

      const validStatuses = [
        "PENDING", "AI_PREPARED", "READY", "IN_PROGRESS",
        "VERIFICATION_REQUIRED", "COMPLETED", "REJECTED", "PAYMENT_REQUIRED",
      ];
      const finalStatus = validStatuses.includes(statusRaw) ? statusRaw : "PENDING";

      try {
        const dir = await prisma.directory.create({
          data: {
            platform,
            url: url || null,
            priority: finalPriority as "HIGH" | "MEDIUM" | "LOW",
            category: category || null,
            notes: notes || null,
            status: finalStatus as any,
            liveUrl: liveUrl || null,
            campaignId: campaignId || null,
          },
        });
        directories.push(dir);
      } catch (dbErr) {
        errors.push({
          row: i + 2,
          platform,
          error: dbErr instanceof Error ? dbErr.message : "Database error",
        });
      }
    }

    console.log(`[XLSX] Imported: ${directories.length}, Failed: ${errors.length}`);

    return NextResponse.json({
      total: directories.length,
      imported: directories.length,
      failed: errors.length,
      errors: errors.map((e) => `Row ${e.row} (${e.platform}): ${e.error}`),
      columns: sampleColumns,
      filename: file.name,
      rowsDetected: rawRows.length,
    });
  } catch (error) {
    console.error("[XLSX] Import error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to import file",
        total: 0,
        imported: 0,
        failed: 0,
      },
      { status: 500 }
    );
  }
}
