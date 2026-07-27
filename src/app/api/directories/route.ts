import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const directories = await prisma.directory.findMany({
    include: {
      seoAudit: true,
      submission: true,
      generatedContent: true,
      campaign: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(directories);
}

export async function PATCH(request: Request) {
  const { id, ...data } = await request.json();
  const directory = await prisma.directory.update({
    where: { id },
    data,
  });
  return NextResponse.json(directory);
}
