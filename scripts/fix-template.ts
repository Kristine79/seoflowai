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

  const dir = await prisma.directory.findFirst({
    where: { platform: { contains: "Brownbook", mode: "insensitive" } },
    include: { submissionTemplate: true },
  });

  if (!dir || !dir.submissionTemplate) {
    console.log("No template found");
    await prisma.$disconnect();
    return;
  }

  const t = dir.submissionTemplate;
  const mapping = t.fieldMapping as Record<string, string>;

  console.log(`Template v${t.version}: ${Object.keys(mapping).length} entries\n`);

  // Find category-related selectors
  const categoryEntries = Object.entries(mapping).filter(([, v]) =>
    v.toLowerCase().includes("digital") || v.toLowerCase().includes("advertising")
  );
  console.log("Category-related entries:");
  for (const [sel, val] of categoryEntries) {
    console.log(`  ${sel} → "${val}"`);
  }

  // Update #_r_1v_ from "Digital Marketing Agency" to "Advertising Agencies"
  let updated = false;
  for (const [sel, val] of Object.entries(mapping)) {
    if (val.toLowerCase().includes("digital")) {
      console.log(`\nUpdating ${sel}: "${val}" → "Advertising Agencies"`);
      mapping[sel] = "Advertising Agencies";
      updated = true;
    }
  }

  if (updated) {
    await prisma.submissionTemplate.update({
      where: { id: t.id },
      data: {
        fieldMapping: mapping,
        version: { increment: 1 },
      },
    });
    console.log("\nTemplate updated ✓");
  } else {
    console.log("\nNo updates needed");
  }

  // Verify
  const updatedTemplate = await prisma.submissionTemplate.findUnique({
    where: { id: t.id },
  });
  const updatedMapping = updatedTemplate?.fieldMapping as Record<string, string>;
  const stillDigital = Object.entries(updatedMapping).filter(([, v]) =>
    v.toLowerCase().includes("digital")
  );
  if (stillDigital.length > 0) {
    console.log(`\n⚠ Still ${stillDigital.length} entries with "Digital":`);
    for (const [sel, val] of stillDigital) {
      console.log(`  ${sel} → "${val}"`);
    }
  } else {
    console.log("\nAll 'Digital' entries replaced ✓");
  }

  await prisma.$disconnect();
}

main().catch(console.error);
