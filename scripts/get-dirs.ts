import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const url = new URL(process.env.DATABASE_URL || "");
  url.searchParams.delete("sslmode");
  const pool = new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  console.log("Querying directories (Prisma will connect automatically)...");
  
  const dirs = await prisma.directory.findMany({
    where: { url: { not: null }, NOT: { url: "" } },
    select: { platform: true, url: true, category: true }
  });
  
  console.log(`Got ${dirs.length} directories\n`);
  const seen = new Map();
  for (const d of dirs) {
    if (!seen.has(d.url)) seen.set(d.url, d.platform);
  }
  for (const [url, p] of seen) console.log(`${p},${url}`);
  console.error(`\nTOTAL UNIQUE: ${seen.size}`);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });