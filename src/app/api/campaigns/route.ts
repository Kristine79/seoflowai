import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      company: true,
      _count: { select: { directories: true } },
      directories: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const enriched = campaigns.map((c) => {
    const statusCounts: Record<string, number> = {};
    c.directories.forEach((d) => {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    });
    const { directories, ...rest } = c;
    return { ...rest, statusCounts };
  });

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const data = await request.json();

  let company = await prisma.company.findFirst();
  if (!company && data.company) {
    company = await prisma.company.create({ data: data.company });
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      description: data.description,
      companyId: company?.id || data.companyId,
    },
  });

  return NextResponse.json(campaign);
}
