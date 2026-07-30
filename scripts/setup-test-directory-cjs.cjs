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
      },
    });
    console.log("Created company:", company.name);
  } else {
    console.log("Using company:", company.name);
  }

  // Add or update Hotfrog directory with real submission URL
  let hotfrog = await prisma.directory.findFirst({
    where: { platform: { contains: "Hotfrog", mode: "insensitive" } },
  });

  if (hotfrog) {
    hotfrog = await prisma.directory.update({
      where: { id: hotfrog.id },
      data: {
        url: "https://www.hotfrog.com/add-your-business/",
        status: "READY",
        automationMode: "AI_ASSISTED",
        companyId: company.id,
        priority: "HIGH",
      },
    });
    console.log("Updated Hotfrog:", hotfrog.id);
  } else {
    hotfrog = await prisma.directory.create({
      data: {
        platform: "Hotfrog",
        url: "https://www.hotfrog.com/add-your-business/",
        status: "READY",
        automationMode: "AI_ASSISTED",
        companyId: company.id,
        priority: "HIGH",
      },
    });
    console.log("Created Hotfrog:", hotfrog.id);
  }

  // Also add 11880.com
  let eight1180 = await prisma.directory.findFirst({
    where: { platform: { contains: "11880", mode: "insensitive" } },
  });

  if (!eight1180) {
    eight1180 = await prisma.directory.create({
      data: {
        platform: "11880.com",
        url: "https://www.11880.com/branchen/eintragen",
        status: "READY",
        automationMode: "AI_ASSISTED",
        companyId: company.id,
        priority: "HIGH",
      },
    });
    console.log("Created 11880.com:", eight1180.id);
  } else {
    eight1180 = await prisma.directory.update({
      where: { id: eight1180.id },
      data: {
        url: "https://www.11880.com/branchen/eintragen",
        status: "READY",
        automationMode: "AI_ASSISTED",
        companyId: company.id,
        priority: "HIGH",
      },
    });
    console.log("Updated 11880.com:", eight1180.id);
  }

  // Also add GoLocal
  let golocal = await prisma.directory.findFirst({
    where: { platform: { contains: "GoLocal", mode: "insensitive" } },
  });

  if (!golocal) {
    golocal = await prisma.directory.create({
      data: {
        platform: "GoLocal",
        url: "https://www.golocal.de/unternehmen-eintragen/",
        status: "READY",
        automationMode: "AI_ASSISTED",
        companyId: company.id,
        priority: "HIGH",
      },
    });
    console.log("Created GoLocal:", golocal.id);
  }

  console.log("\n=== TEST DIRECTORIES ===");
  const dirs = await prisma.directory.findMany({
    where: { 
      status: "READY",
      automationMode: "AI_ASSISTED",
    },
  });
  for (const d of dirs) {
    console.log(`  [${d.id.slice(0, 8)}] ${d.platform} — ${d.url}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
