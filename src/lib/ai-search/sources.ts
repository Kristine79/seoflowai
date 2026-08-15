import type { AiCitation } from "@/lib/automation/ai-client";

export type SourceType =
  | "official"
  | "competitor"
  | "industry"
  | "documentation"
  | "review"
  | "community"
  | "media"
  | "other";

export type NormalizedSource = {
  url: string | null;
  domain: string;
  title: string | null;
  sourceType: SourceType;
  isOfficial: boolean;
  isCompetitor: boolean;
  isIndustry: boolean;
  /** Фрагмент ответа, на который ссылается citation (если провайдер дал span). */
  citationText: string | null;
};

export type SourceContext = {
  officialDomain: string | null;
  competitorDomains: string[];
  brand: string;
  competitors: string[];
};

export function toSourceContext(cfg: {
  website?: string | null;
  brand: string;
  competitors: string[];
}): SourceContext {
  let officialDomain: string | null = null;
  if (cfg.website) {
    try {
      officialDomain = new URL(
        cfg.website.includes("://") ? cfg.website : `https://${cfg.website}`
      ).hostname.replace(/^www\./, "");
    } catch {
      officialDomain = null;
    }
  }
  return {
    officialDomain,
    competitorDomains: cfg.competitors
      .map((c) => `${c.toLowerCase().replace(/[^a-zа-яё0-9.]+/gi, "").replace(/^(www\.|https?:\/\/)/, "")}`)
      .filter((s) => s.length >= 4),
    brand: cfg.brand,
    competitors: cfg.competitors,
  };
}

export function extractDomain(urlOrName: string): string {
  const t = urlOrName.trim();
  if (/^https?:\/\//i.test(t) || t.includes("://")) {
    try {
      return new URL(t).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      /* fallthrough */
    }
  }
  const bare = t.toLowerCase().replace(/^www\./, "").replace(/[/?#].*$/, "");
  if (bare.includes(".")) return bare;
  return bare;
}

function slugifyKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]/gi, "")
    .trim();
}

/**
 * Детерминированная rule-based классификация источников.
 * LLM-метки не являются источником истины: правила имеют приоритет,
 * при невозможности определить тип возвращается "other".
 */
export function classifySource(
  domain: string,
  ctx: SourceContext
): { sourceType: SourceType; isOfficial: boolean; isCompetitor: boolean; isIndustry: boolean } {
  const d = domain.toLowerCase().replace(/^www\./, "");

  // 1. official — домен бренда или поддомен
  if (ctx.officialDomain) {
    const off = ctx.officialDomain.replace(/^www\./, "");
    if (d === off || d.endsWith(`.${off}`)) {
      return { sourceType: "official", isOfficial: true, isCompetitor: false, isIndustry: false };
    }
  }

  // 2. competitor — домен совпадает/начинается с ключа конкурента
  const dKey = d.replace(/\.(ru|com|net|org|info|io|su|рф)$/, "");
  for (const cd of ctx.competitorDomains) {
    const k = slugifyKey(cd).replace(/\.(ru|com|net|org|info|io|su|рф)$/, "");
    if (k && k.length >= 3) {
      if (dKey.startsWith(k) || k.startsWith(dKey)) {
        return { sourceType: "competitor", isOfficial: false, isCompetitor: true, isIndustry: false };
      }
    }
  }
  // сопоставление по имени конкурента (домен вида perco.ru для PERCo)
  for (const name of ctx.competitors) {
    const k = slugifyKey(name);
    if (k && k.length >= 3 && (dKey === k || dKey.startsWith(k))) {
      return { sourceType: "competitor", isOfficial: false, isCompetitor: true, isIndustry: false };
    }
  }

  // 3. community
  if (/(^|\.)(reddit|github|stackoverflow|habr|vc|pikabu|forum|4pda|pikabu)\./i.test(d) || /wiki|cyclowiki/.test(d)) {
    return { sourceType: "community", isOfficial: false, isCompetitor: false, isIndustry: false };
  }

  // 4. documentation
  if (/^(docs|wiki|help|support|developers|learn|manual)\b|wikipedia\.org|github\.io/.test(d)) {
    return { sourceType: "documentation", isOfficial: false, isCompetitor: false, isIndustry: false };
  }

  // 5. review-платформы
  if (/(otzovik|irecommend|trustpilot|yelp|zoon|flamp|otzyvru|yell)\./i.test(d)) {
    return { sourceType: "review", isOfficial: false, isCompetitor: false, isIndustry: false };
  }

  // 6. media
  if (/(rbc|kommersant|ria|tass|interfax|vedomosti|forbes|cnews|tadviser|securitylab|youtube\.com|dzen\.ru)/i.test(d)) {
    return { sourceType: "media", isOfficial: false, isCompetitor: false, isIndustry: false };
  }

  // 7. industry — реестры бизнеса, отраслевые каталоги и площадки интеграторов
  if (/(rusprofile|vbr\.ru|kontragent|checko|zachestnyibiznes|unitest|unitrex|rubytech|integratech|securpress|safepoint|t-save|tbank|money|banki|market|catalog|catalogue|shop|price|kupit|layta)/i.test(d)) {
    return { sourceType: "industry", isOfficial: false, isCompetitor: false, isIndustry: true };
  }

  return { sourceType: "other", isOfficial: false, isCompetitor: false, isIndustry: false };
}

/** Нормализация одного citation, возвращённого провайдером. */
export function normalizeCitation(cit: AiCitation, raw: string, ctx: SourceContext): NormalizedSource | null {
  if (!cit.url) return null;
  const domain = extractDomain(cit.url);
  if (!domain) return null;
  const cls = classifySource(domain, ctx);
  const citationText =
    cit.startIndex !== null && cit.endIndex !== null
      ? raw.slice(cit.startIndex, cit.endIndex).trim() || null
      : null;
  return {
    url: cit.url,
    domain,
    title: cit.title,
    sourceType: cls.sourceType,
    isOfficial: cls.isOfficial,
    isCompetitor: cls.isCompetitor,
    isIndustry: cls.isIndustry,
    citationText,
  };
}

/** Нормализация source, найденного в тексте ответа analysis-шагом. */
export function normalizeTextSource(
  s: { name: string | null; domain: string | null; url: string | null; official: boolean; brandRelated: boolean; competitorRelated: boolean },
  ctx: SourceContext
): NormalizedSource | null {
  const domain = s.domain ?? (s.url ? extractDomain(s.url) : null);
  if (!domain) return null;
  const cls = classifySource(domain, ctx);
  return {
    url: s.url,
    domain,
    title: s.name,
    sourceType: cls.sourceType,
    isOfficial: s.official || cls.isOfficial,
    isCompetitor: s.competitorRelated || cls.isCompetitor,
    isIndustry: cls.isIndustry,
    citationText: null,
  };
}

export type SourceAggregate = {
  domain: string;
  sourceType: SourceType;
  url: string | null;
  title: string | null;
  appearances: number;
  isOfficial: boolean;
  isCompetitor: boolean;
  isIndustry: boolean;
  /** Промпты, где появился источник. */
  prompts: { promptId: string; promptText: string | null; responseId: string }[];
  /** Бренды/конкуренты, связанные с источником. */
  related: string[];
};
