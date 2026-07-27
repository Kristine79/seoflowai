import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const directory = await prisma.directory.findUnique({
    where: { id },
    include: {
      seoAudit: true,
      submission: true,
      generatedContent: true,
      campaign: { include: { company: true } },
    },
  });

  if (!directory) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(directory);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();
  const directory = await prisma.directory.update({
    where: { id },
    data,
  });
  return NextResponse.json(directory);
}
