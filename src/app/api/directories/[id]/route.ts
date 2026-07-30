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
      submissionTemplate: true,
      seoAudit: true,
      submission: true,
      generatedContent: true,
      automationJobs: { orderBy: { createdAt: "desc" } },
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
  const body = await request.json();

  const data: Record<string, unknown> = {};

  if (body.status) {
    data.status = body.status;
    if (body.status === "IN_PROGRESS") {
      data.startedAt = new Date();
    }
    if (body.status === "COMPLETED") {
      data.completedAt = new Date();
    }
  }

  if (body.checklistProgress !== undefined) {
    data.checklistProgress = Array.isArray(body.checklistProgress)
      ? JSON.stringify(body.checklistProgress)
      : body.checklistProgress;
  }

  if (body.automationMode) {
    data.automationMode = body.automationMode;
  }

  const directory = await prisma.directory.update({
    where: { id },
    data,
  });

  if (body.submission) {
    const sub = body.submission;
    await prisma.submission.upsert({
      where: { directoryId: id },
      create: {
        directoryId: id,
        login: sub.login || null,
        password: sub.password || null,
        listingUrl: sub.listingUrl || null,
        notes: sub.notes || null,
        verificationStatus: sub.verificationStatus || "PENDING",
      },
      update: {
        login: sub.login !== undefined ? sub.login : undefined,
        password: sub.password !== undefined ? sub.password : undefined,
        listingUrl: sub.listingUrl !== undefined ? sub.listingUrl : undefined,
        notes: sub.notes !== undefined ? sub.notes : undefined,
        verificationStatus:
          sub.verificationStatus !== undefined
            ? sub.verificationStatus
            : undefined,
      },
    });
  }

  const updated = await prisma.directory.findUnique({
    where: { id },
    include: {
      submissionTemplate: true,
      seoAudit: true,
      submission: true,
      generatedContent: true,
      automationJobs: { orderBy: { createdAt: "desc" } },
      campaign: { include: { company: true } },
    },
  });

  return NextResponse.json(updated);
}
