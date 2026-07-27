import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import openai from "@/lib/openai";

export async function POST(request: Request) {
  const { directoryId } = await request.json();

  const directory = await prisma.directory.findUnique({
    where: { id: directoryId },
    include: { campaign: { include: { company: true } }, seoAudit: true },
  });

  if (!directory) {
    return NextResponse.json({ error: "Directory not found" }, { status: 404 });
  }

  const company = directory.campaign?.company || (await prisma.company.findFirst());

  if (!company) {
    return NextResponse.json({ error: "No company profile found" }, { status: 400 });
  }

  try {
    const prompt = `You are an SEO content writer creating directory listing content.

Company: ${company.name}
Category: ${company.category || "N/A"}
Location: ${company.city || ""}, ${company.state || ""}
Services: ${company.services || "N/A"}
Keywords: ${company.keywords || "N/A"}

Platform: ${directory.platform}
Platform Requirements: ${directory.seoAudit?.requiredAssets || "Standard business listing"}
Platform Type: ${directory.seoAudit?.platformType || "BUSINESS_DIRECTORY"}

Generate optimized content for this directory listing. Return JSON (no markdown, no code fences):

{
  "shortDescription": "50 words max",
  "mediumDescription": "100-150 words",
  "longDescription": "200-300 words",
  "serviceList": ["Service bullet 1", "Service bullet 2", "Service bullet 3", "Service bullet 4", "Service bullet 5"],
  "serviceDescription": "2-3 sentence paragraph describing services in detail",
  "socialBio": "150 chars max social bio",
  "primaryKeywords": ["primary keyword 1", "primary keyword 2", "primary keyword 3"],
  "secondaryKeywords": ["secondary keyword 1", "secondary keyword 2", "secondary keyword 3"],
  "suggestedCategories": {
    "primary": "Main category name for this platform",
    "secondary": ["Category 1", "Category 2", "Category 3"]
  }
}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an SEO content writer. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No content generated");

    const result = JSON.parse(content);

    const toStr = (v: unknown): string | null => {
      if (!v) return null;
      if (Array.isArray(v)) return v.join("\n");
      return String(v);
    };

    const toSuggested = (v: unknown): string | null => {
      if (!v) return null;
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    };

    const generated = await prisma.generatedContent.upsert({
      where: { directoryId: directory.id },
      update: {
        shortDescription: toStr(result.shortDescription),
        mediumDescription: toStr(result.mediumDescription),
        longDescription: toStr(result.longDescription),
        serviceDescription: toStr(result.serviceDescription),
        serviceList: toStr(result.serviceList),
        socialBio: toStr(result.socialBio),
        keywords: toStr(result.keywords),
        primaryKeywords: toStr(result.primaryKeywords),
        secondaryKeywords: toStr(result.secondaryKeywords),
        suggestedCategories: toSuggested(result.suggestedCategories),
      },
      create: {
        directoryId: directory.id,
        shortDescription: toStr(result.shortDescription),
        mediumDescription: toStr(result.mediumDescription),
        longDescription: toStr(result.longDescription),
        serviceDescription: toStr(result.serviceDescription),
        serviceList: toStr(result.serviceList),
        socialBio: toStr(result.socialBio),
        keywords: toStr(result.keywords),
        primaryKeywords: toStr(result.primaryKeywords),
        secondaryKeywords: toStr(result.secondaryKeywords),
        suggestedCategories: toSuggested(result.suggestedCategories),
      },
    });

    await prisma.directory.update({
      where: { id: directory.id },
      data: { status: "READY" },
    });

    return NextResponse.json(generated);
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
