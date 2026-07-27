import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const directories = await prisma.directory.findMany({
    include: { seoAudit: true },
    orderBy: { createdAt: "desc" },
  });

  const totalDirectories = directories.length;
  const highPriority = directories.filter((d) => d.priority === "HIGH").length;
  const mediumPriority = directories.filter((d) => d.priority === "MEDIUM").length;
  const lowPriority = directories.filter((d) => d.priority === "LOW").length;
  const completed = directories.filter((d) => d.status === "COMPLETED").length;
  const pending = directories.filter((d) => d.status === "PENDING").length;
  const inProgress = directories.filter((d) => d.status === "IN_PROGRESS").length;
  const aiPrepared = directories.filter((d) => d.status === "AI_PREPARED").length;

  const audited = directories.filter((d) => d.seoAudit?.seoScore);
  const averageSeoScore = audited.length
    ? Math.round(audited.reduce((sum, d) => sum + (d.seoAudit?.seoScore || 0), 0) / audited.length)
    : 0;

  const automationEasy = directories.filter((d) => d.seoAudit?.automationLevel === "EASY").length;
  const automationMedium = directories.filter((d) => d.seoAudit?.automationLevel === "MEDIUM").length;
  const automationHard = directories.filter((d) => d.seoAudit?.automationLevel === "HARD").length;
  const automationManual = directories.filter((d) => d.seoAudit?.automationLevel === "MANUAL").length;

  const byCategory: Record<string, number> = {};
  directories.forEach((d) => {
    const cat = d.seoAudit?.platformType || "UNCLASSIFIED";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  const recentDirectories = directories.slice(0, 10).map((d) => ({
    id: d.id,
    platform: d.platform,
    status: d.status,
    seoScore: d.seoAudit?.seoScore || null,
  }));

  return NextResponse.json({
    totalDirectories,
    highPriority,
    mediumPriority,
    lowPriority,
    completed,
    pending,
    inProgress,
    aiPrepared,
    averageSeoScore,
    automationEasy,
    automationMedium,
    automationHard,
    automationManual,
    byCategory,
    recentDirectories,
  });
}
