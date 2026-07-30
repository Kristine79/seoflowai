import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { directoryId, mode } = body;

  if (!directoryId || typeof directoryId !== "string") {
    return NextResponse.json({ error: "directoryId is required" }, { status: 400 });
  }

  const submissionMode = mode === "SUBMIT" ? "SUBMIT" : "PREVIEW";

  const directory = await prisma.directory.findUnique({
    where: { id: directoryId },
    include: { company: true, generatedContent: true, submission: true },
  });

  if (!directory) {
    return NextResponse.json({ error: "Directory not found" }, { status: 404 });
  }

  if (directory.automationMode !== "AI_ASSISTED") {
    return NextResponse.json({ error: "Directory is not AI-assisted" }, { status: 400 });
  }

  if (directory.status !== "IN_PROGRESS" && directory.status !== "READY") {
    return NextResponse.json({ error: "Directory must be IN_PROGRESS or READY" }, { status: 400 });
  }

  const job = await prisma.automationJob.create({
    data: {
      directoryId,
      mode: submissionMode,
      status: "PENDING",
    },
  });

  return NextResponse.json({ jobId: job.id, status: job.status, mode: job.mode });
}
