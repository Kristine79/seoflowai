import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const company = await prisma.company.findFirst({
    include: { directories: true },
  });
  return NextResponse.json(company);
}

export async function PUT(request: Request) {
  const data = await request.json();
  let company = await prisma.company.findFirst();

  if (company) {
    company = await prisma.company.update({
      where: { id: company.id },
      data,
    });
  } else {
    company = await prisma.company.create({ data });
  }

  return NextResponse.json(company);
}
