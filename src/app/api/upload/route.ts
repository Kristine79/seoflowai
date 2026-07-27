import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const campaignId = formData.get("campaignId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

  const directories = [];

  for (const row of rows) {
    const platform = (row["Platform"] || row["platform"] || "") as string;
    const url = (row["URL"] || row["url"] || "") as string;
    const priority = ((row["Priority"] || row["priority"] || "MEDIUM") as string).toUpperCase();
    const category = (row["Category"] || row["category"] || "") as string;
    const notes = (row["Notes"] || row["Instructions"] || row["notes"] || row["instructions"] || "") as string;
    const status = (row["Status"] || row["status"] || "PENDING") as string;
    const liveUrl = (row["Live Listing URL"] || row["liveUrl"] || "") as string;

    if (!platform) continue;

    const validPriorities = ["HIGH", "MEDIUM", "LOW"];
    const finalPriority = validPriorities.includes(priority) ? priority : "MEDIUM";

    const dir = await prisma.directory.create({
      data: {
        platform,
        url: url || null,
        priority: finalPriority as "HIGH" | "MEDIUM" | "LOW",
        category: category || null,
        notes: notes || null,
        status: (status as any) || "PENDING",
        liveUrl: liveUrl || null,
        campaignId: campaignId || null,
      },
    });

    directories.push(dir);
  }

  return NextResponse.json({
    total: directories.length,
    directories,
  });
}
