import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import pg from "pg";
import fs from "fs";

const url = new URL(process.env.DATABASE_URL || "");
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const job = await prisma.automationJob.findFirst({
  where: { directoryId: "cms3phboh0009bsutz7uqe7b5" },
  orderBy: { createdAt: "desc" }
});

if (job?.screenshot) {
  const buf = Buffer.from(job.screenshot, "base64");
  fs.writeFileSync("test-output-preview-full.png", buf);
  console.log("Screenshot saved: test-output-preview-full.png (" + buf.length + " bytes)");
}

// Also show all jobs
const jobs = await prisma.automationJob.findMany({
  where: { directoryId: "cms3phboh0009bsutz7uqe7b5" },
  orderBy: { createdAt: "desc" },
  take: 5
});
for (const j of jobs) {
  const logArray = JSON.parse(j.logs || "[]");
  const durationLine = logArray.find(l => l.startsWith("Duration"));
  console.log(`${j.status.padEnd(10)} ${j.mode.padEnd(8)} ${j.id.slice(-8)} ${j.createdAt.toISOString().slice(11,19)} ${durationLine || ""}`);
}

await prisma.$disconnect();
