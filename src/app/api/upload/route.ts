import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

const KNOWN_HEADERS = [
  "platform", "url", "website", "priority", "category",
  "notes", "instructions", "status", "liveurl", "listingurl",
];

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function findHeaderRow(raw: string[][]): { headerRow: string[]; dataStart: number } | null {
  for (let r = 0; r < Math.min(raw.length, 20); r++) {
    const row = raw[r].map((c) => normalize(c));
    const matchCount = row.filter((c) => KNOWN_HEADERS.some((h) => c.includes(h))).length;
    if (matchCount >= 2) {
      return { headerRow: raw[r], dataStart: r + 1 };
    }
  }
  return null;
}

function buildRowObject(headerRow: string[], dataRow: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let c = 0; c < headerRow.length; c++) {
    if (c < dataRow.length) {
      obj[normalize(headerRow[c])] = dataRow[c];
    }
  }
  return obj;
}

export async function POST(request: Request) {
  try {
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

    const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
    const filtered = rawRows.filter((r) => r.some((c) => c.toString().trim() !== ""));

    const found = findHeaderRow(filtered);

    if (!found) {
      return NextResponse.json({
        total: 0, imported: 0, failed: 0,
        errors: [
          "Could not find a header row with expected columns (Platform, URL, Priority, etc.).",
          `First 3 rows: ${JSON.stringify(filtered.slice(0, 3))}`,
        ],
        columns: [],
        filename: file.name, rowsDetected: filtered.length,
      });
    }

    const { headerRow, dataStart } = found;
    const dataRows = filtered.slice(dataStart);
    const headerNormalized = headerRow.map((h) => normalize(h));

    const extract = (row: Record<string, string>, ...keys: string[]): string => {
      for (const key of keys) {
        const nk = normalize(key);
        if (row[nk]) return row[nk];
      }
      return "";
    };

    const directories = [];
    const errors: { row: number; platform: string; error: string }[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = buildRowObject(headerRow, dataRows[i]);
      const platform = extract(row, "Platform", "Platform Name", "Directory", "Name");
      const url = extract(row, "URL", "Website", "Site URL", "Link");
      const priorityRaw = extract(row, "Priority", "Priority Level", "Importance").toUpperCase();
      const category = extract(row, "Category", "Directory Category", "Type", "Platform Category");
      const notes = extract(row, "Notes", "Instructions", "Notes / Instructions", "Notes/Instructions", "Comments");
      const statusRaw = extract(row, "Status", "Listing Status", "Submission Status").toUpperCase();
      const liveUrl = extract(row, "Live Listing URL", "Live URL", "Listing URL", "liveUrl");

      if (!platform) {
        errors.push({ row: dataStart + i + 1, platform: "(empty)", error: "Platform name is required" });
        continue;
      }

      const validPriorities = ["HIGH", "MEDIUM", "LOW"];
      const finalPriority = validPriorities.includes(priorityRaw) ? priorityRaw : "MEDIUM";
      const validStatuses = [
        "PENDING", "AI_PREPARED", "READY", "IN_PROGRESS",
        "VERIFICATION_REQUIRED", "COMPLETED", "REJECTED", "PAYMENT_REQUIRED",
      ];
      const finalStatus = validStatuses.includes(statusRaw) ? statusRaw : "PENDING";
      const seoScore = parseInt(extract(row, "SEO Score", "SEO Value", "Score"));
      const estimatedMinutes = parseInt(extract(row, "Time", "Minutes", "Est. Time", "Estimated Time"));

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
          row: dataStart + i + 1,
          platform,
          error: dbErr instanceof Error ? dbErr.message : "Database error",
        });
      }
    }

    return NextResponse.json({
      total: directories.length,
      imported: directories.length,
      failed: errors.length,
      errors: errors.map((e) => `Row ${e.row} (${e.platform}): ${e.error}`),
      columns: headerRow,
      filename: file.name,
      rowsDetected: dataRows.length,
    });
  } catch (error) {
    console.error("[XLSX] Import error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to import file",
        total: 0, imported: 0, failed: 0,
      },
      { status: 500 }
    );
  }
}
