import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const existing = await prisma.company.findFirst();
  if (existing) {
    return NextResponse.json({ message: "Database already has data" });
  }

  const company = await prisma.company.create({
    data: {
      name: "ITllect",
      legalName: "ITllect LLC",
      website: "https://itllect.com",
      email: "info@itllect.com",
      phone: "+1 (954) 555-0123",
      address: "100 N University Dr",
      city: "Plantation",
      state: "Florida",
      country: "USA",
      founded: "2015",
      category: "Digital Marketing Agency",
      serviceArea: "United States, Global",
      services: "SEO, PPC, Social Media Marketing, Web Development, Content Marketing, Brand Strategy",
      keywords: "digital marketing agency, SEO services, PPC management, social media marketing, web development, Fort Lauderdale marketing",
      descriptionShort: "Full-service digital marketing agency specializing in SEO and growth strategies.",
      descriptionMedium: "ITllect is a Plantation, Florida-based digital marketing agency delivering data-driven SEO, PPC, and social media solutions that drive measurable growth for businesses of all sizes.",
      descriptionLong: "Founded in 2015, ITllect has grown into a premier digital marketing agency serving clients across the United States. Our team combines creative expertise with data-driven strategies to deliver exceptional results in SEO, paid advertising, social media management, web development, and content marketing. We believe in transparency, measurable outcomes, and building long-term partnerships with our clients.",
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      name: "Q3 2026 Directory Submission",
      description: "Main directory listing campaign for ITllect",
      companyId: company.id,
    },
  });

  const directoryData = [
    { platform: "Yellow Pages", url: "https://www.yellowpages.com", priority: "MEDIUM" as const, category: "Business Directory", notes: "List as ITllect under Digital Marketing Agency." },
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
