require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  // Find company
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
        descriptionShort: "ITLLECT ist ein innovatives Softwareentwicklungsunternehmen mit Fokus auf KI.",
        descriptionMedium: "ITLLECT GmbH entwickelt maßgeschneiderte Softwarelösungen für Unternehmen aller Größen mit Fokus auf KI und Webtechnologien.",
        descriptionLong: "Die ITLLECT GmbH mit Sitz in München ist ein führendes Unternehmen im Bereich Softwareentwicklung und Künstliche Intelligenz mit umfassenden Dienstleistungen von Konzeption bis Implementation.",
      },
    });
    console.log("Created company:", company.name);
  } else {
    console.log("Using existing company:", company.name, company.id);
  }

  // Find or create Brownbook directory
  let dir = await prisma.directory.findFirst({
    where: { platform: { contains: "Brownbook", mode: "insensitive" } },
  });

  if (!dir) {
    dir = await prisma.directory.create({
      data: {
        platform: "Brownbook",
        url: "https://www.brownbook.net/add-business",
        status: "READY",
        automationMode: "AI_ASSISTED",
        companyId: company.id,
        priority: "HIGH",
      },
    });
    console.log("Created directory:", dir.id);
  } else {
    dir = await prisma.directory.update({
      where: { id: dir.id },
      data: {
        url: "https://www.brownbook.net/add-business",
        status: "READY",
        automationMode: "AI_ASSISTED",
        companyId: company.id,
        priority: "HIGH",
      },
    });
    console.log("Updated directory:", dir.id, dir.platform);
  }

  console.log("\nResult:");
  console.log("  ID:", dir.id);
  console.log("  Platform:", dir.platform);
  console.log("  URL:", dir.url);
  console.log("  Status:", dir.status);
  console.log("  AutoMode:", dir.automationMode);
  console.log("  Company:", company.name);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
