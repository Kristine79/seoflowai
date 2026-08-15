import type { AiSearchPromptCategory } from "@/generated/prisma/enums";
import type { AuditConfig, PromptLanguage } from "./types";

export type GeneratedPrompt = {
  category: AiSearchPromptCategory;
  templateKey: string;
  text: string;
};

const MAX_LIST_ITEMS = 5;

/** Разбивает пользовательский список (product/competitor/use case) на строки. */
export function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  const items = value
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s, i, arr) => arr.indexOf(s) === i);
  return items.slice(0, MAX_LIST_ITEMS);
}

function ru(en: string, ruText: string) {
  return (lang: PromptLanguage) => (lang === "ru" ? ruText : en);
}

type Template = {
  category: AiSearchPromptCategory;
  key: string;
  build: (cfg: AuditConfig) => string[];
};

const L = ru;

const templates: Template[] = [
  // ── BRAND ─────────────────────────────────────────────
  {
    category: "BRAND",
    key: "brand_who",
    build: (cfg) => [
      L(`What do you know about ${cfg.brand}?`, `Что вы знаете о ${cfg.brand}?`)(cfg.promptLanguage),
    ],
  },
  {
    category: "BRAND",
    key: "brand_what_do_they_do",
    build: (cfg) => [
      L(`Who is ${cfg.brand} and what do they do?`, `Кто такой ${cfg.brand} и чем он занимается?`)(cfg.promptLanguage),
    ],
  },

  // ── PRODUCT ───────────────────────────────────────────
  {
    category: "PRODUCT",
    key: "product_offer",
    build: (cfg) => [
      L(
        `What products or solutions does ${cfg.brand} offer?`,
        `Какие продукты и решения предлагает ${cfg.brand}?`
      )(cfg.promptLanguage),
    ],
  },
  {
    category: "PRODUCT",
    key: "product_strengths",
    build: (cfg) => [
      L(
        `What are the strengths and weaknesses of ${cfg.brand}'s products?`,
        `Каковы сильные и слабые стороны продуктов ${cfg.brand}?`
      )(cfg.promptLanguage),
    ],
  },
  {
    category: "PRODUCT",
    key: "product_specific",
    build: (cfg) =>
      cfg.products.slice(0, 2).map((p) =>
        L(
          `What do people say about ${p} by ${cfg.brand}?`,
          `Что говорят о продукте «${p}» от ${cfg.brand}?`
        )(cfg.promptLanguage)
      ),
  },

  // ── CATEGORY ──────────────────────────────────────────
  {
    category: "CATEGORY",
    key: "category_best",
    build: (cfg) => {
      const cat = cfg.categoryPhrase || cfg.products[0] || "solutions";
      const market = cfg.market || "the market";
      return [
        L(
          `What are the best ${cat} solutions in ${market}?`,
          `Какие лучшие решения для ${cat} есть на рынке (${market})?`
        )(cfg.promptLanguage),
      ];
    },
  },
  {
    category: "CATEGORY",
    key: "category_recommended",
    build: (cfg) => {
      const cat = cfg.categoryPhrase || cfg.products[0] || "solutions";
      return [
        L(
          `Which ${cat} vendors are recommended by experts?`,
          `Каких поставщиков ${cat} рекомендуют эксперты?`
        )(cfg.promptLanguage),
      ];
    },
  },

  // ── BUYER INTENT ──────────────────────────────────────
  {
    category: "BUYER_INTENT",
    key: "buyer_consider",
    build: (cfg) => {
      const cat = cfg.categoryPhrase || cfg.products[0] || "solutions";
      return [
        L(
          `What should a company consider when choosing ${cat}?`,
          `Что компании стоит учитывать при выборе ${cat}?`
        )(cfg.promptLanguage),
      ];
    },
  },
  {
    category: "BUYER_INTENT",
    key: "buyer_reliable_vendor",
    build: (cfg) => {
      const cat = cfg.categoryPhrase || cfg.products[0] || "solutions";
      return [
        L(
          `How do I choose a reliable ${cat} vendor?`,
          `Как выбрать надёжного поставщика ${cat}?`
        )(cfg.promptLanguage),
      ];
    },
  },
  {
    category: "BUYER_INTENT",
    key: "buyer_use_case_criteria",
    build: (cfg) =>
      cfg.useCases.slice(0, 1).map((u) => {
        const cat = cfg.categoryPhrase || cfg.products[0] || "solutions";
        return L(
          `What criteria matter for ${u} when buying ${cat}?`,
          `Какие критерии важны для ${u} при покупке ${cat}?`
        )(cfg.promptLanguage);
      }),
  },

  // ── USE CASE ──────────────────────────────────────────
  {
    category: "USE_CASE",
    key: "use_case_suitable",
    build: (cfg) =>
      cfg.useCases.slice(0, 2).map((u) => {
        const cat = cfg.categoryPhrase || cfg.products[0] || "solutions";
        return L(
          `What ${cat} solution is suitable for ${u}?`,
          `Какое решение для ${cat} подходит для ${u}?`
        )(cfg.promptLanguage);
      }),
  },
  {
    category: "USE_CASE",
    key: "use_case_implement",
    build: (cfg) => {
      const cat = cfg.categoryPhrase || cfg.products[0] || "solutions";
      return [
        L(
          `How do companies implement ${cat} in practice?`,
          `Как компании на практике внедряют ${cat}?`
        )(cfg.promptLanguage),
      ];
    },
  },

  // ── COMPARISON ────────────────────────────────────────
  {
    category: "COMPARISON",
    key: "comparison_vs",
    build: (cfg) =>
      cfg.competitors.slice(0, MAX_LIST_ITEMS).map((c) =>
        L(`${cfg.brand} vs ${c}`, `${cfg.brand} или ${c}: что выбрать?`)(cfg.promptLanguage)
      ),
  },
  {
    category: "COMPARISON",
    key: "comparison_brand_vs",
    build: (cfg) => {
      const c = cfg.competitors[0];
      const u = cfg.useCases[0];
      if (!c) return [];
      return [
        L(
          `Compare ${cfg.brand} and ${c}${u ? ` for ${u}` : ""}.`,
          `Сравните ${cfg.brand} и ${c}${u ? ` для ${u}` : ""}.`
        )(cfg.promptLanguage),
      ];
    },
  },

  // ── ALTERNATIVES ──────────────────────────────────────
  {
    category: "ALTERNATIVES",
    key: "alternatives_to_competitor",
    build: (cfg) =>
      cfg.competitors.slice(0, 3).map((c) =>
        L(`What are alternatives to ${c}?`, `Какие есть альтернативы ${c}?`)(cfg.promptLanguage)
      ),
  },
  {
    category: "ALTERNATIVES",
    key: "alternatives_to_brand",
    build: (cfg) => [
      L(
        `Are there alternatives to ${cfg.brand}? If so, which ones?`,
        `Существуют ли альтернативы ${cfg.brand}? Если да, какие?`
      )(cfg.promptLanguage),
    ],
  },

  // ── PROBLEM / SOLUTION ────────────────────────────────
  {
    category: "PROBLEM_SOLUTION",
    key: "problem_solve",
    build: (cfg) =>
      cfg.problems.slice(0, 2).map((p) => {
        const cat = cfg.categoryPhrase || cfg.products[0] || "solutions";
        return L(
          `How to solve ${p} with ${cat}?`,
          `Как решить проблему: ${p}, используя ${cat}?`
        )(cfg.promptLanguage);
      }),
  },
  {
    category: "PROBLEM_SOLUTION",
    key: "problem_common",
    build: (cfg) => {
      const cat = cfg.categoryPhrase || cfg.products[0] || "solutions";
      return [
        L(
          `What common problems occur with ${cat} and how are they fixed?`,
          `Какие типовые проблемы возникают с ${cat} и как их решают?`
        )(cfg.promptLanguage),
      ];
    },
  },

  // ── EXPERT / TECHNICAL ────────────────────────────────
  {
    category: "EXPERT_TECHNICAL",
    key: "technical_requirements",
    build: (cfg) => {
      const cat = cfg.categoryPhrase || cfg.products[0] || "solutions";
      const u = cfg.useCases[0];
      return [
        L(
          `What technical requirements apply to ${cat}${u ? ` for ${u}` : ""}?`,
          `Какие технические требования предъявляются к ${cat}${u ? ` для ${u}` : ""}?`
        )(cfg.promptLanguage),
      ];
    },
  },
  {
    category: "EXPERT_TECHNICAL",
    key: "technical_specs",
    build: (cfg) => {
      const cat = cfg.categoryPhrase || cfg.products[0] || "solutions";
      return [
        L(
          `What technical specifications matter most when evaluating ${cat}?`,
          `Какие технические характеристики наиболее важны при оценке ${cat}?`
        )(cfg.promptLanguage),
      ];
    },
  },

  // ── COMPETITOR ────────────────────────────────────────
  {
    category: "COMPETITOR",
    key: "competitor_what_is",
    build: (cfg) =>
      cfg.competitors.slice(0, 3).map((c) =>
        L(`What is known about ${c}?`, `Что известно о компании ${c}?`)(cfg.promptLanguage)
      ),
  },
  {
    category: "COMPETITOR",
    key: "competitor_products",
    build: (cfg) =>
      cfg.competitors.slice(0, 2).map((c) =>
        L(
          `What products does ${c} offer and how are they rated?`,
          `Какие продукты предлагает ${c} и как их оценивают?`
        )(cfg.promptLanguage)
      ),
  },
];

/** Генерирует набор промптов из конфигурации аудита. Определимо, без случайности. */
export function generatePrompts(cfg: AuditConfig): GeneratedPrompt[] {
  const out: GeneratedPrompt[] = [];
  for (const t of templates) {
    for (const text of t.build(cfg)) {
      if (text && text.includes("undefined")) continue;
      out.push({ category: t.category, templateKey: t.key, text });
    }
  }
  return out;
}