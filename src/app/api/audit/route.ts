import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import openai from "@/lib/openai";

export async function POST() {
  const directories = await prisma.directory.findMany({
    where: { seoAudit: null },
    include: { campaign: { include: { company: true } } },
  });

  if (directories.length === 0) {
    return NextResponse.json({ message: "All directories already audited", audited: 0 });
  }

  const company = await prisma.company.findFirst();
  let audited = 0;

  const toStr = (v: unknown): string | null => {
    if (!v) return null;
    if (Array.isArray(v)) return v.join("\n");
    return String(v);
  };

  const toInt = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return Math.round(v);
    const n = parseInt(String(v));
    return isNaN(n) ? null : n;
  };

  for (const dir of directories) {
    try {
      const prompt = `You are an SEO strategist performing a professional audit for a directory submission campaign.

COMPANY PROFILE:
- Name: ${company?.name || "ITllect"}
- Category: ${company?.category || "Digital Marketing Agency"}
- Services: ${company?.services || "SEO, PPC, Social Media, Web Development, Content Marketing"}
- Location: ${company?.city || "Plantation"}, ${company?.state || "Florida"}
- Keywords: ${company?.keywords || "digital marketing, SEO, web development"}
- Founded: ${company?.founded || "2015"}

PLATFORM TO ANALYZE: ${dir.platform}
URL: ${dir.url || "N/A"}
Category: ${dir.category || "N/A"}

Analyze this platform for the company above. Return ONLY valid JSON with this exact structure (no markdown):

{
  "platformType": "one of: BUSINESS_DIRECTORY, AGENCY_DIRECTORY, REVIEW_PLATFORM, PORTFOLIO_PLATFORM, SOCIAL_PROFILE, CONTENT_PLATFORM, GOVERNMENT_RESOURCE, PARTNER_DIRECTORY, CITATION_AGGREGATOR",

  "overallScore": "integer 0-100, realistically varied — NOT always 85. Consider: if the platform is not a perfect fit, score lower (e.g. Medium for an agency = 55). Scores should form a realistic distribution.",

  "scoreBreakdown": {
    "domainAuthority": "0-100",
    "seoRelevance": "0-100",
    "localCitationValue": "0-100",
    "industryRelevance": "0-100",
    "backlinkPotential": "0-100",
    "leadGenPotential": "0-100"
  },

  "priority": "HIGH or MEDIUM or LOW",

  "automationLevel": "EASY or MEDIUM or HARD or MANUAL",

  "estimatedTime": "integer minutes to complete this listing",

  "automationReason": "brief explanation of difficulty specific to this platform",

  "valueReason": "PERSONALIZED explanation. Must mention ${company?.name || "ITllect"} by name and explain why this specific platform matters for their category (${company?.category || "Digital Marketing Agency"}). Example: 'Crunchbase helps ${company?.name || "ITllect"} establish technology credibility as a ${company?.category || "digital marketing agency"} and improves trust for B2B buyers.'",

  "requiredAssets": ["list of specific assets needed, e.g. company logo, 200-word description, team photos, etc."],

  "duplicateWarning": "warning about duplicate content risks specific to this platform",

  "recommendation": "strategic recommendation specifically for ${company?.name || "ITllect"}",

  "quickWin": "If this is high impact and low effort, explain why it's a quick win. Otherwise return null."
}

IMPORTANT RULES:
1. Scores MUST be realistically varied — do not give every platform 85. Range from 30 to 95 depending on fit.
2. Every explanation must reference ${company?.name || "ITllect"} by name.
3. Be specific, not generic. Mention the company's services, location, and industry.
4. Categories like "Medium" are lower fit for an agency — score accordingly (40-60).
5. High-authority business directories like Yellow Pages score 65-80 for an agency.
6. Industry-specific agency directories (GoodFirms, Clutch, DesignRush) score 85-95.
7. Review platforms score 70-85.
8. Social profiles score 50-70.
9. Content platforms score 60-75.
10. Government resources score 30-50.`;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional SEO strategist. Return only valid JSON. Be specific, personalized, and realistic with scores." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) continue;

      const result = JSON.parse(content);

      await prisma.seoAudit.create({
        data: {
          directoryId: dir.id,
          platformType: result.platformType || null,
          seoScore: toInt(result.overallScore),
          priority: result.priority || null,
          automationLevel: result.automationLevel || null,
          automationReason: toStr(result.automationReason),
          valueReason: toStr(result.valueReason),
          requiredAssets: toStr(result.requiredAssets),
          duplicateWarning: toStr(result.duplicateWarning),
          recommendation: toStr(result.recommendation),
          estimatedTime: toInt(result.estimatedTime),
          seoScoreBreakdown: result.scoreBreakdown ? JSON.stringify(result.scoreBreakdown) : null,
          quickWin: toStr(result.quickWin),
        },
      });

      await prisma.directory.update({
        where: { id: dir.id },
        data: { status: "AI_PREPARED" },
      });

      audited++;
    } catch (error) {
      console.error(`Failed to audit ${dir.platform}:`, error);
    }
  }

  return NextResponse.json({ audited, total: directories.length });
}
