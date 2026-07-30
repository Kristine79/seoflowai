// Creates a Preview AutomationJob directly in DB, then runs the worker
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import pg from "pg";

const DIR_ID = "cms3phboh0009bsutz7uqe7b5";
const MODE = "PREVIEW";

const url = new URL(process.env.DATABASE_URL || "");
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Create job
const job = await prisma.automationJob.create({
  data: {
    directoryId: DIR_ID,
    mode: MODE,
    status: "PENDING",
  }
});
console.log("Created job:", JSON.stringify({ id: job.id, status: job.status, mode: job.mode }));
await prisma.$disconnect();
