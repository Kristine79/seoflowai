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
  // 1. Create a test company if none exists
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "ITLLECT GmbH",
        legalName: "ITLLECT Gesellschaft mit beschränkter Haftung",
        website: "https://itllect.com",
        email: "info@itllect.com",
        phone: "+49 89 12345678",
        address: "Musterstraße 1",
        city: "München",
        state: "Bayern",
        country: "Germany",
        founded: "2020",
        category: "Softwareentwicklung",
        serviceArea: "Deutschland, Österreich, Schweiz",
        services: "Webentwicklung, Mobile Apps, KI-Lösungen, SEO Services, Cloud Infrastruktur",
        keywords: "Softwareentwicklung, KI, Machine Learning, Webentwicklung, Mobile Apps",
        descriptionShort: "ITLLECT ist ein innovatives Softwareentwicklungsunternehmen mit Fokus auf KI und Webtechnologien.",
        descriptionMedium: "ITLLECT GmbH entwickelt maßgeschneiderte Softwarelösungen für Unternehmen aller Größen. Unser Schwerpunkt liegt auf Künstlicher Intelligenz, Webentwicklung und Cloud-Infrastruktur.",
        descriptionLong: "Die ITLLECT GmbH mit Sitz in München ist ein führendes Unternehmen im Bereich Softwareentwicklung und Künstliche Intelligenz. Wir bieten umfassende Dienstleistungen von der Konzeption bis zur Implementation moderner Softwarelösungen. Unser Team aus erfahrenen Entwicklern und KI-Spezialisten arbeitet eng mit Kunden zusammen, um innovative und skalierbare Lösungen zu schaffen.",
      },
    });
    console.log(`Created company: ${company.id} (${company.name})`);
  } else {
    console.log(`Using existing company: ${company.id} (${company.name})`);
  }

  // 2. Find the ProvenExpert directory
  let dir = await prisma.directory.findFirst({
    where: { platform: { contains: "ProvenExpert", mode: "insensitive" } },
  });

  if (!dir) {
    console.log("ProvenExpert not found, creating...");
    dir = await prisma.directory.create({
      data: {
        platform: "ProvenExpert",
        url: "https://www.provenexpert.com",
        status: "READY",
        automationMode: "AI_ASSISTED",
        companyId: company.id,
        priority: "HIGH",
      },
    });
  } else {
    // Update existing
    dir = await prisma.directory.update({
      where: { id: dir.id },
      data: {
        status: "READY",
        automationMode: "AI_ASSISTED",
        companyId: company.id,
      },
    });
    console.log(`Updated directory: ${dir.id}`);
  }

  console.log(`\n=== RESULT ===`);
  console.log(`Directory ID: ${dir.id}`);
  console.log(`Platform: ${dir.platform}`);
  console.log(`URL: ${dir.url}`);
  console.log(`Status: ${dir.status}`);
  console.log(`AutoMode: ${dir.automationMode}`);
  console.log(`Company: ${company.name}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
