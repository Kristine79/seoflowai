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
  const companies = await prisma.company.findMany({ select: { id: true, name: true, email: true, website: true } });
  console.log("Companies:", JSON.stringify(companies, null, 2));
  
  const campaigns = await prisma.campaign.findMany({ select: { id: true, name: true, companyId: true } });
  console.log("Campaigns:", JSON.stringify(campaigns, null, 2));
  
  await prisma.$disconnect();
}

main().catch(console.error);