import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const existing = await prisma.company.findFirst();
  if (existing) {
    return NextResponse.json({ message: "Database already has data" });
  }

  const company = await prisma.company.create({
    data: {
      name: "Demo Agency",
      legalName: "Demo Agency LLC",
      website: "https://example.com",
      email: "info@example.com",
      phone: "+1 (555) 555-0123",
      address: "1 Demo Way",
      city: "Springfield",
      state: "IL",
      country: "USA",
      founded: "2020",
      category: "Digital Marketing Agency",
      serviceArea: "United States",
      services: "SEO, PPC, Social Media Marketing",
      keywords: "digital marketing agency, SEO services",
      descriptionShort: "Demo digital marketing agency for product demonstration.",
      descriptionMedium: "This is a demo company profile used to demonstrate SEOFlow AI capabilities.",
      descriptionLong: "This is a demo company profile used to demonstrate SEOFlow AI capabilities: campaigns, directory submissions, verification and reporting.",
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      name: "Demo Directory Submission Campaign",
      description: "Demo campaign to showcase the directory submission workflow",
      companyId: company.id,
    },
  });

  const directoryData = [
    { platform: "Yellow Pages", url: "https://www.yellowpages.com", priority: "MEDIUM" as const, category: "Business Directory", notes: "List the company under Digital Marketing Agency." },
    { platform: "Manta", url: "https://www.manta.com", priority: "MEDIUM" as const, category: "Business Directory", notes: "Complete full profile with services." },
    { platform: "GoodFirms", url: "https://www.goodfirms.co", priority: "HIGH" as const, category: "Agency Directory", notes: "High authority B2B agency directory. Prepare detailed portfolio." },
    { platform: "DesignRush", url: "https://www.designrush.com", priority: "HIGH" as const, category: "Agency Directory", notes: "Top B2B agency listing platform." },
    { platform: "Crunchbase", url: "https://www.crunchbase.com", priority: "HIGH" as const, category: "Business Directory", notes: "Investor and company database." },
    { platform: "Medium", url: "https://medium.com", priority: "LOW" as const, category: "Content Platform", notes: "Create company publication." },
    { platform: "Trustpilot", url: "https://www.trustpilot.com", priority: "MEDIUM" as const, category: "Review Platform", notes: "Collect and manage reviews." },
    { platform: "Data Axle", url: "https://www.data-axle.com", priority: "HIGH" as const, category: "Citation Aggregator", notes: "Feeds data to multiple directories. High priority." },
  ];

  for (const d of directoryData) {
    await prisma.directory.create({
      data: {
        ...d,
        campaignId: campaign.id,
        companyId: company.id,
      },
    });
  }

  return NextResponse.json({
    message: "Seed data created successfully",
    company,
    campaign,
    directories: directoryData.length,
  });
}
