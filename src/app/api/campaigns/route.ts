import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      company: true,
      _count: { select: { directories: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
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
