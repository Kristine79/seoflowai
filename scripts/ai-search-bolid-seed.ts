/* eslint-disable */
// Ensures the Bolid validation audit exists with proper UTF-8.
// Idempotent: preserves existing responses and backfills the baseline run.
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { computePromptSetHash } from "../src/lib/ai-search/runs";

const BOLID = {
  name: "Болид — AI Search Audit (валидация)",
  brand: "АО НВП «Болид»",
  website: "https://bolid.ru",
  description:
    "АО НВП «Болид» — российский разработчик и производитель систем безопасности: охранно-пожарной сигнализации, систем контроля и управления доступом, видеонаблюдения и противопожарной автоматики.",
  categoryPhrase: "систем охранно-пожарной сигнализации и безопасности",
  products: "Орион\nС2000\nСтрелец-Интеграл\nС2000-КДЛ",
  market: "Россия, страны СНГ",
  targetAudience: "интеграторы систем безопасности, инженеры по безопасности, объекты промышленности, ритейл и ЖКХ",
  useCases: "охрана промышленных объектов\nпожарная безопасность торговых центров\nконтроль доступа на предприятие",
  problems: "противопожарная защита объектов\nорганизация контроля доступа\nобъединение охранной и пожарной сигнализации",
  competitors: "PERCo\nSigur\nRusGuard\nParsec\nRUBEZH",
  promptLanguage: "ru",
};

const PROMPTS = [
  { category: "BRAND", templateKey: "brand_who", text: "Что вы знаете о компании АО НВП «Болид»?", position: 0 },
  { category: "BRAND", templateKey: "brand_what_do_they_do", text: "Кто такой АО НВП «Болид» и чем он занимается?", position: 1 },
  { category: "PRODUCT", templateKey: "product_offer", text: "Какие продукты и решения предлагает АО НВП «Болид»?", position: 2 },
  { category: "PRODUCT", templateKey: "product_strengths", text: "Каковы сильные и слабые стороны продуктов АО НВП «Болид»?", position: 3 },
  { category: "PRODUCT", templateKey: "product_specific", text: "Что говорят о продукте «Орион» от АО НВП «Болид»?", position: 4 },
  { category: "PRODUCT", templateKey: "product_specific", text: "Что говорят о продукте «С2000» от АО НВП «Болид»?", position: 5 },
  { category: "CATEGORY", templateKey: "category_best", text: "Какие лучшие решения для систем охранно-пожарной сигнализации и безопасности есть на рынке (Россия, страны СНГ)?", position: 6 },
  { category: "CATEGORY", templateKey: "category_recommended", text: "Каких поставщиков систем охранно-пожарной сигнализации и безопасности рекомендуют эксперты?", position: 7 },
  { category: "BUYER_INTENT", templateKey: "buyer_consider", text: "Что компании стоит учитывать при выборе систем охранно-пожарной сигнализации и безопасности?", position: 8 },
  { category: "BUYER_INTENT", templateKey: "buyer_reliable_vendor", text: "Как выбрать надёжного поставщика систем охранно-пожарной сигнализации и безопасности?", position: 9 },
  { category: "BUYER_INTENT", templateKey: "buyer_use_case_criteria", text: "Какие критерии важны для охраны промышленных объектов при покупке систем охранно-пожарной сигнализации и безопасности?", position: 10 },
  { category: "USE_CASE", templateKey: "use_case_suitable", text: "Какое решение для систем охранно-пожарной сигнализации и безопасности подходит для охраны промышленных объектов?", position: 11 },
  { category: "USE_CASE", templateKey: "use_case_suitable", text: "Какое решение для систем охранно-пожарной сигнализации и безопасности подходит для пожарной безопасности торговых центров?", position: 12 },
  { category: "USE_CASE", templateKey: "use_case_implement", text: "Как компании на практике внедряют системы охранно-пожарной сигнализации и безопасности?", position: 13 },
  { category: "COMPARISON", templateKey: "comparison_vs", text: "АО НВП «Болид» или PERCo: что выбрать?", position: 14 },
  { category: "COMPARISON", templateKey: "comparison_vs", text: "АО НВП «Болид» или Sigur: что выбрать?", position: 15 },
  { category: "COMPARISON", templateKey: "comparison_vs", text: "АО НВП «Болид» или RusGuard: что выбрать?", position: 16 },
  { category: "COMPARISON", templateKey: "comparison_vs", text: "АО НВП «Болид» или Parsec: что выбрать?", position: 17 },
  { category: "COMPARISON", templateKey: "comparison_vs", text: "АО НВП «Болид» или RUBEZH: что выбрать?", position: 18 },
  { category: "COMPARISON", templateKey: "comparison_brand_vs", text: "Сравните АО НВП «Болид» и PERCo для охраны промышленных объектов.", position: 19 },
  { category: "ALTERNATIVES", templateKey: "alternatives_to_competitor", text: "Какие есть альтернативы PERCo?", position: 20 },
  { category: "ALTERNATIVES", templateKey: "alternatives_to_competitor", text: "Какие есть альтернативы Sigur?", position: 21 },
  { category: "ALTERNATIVES", templateKey: "alternatives_to_competitor", text: "Какие есть альтернативы RusGuard?", position: 22 },
  { category: "ALTERNATIVES", templateKey: "alternatives_to_brand", text: "Существуют ли альтернативы АО НВП «Болид»? Если да, какие?", position: 23 },
  { category: "PROBLEM_SOLUTION", templateKey: "problem_solve", text: "Как решить проблему: противопожарная защита объектов, используя системы охранно-пожарной сигнализации и безопасности?", position: 24 },
  { category: "PROBLEM_SOLUTION", templateKey: "problem_solve", text: "Как решить проблему: организация контроля доступа, используя системы охранно-пожарной сигнализации и безопасности?", position: 25 },
  { category: "PROBLEM_SOLUTION", templateKey: "problem_common", text: "Какие типовые проблемы возникают с системами охранно-пожарной сигнализации и безопасности и как их решают?", position: 26 },
  { category: "EXPERT_TECHNICAL", templateKey: "technical_requirements", text: "Какие технические требования предъявляются к системам охранно-пожарной сигнализации и безопасности для охраны промышленных объектов?", position: 27 },
  { category: "EXPERT_TECHNICAL", templateKey: "technical_specs", text: "Какие технические характеристики наиболее важны при оценке систем охранно-пожарной сигнализации и безопасности?", position: 28 },
  { category: "COMPETITOR", templateKey: "competitor_what_is", text: "Что известно о компании PERCo?", position: 29 },
  { category: "COMPETITOR", templateKey: "competitor_what_is", text: "Что известно о компании Sigur?", position: 30 },
  { category: "COMPETITOR", templateKey: "competitor_what_is", text: "Что известно о компании RusGuard?", position: 31 },
  { category: "COMPETITOR", templateKey: "competitor_products", text: "Какие продукты предлагает PERCo и как их оценивают?", position: 32 },
  { category: "COMPETITOR", templateKey: "competitor_products", text: "Какие продукты предлагает Sigur и как их оценивают?", position: 33 },
];

