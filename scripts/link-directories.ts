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

  // Get all directories with no company
  const dirs = await prisma.directory.findMany({
    where: { companyId: null, url: { not: null } },
    select: { id: true, platform: true, automationMode: true }
  });

  console.log(`Found ${dirs.length} directories without company`);

  // Update all to AI_ASSISTED and link to company/campaign
  for (const d of dirs) {
    await prisma.directory.update({
      where: { id: d.id },
      data: {
        companyId: COMPANY_ID,
        campaignId: CAMPAIGN_ID,
        automationMode: "AI_ASSISTED",
        status: "READY"
      }
    });
    console.log(`Updated: ${d.platform}`);
  }

  console.log(`\nDone. Updated ${dirs.length} directories.`);

  // List all directories now
  const allDirs = await prisma.directory.findMany({
    where: { url: { not: null } },
    select: { id: true, platform: true, url: true, status: true, automationMode: true },
    orderBy: { createdAt: "desc" }
  });

  console.log(`\nTotal directories: ${allDirs.length}`);
  for (const d of allDirs) {
    console.log(`  [${d.automationMode}] ${d.platform} - ${d.url} (${d.status})`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);