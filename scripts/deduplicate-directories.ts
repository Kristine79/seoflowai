import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const url = new URL(process.env.DATABASE_URL || "");
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const COMPANY_ID = "cms3o7jwj0000ssutcych75pi";
  const CAMPAIGN_ID = "cms3o7k550001ssut1ovx6vcu";

  // Find all directories grouped by platform
  const dirs = await prisma.directory.findMany({
    where: { url: { not: null } },
    select: { id: true, platform: true, url: true, status: true, automationMode: true }
  });

  // Group by platform
  const byPlatform = new Map<string, typeof dirs>();
  for (const d of dirs) {
    const key = d.platform.toLowerCase().trim();
    if (!byPlatform.has(key)) byPlatform.set(key, []);
    byPlatform.get(key)!.push(d);
  }

  console.log(`Total entries: ${dirs.length}, Unique platforms: ${byPlatform.size}`);
  console.log("");

  // For each platform, keep best entry, delete others
  let kept = 0;
  let deleted = 0;

  for (const [platform, entries] of byPlatform) {
    // Sort: READY > AI_PREPARED > PENDING, then by id (newer first)
    const priority = { READY: 0, AI_PREPARED: 1, PENDING: 2, MANUAL: 3 };
    entries.sort((a, b) => {
      const pa = priority[a.automationMode as keyof typeof priority] ?? 3;
      const pb = priority[b.automationMode as keyof typeof priority] ?? 3;
      if (pa !== pb) return pa - pb;
      return b.id.localeCompare(a.id); // newer first
    });

    const best = entries[0];
    const toDelete = entries.slice(1);

    // Update best to ensure it's linked
    if (!best.companyId) {
      await prisma.directory.update({
        where: { id: best.id },
        data: { companyId: COMPANY_ID, campaignId: CAMPAIGN_ID, automationMode: "AI_ASSISTED", status: "READY" }
      });
    }

    // Delete duplicates
    for (const d of toDelete) {
      await prisma.directory.delete({ where: { id: d.id } });
      deleted++;
    }
    kept++;
    console.log(`[${entries.length > 1 ? "DEDUP" : "KEEP"}] ${best.platform} (${entries.length}) - ${best.url}`);
  }

  console.log(`\nKept: ${kept}, Deleted: ${deleted}`);

  // Final list
  const finalDirs = await prisma.directory.findMany({
    where: { url: { not: null }, NOT: { url: "" } },
    select: { platform: true, url: true, status: true, automationMode: true },
    orderBy: { platform: "asc" }
  });

  console.log(`\nFinal count: ${finalDirs.length} directories`);
  console.log("");

  for (const d of finalDirs) {
    console.log([d.platform, d.url || "-", d.status, d.automationMode].join(" | "));
  }

  await prisma.$disconnect();
}

main().catch(console.error);