async function main() {
  const existing = await prisma.aiSearchAudit.findFirst({
    where: { brand: { contains: "Болид" } },
    include: { prompts: { orderBy: { position: "asc" } } },
  });

  const hash = computePromptSetHash(PROMPTS.map((p) => ({ text: p.text, enabled: true })));

  if (existing) {
    // Сохраняем существующие responses (baseline evidence) и бэкфиллим run #1
    const orphaned = await prisma.aiSearchResponse.findMany({
      where: { auditId: existing.id, runId: null },
      select: { id: true },
    });
    if (orphaned.length > 0) {
      const run = await prisma.aiSearchRun.create({
        data: {
          auditId: existing.id,
          runNumber: 1,
          mode: "chat",
          status: "COMPLETED",
          startedAt: existing.executedAt ?? undefined,
          completedAt: existing.completedAt ?? undefined,
          promptSetVersion: 1,
          promptSetHash: hash,
        },
      });
      await prisma.aiSearchResponse.updateMany({
        where: { auditId: existing.id, runId: null },
        data: { runId: run.id },
      });
      console.log("backfilled baseline run:", run.id, "responses:", orphaned.length);
    } else {
      console.log("audit exists, runs already assigned:", existing.id);
    }
    // Нормируем версию и хэш, если они ещё не проставлены
    await prisma.aiSearchAudit.update({
      where: { id: existing.id },
      data: {
        promptSetVersion: existing.promptSetVersion || 1,
        promptSetHash: existing.promptSetHash || hash,
      },
    });
    console.log("audit ready:", existing.id, "| prompts:", existing.prompts.length);
    return;
  }

  const company = await prisma.company.findFirst();

  const audit = await prisma.aiSearchAudit.create({
    data: {
      ...BOLID,
      sourceCompanyId: company?.id ?? null,
      status: "READY",
      promptCount: PROMPTS.length,
      promptSetVersion: 1,
      promptSetHash: hash,
      prompts: {
        create: PROMPTS.map((p) => ({
          category: p.category as never,
          templateKey: p.templateKey,
          text: p.text,
          position: p.position,
        })),
      },
    },
  });

  console.log("created audit:", audit.id, "| prompts:", PROMPTS.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
