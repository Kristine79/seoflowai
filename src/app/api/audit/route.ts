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

  for (const dir of directories) {
    try {
      const prompt = `You are an SEO expert analyzing directory submission platforms.

Company Profile:
- Name: ${company?.name || "Not provided"}
- Category: ${company?.category || "Not provided"}
- Location: ${company?.city || ""}, ${company?.state || ""}

Platform to analyze: ${dir.platform}
URL: ${dir.url || "N/A"}
Category: ${dir.category || "N/A"}

Analyze this platform and return JSON (no markdown, no code fences):

{
  "platformType": "one of: BUSINESS_DIRECTORY, AGENCY_DIRECTORY, REVIEW_PLATFORM, PORTFOLIO_PLATFORM, SOCIAL_PROFILE, CONTENT_PLATFORM, GOVERNMENT_RESOURCE, PARTNER_DIRECTORY, CITATION_AGGREGATOR",
  "seoScore": "number 0-100",
  "priority": "HIGH, MEDIUM, or LOW",
  "automationLevel": "EASY, MEDIUM, HARD, or MANUAL",
  "automationReason": "brief explanation",
  "valueReason": "brief explanation of SEO value",
  "requiredAssets": "list of required assets",
  "duplicateWarning": "any duplicate content warnings",
  "recommendation": "strategic recommendation"
}`;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an SEO audit expert. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) continue;

      const result = JSON.parse(content);

      await prisma.seoAudit.create({
        data: {
          directoryId: dir.id,
          platformType: result.platformType || null,
          seoScore: typeof result.seoScore === "number" ? result.seoScore : parseInt(result.seoScore) || null,
          priority: result.priority || null,
          automationLevel: result.automationLevel || null,
          automationReason: result.automationReason || null,
          valueReason: result.valueReason || null,
          requiredAssets: result.requiredAssets || null,
          duplicateWarning: result.duplicateWarning || null,
          recommendation: result.recommendation || null,
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
