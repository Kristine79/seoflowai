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
  const dirs = await prisma.directory.findMany({
    where: { url: { not: null }, NOT: { url: "" } },
    include: { company: true, generatedContent: true, seoAudit: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  console.log(`\nTotal directories with URLs: ${dirs.length}\n`);
  for (const d of dirs) {
    console.log([
      `ID: ${d.id}`,
      `Platform: ${d.platform}`,
      `URL: ${d.url}`,
      `Status: ${d.status}`,
      `AutoMode: ${d.automationMode}`,
      `Company: ${d.company?.name || "—"}`,
      `HasContent: ${d.generatedContent ? "yes" : "no"}`,
      `HasAudit: ${d.seoAudit ? `yes (score=${d.seoAudit.seoScore})` : "no"}`,
    ].join(" | "));
  }
  await prisma.$disconnect();
}
main().catch(console.error);
