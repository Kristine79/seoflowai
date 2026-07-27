import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import openai from "@/lib/openai";

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
  const manual = directories.filter(
    (d) =>
      d.seoAudit?.automationLevel === "HARD" || d.seoAudit?.automationLevel === "MANUAL"
  ).length;

  const byCategory: Record<string, number> = {};
  directories.forEach((d) => {
    const cat = d.seoAudit?.platformType || "UNCLASSIFIED";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  const topPlatforms = directories
    .filter((d) => d.seoAudit?.seoScore)
    .sort((a, b) => (b.seoAudit?.seoScore || 0) - (a.seoAudit?.seoScore || 0))
    .slice(0, 5)
    .map((d) => ({
      platform: d.platform,
      score: d.seoAudit?.seoScore,
      reason: d.seoAudit?.valueReason,
    }));

  let recommendations: string[] = [];
  if (directories.length > 5) {
    try {
      const topDirs = directories
        .sort((a, b) => (b.seoAudit?.seoScore || 0) - (a.seoAudit?.seoScore || 0))
        .slice(0, 10)
        .map((d) => `${d.platform} (score: ${d.seoAudit?.seoScore}/100, type: ${d.seoAudit?.platformType})`)
        .join("\n");

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an SEO strategist. Provide 3-5 actionable recommendations. Return JSON with a 'recommendations' array.",
          },
          {
            role: "user",
            content: `Based on these top directories, provide strategic recommendations:\n${topDirs}\nTotal directories: ${total}, Avg score: ${avgScore}/100`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      const raw = result.recommendations || [];
      recommendations = raw.map((r: unknown) => {
        if (typeof r === "string") return r;
        if (r && typeof r === "object") {
          const obj = r as Record<string, unknown>;
          return obj.action ? `${obj.action}: ${obj.description || ""}` : JSON.stringify(r);
        }
        return String(r);
      });
    } catch {
      recommendations = ["Complete high-value directory profiles first", "Ensure NAP consistency across all platforms"];
    }
  }

  return NextResponse.json({
    total,
    highValue: high,
    mediumValue: medium,
    lowValue: low,
    opportunityScore: avgScore,
    automationReady: easy,
    needManualWork: manual,
    byCategory,
    topPlatforms,
    recommendations,
  });
}
