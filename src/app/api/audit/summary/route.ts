import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import getOpenAI from "@/lib/openai";

export async function GET() {
  const directories = await prisma.directory.findMany({
    where: { seoAudit: { isNot: null } },
    include: { seoAudit: true },
  });

  const total = directories.length;
  const high = directories.filter((d) => d.seoAudit?.priority === "HIGH").length;
  const medium = directories.filter((d) => d.seoAudit?.priority === "MEDIUM").length;
  const low = directories.filter((d) => d.seoAudit?.priority === "LOW").length;

  const audited = directories.filter((d) => d.seoAudit?.seoScore);
  const avgScore = audited.length
    ? Math.round(audited.reduce((s, d) => s + (d.seoAudit?.seoScore || 0), 0) / audited.length)
    : 0;

  const easy = directories.filter((d) => d.seoAudit?.automationLevel === "EASY").length;
  const mediumAuto = directories.filter((d) => d.seoAudit?.automationLevel === "MEDIUM").length;
  const hard = directories.filter((d) => d.seoAudit?.automationLevel === "HARD").length;
  const manual = directories.filter((d) => d.seoAudit?.automationLevel === "MANUAL").length;

  const byCategory: Record<string, number> = {};
  directories.forEach((d) => {
    const cat = d.seoAudit?.platformType || "UNCLASSIFIED";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  const quickWins = directories
    .filter((d) => d.seoAudit?.quickWin)
    .sort((a, b) => (b.seoAudit?.seoScore || 0) - (a.seoAudit?.seoScore || 0))
    .slice(0, 5)
    .map((d) => ({
      platform: d.platform,
      score: d.seoAudit?.seoScore,
      time: d.seoAudit?.estimatedTime,
      reason: d.seoAudit?.quickWin,
    }));

  const topPlatforms = directories
    .filter((d) => d.seoAudit?.seoScore)
    .sort((a, b) => (b.seoAudit?.seoScore || 0) - (a.seoAudit?.seoScore || 0))
    .slice(0, 10)
    .map((d) => ({
      platform: d.platform,
      score: d.seoAudit?.seoScore,
      reason: d.seoAudit?.valueReason,
      time: d.seoAudit?.estimatedTime,
      automation: d.seoAudit?.automationLevel,
      breakdown: d.seoAudit?.seoScoreBreakdown,
    }));

  const byScoreRange = {
    excellent: directories.filter((d) => (d.seoAudit?.seoScore || 0) >= 85).length,
    good: directories.filter((d) => (d.seoAudit?.seoScore || 0) >= 70 && (d.seoAudit?.seoScore || 0) < 85).length,
    average: directories.filter((d) => (d.seoAudit?.seoScore || 0) >= 50 && (d.seoAudit?.seoScore || 0) < 70).length,
    poor: directories.filter((d) => (d.seoAudit?.seoScore || 0) < 50).length,
  };

  const impactEffortMatrix = {
    highImpactLowEffort: quickWins.length,
    highImpactHighEffort: directories.filter(
      (d) => (d.seoAudit?.seoScore || 0) >= 70 && (d.seoAudit?.automationLevel === "HARD" || d.seoAudit?.automationLevel === "MANUAL")
    ).length,
    lowImpactLowEffort: directories.filter(
      (d) => (d.seoAudit?.seoScore || 0) < 50 && (d.seoAudit?.automationLevel === "EASY" || d.seoAudit?.automationLevel === "MEDIUM")
    ).length,
    lowImpactHighEffort: directories.filter(
      (d) => (d.seoAudit?.seoScore || 0) < 50 && (d.seoAudit?.automationLevel === "HARD" || d.seoAudit?.automationLevel === "MANUAL")
    ).length,
  };

  let actionPlan: string[] = [];
  let recommendations: string[] = [];

  if (directories.length > 0) {
    try {
      const top = directories
        .sort((a, b) => (b.seoAudit?.seoScore || 0) - (a.seoAudit?.seoScore || 0))
        .slice(0, 8)
        .map((d) => `${d.platform} (score: ${d.seoAudit?.seoScore}, time: ${d.seoAudit?.estimatedTime || "?"}min, automation: ${d.seoAudit?.automationLevel})`)
        .join("\n");

      const qw = quickWins.map((q) => q.platform).join(", ");

      const prompt = `You are an SEO campaign strategist. Based on the following audit data, generate:

1. A 7-day SEO action plan (7 chronological steps, each step is a string)
2. 3-4 strategic recommendations (each as a string)

Return JSON: { "actionPlan": ["Day 1: ...", "Day 2: ...", ...], "recommendations": ["..."] }

TOP DIRECTORIES:
${top}

QUICK WINS: ${qw || "None identified"}

Total platforms: ${total}
Average SEO score: ${avgScore}/100
High priority: ${high}
Automation ready: ${easy + mediumAuto}
Need manual work: ${hard + manual}`;

      const response = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an SEO campaign strategist. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      actionPlan = (result.actionPlan || []).map((r: unknown) => String(r));
      recommendations = (result.recommendations || []).map((r: unknown) => {
        if (typeof r === "string") return r;
        if (r && typeof r === "object") {
          const obj = r as Record<string, unknown>;
          return obj.action ? `${obj.action}: ${obj.description || ""}` : JSON.stringify(r);
        }
        return String(r);
      });
    } catch {
      actionPlan = [
        "Day 1: Complete high-value directory profiles (GoodFirms, DesignRush, Crunchbase)",
        "Day 2: Set up Google Business Profile and citation consistency",
        "Day 3: Complete review platform profiles (Trustpilot, G2)",
        "Day 4: Submit to business directories (Yellow Pages, Manta, Data Axle)",
        "Day 5: Create content platform presence (Medium, LinkedIn)",
        "Day 6: Verify all listings and check NAP consistency",
        "Day 7: Monitor and collect initial analytics",
      ];
      recommendations = [
        "Start with Data Axle — it feeds multiple downstream directories automatically",
        "Ensure NAP (Name, Address, Phone) is 100% consistent across all platforms",
        "Prioritize agency-specific directories over general business directories for higher ROI",
      ];
    }
  }

  return NextResponse.json({
    total,
    highValue: high,
    mediumValue: medium,
    lowValue: low,
    opportunityScore: avgScore,
    automationReady: easy + mediumAuto,
    needManualWork: hard + manual,
    byCategory,
    topPlatforms,
    quickWins,
    byScoreRange,
    impactEffortMatrix,
    recommendations,
    actionPlan,
  });
}
