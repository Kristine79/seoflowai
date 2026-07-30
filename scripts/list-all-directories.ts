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
    select: { platform: true, url: true, status: true, automationMode: true, category: true },
    orderBy: { platform: "asc" }
  });
  
  console.log("Total directories:", dirs.length);
  console.log("");
  
  for (const d of dirs) {
    console.log([d.platform, d.url || "-", d.status, d.automationMode].join(" | "));
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);