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

  const d = await prisma.directory.findFirst({
    where: { platform: { contains: "Brownbook", mode: "insensitive" } },
    include: { company: true },
  });
  console.log("Platform:", d?.platform);
  console.log("URL:", d?.url);
  console.log("Status:", d?.status);
  console.log("AutoMode:", d?.automationMode);
  console.log("Company:", d?.company?.name);

  await prisma.$disconnect();
}
main();
