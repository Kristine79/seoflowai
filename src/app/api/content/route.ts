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
  "serviceDescription": "list of services in paragraph",
  "socialBio": "150 chars max social bio",
  "keywords": "comma-separated keywords optimized for this platform"
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

    const generated = await prisma.generatedContent.upsert({
      where: { directoryId: directory.id },
      update: {
        shortDescription: result.shortDescription || null,
        mediumDescription: result.mediumDescription || null,
        longDescription: result.longDescription || null,
        serviceDescription: result.serviceDescription || null,
        socialBio: result.socialBio || null,
        keywords: result.keywords || null,
      },
      create: {
        directoryId: directory.id,
        shortDescription: result.shortDescription || null,
        mediumDescription: result.mediumDescription || null,
        longDescription: result.longDescription || null,
        serviceDescription: result.serviceDescription || null,
        socialBio: result.socialBio || null,
        keywords: result.keywords || null,
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
