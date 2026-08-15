import type { RunComparison, RunLike, ResponseLike, PositioningKey, PositioningResult } from "./types";
import { POSITIONING_KEYS, parsePositioning } from "./positioning";
import { classifySource, type SourceContext } from "./sources";

const pct = (a: number | null, b: number | null): number | null => {
  if (a === null || b === null) return null;
  return Math.round((b - a) * 10) / 10;
};

type Row = {
  responseId: string;
  promptId: string;
  promptText: string | null;
  brandMentioned: boolean;
  recommended: boolean;
  position: number | null;
  competitorNames: string[];
  sources: { domain: string; sourceType: string | null }[];
  positioning: PositioningResult | null;
};

function toRows(likes: ResponseLike[], ctx: SourceContext): Row[] {
  return likes
    .filter((r) => r.status === "SUCCESS")
    .map((r) => {
      const sources: { domain: string; sourceType: string | null }[] = [];
      for (const c of r.structuredCitations ?? []) {
        const domain = c.domain ?? "";
        if (!domain) continue;
        const cls = classifySource(domain, ctx);
        sources.push({ domain, sourceType: cls.sourceType });
      }
      for (const d of r.sourceDomains ?? []) {
        const cls = classifySource(d, ctx);
        sources.push({ domain: d, sourceType: cls.sourceType });
      }
      return {
        responseId: r.id,
        promptId: r.promptId,
        promptText: r.promptText,
        brandMentioned: r.brandMentioned,
        recommended: r.recommended,
        position: r.recommendationPosition,
        competitorNames: r.competitorNames,
        sources,
        positioning: parsePositioning(r.positioning ?? null),
      };
    });
}

function phraseCounts(rows: Row[], key: PositioningKey): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (!r.positioning) continue;
    for (const p of r.positioning[key] ?? []) {
      const l = p.toLowerCase();
      map.set(l, (map.get(l) ?? 0) + 1);
    }
  }
  return map;
}

/**
 * Сравнение двух runs. Все формулировки — «observed change»,
 * без причинных утверждений («SEOFlow улучшил…», «контент увеличил…»).
 */
export function compareRuns(
  runA: RunLike | null,
  runB: RunLike | null,
  likesA: ResponseLike[],
  likesB: ResponseLike[],
  sourceCtx: SourceContext | null
): RunComparison {
  const cmp = (a: number | null, b: number | null) => ({ before: a, after: b, change: pct(a, b) });

  const ctx: SourceContext = sourceCtx ?? {
    officialDomain: null,
    competitorDomains: [],
    brand: "",
    competitors: [],
  };
  const rowsA = toRows(likesA, ctx);
  const rowsB = toRows(likesB, ctx);
  const successA = rowsA.length;
  const successB = rowsB.length;

  const rate = (rows: Row[], f: (r: Row) => boolean): number | null =>
    rows.length ? Math.round((rows.filter(f).length / rows.length) * 1000) / 10 : null;

  const mentionA = rate(rowsA, (r) => r.brandMentioned);
  const mentionB = rate(rowsB, (r) => r.brandMentioned);
  const recA = rate(rowsA, (r) => r.recommended);
  const recB = rate(rowsB, (r) => r.recommended);
  const citeA = rate(rowsA, (r) => r.sources.length > 0);
  const citeB = rate(rowsB, (r) => r.sources.length > 0);

  const officialA = rowsA.reduce((acc, r) => acc + r.sources.filter((s) => s.sourceType === "official").length, 0);
  const officialB = rowsB.reduce((acc, r) => acc + r.sources.filter((s) => s.sourceType === "official").length, 0);
  const compSourceA = rowsA.reduce((acc, r) => acc + r.sources.filter((s) => s.sourceType === "competitor").length, 0);
  const compSourceB = rowsB.reduce((acc, r) => acc + r.sources.filter((s) => s.sourceType === "competitor").length, 0);
  const indSourceA = rowsA.reduce((acc, r) => acc + r.sources.filter((s) => s.sourceType === "industry").length, 0);
  const indSourceB = rowsB.reduce((acc, r) => acc + r.sources.filter((s) => s.sourceType === "industry").length, 0);

  const totalSrcA = rowsA.reduce((acc, r) => acc + r.sources.length, 0);
  const totalSrcB = rowsB.reduce((acc, r) => acc + r.sources.length, 0);
  const officialRateA = totalSrcA > 0 ? Math.round((officialA / totalSrcA) * 1000) / 10 : null;
  const officialRateB = totalSrcB > 0 ? Math.round((officialB / totalSrcB) * 1000) / 10 : null;

  const top3 = (rows: Row[]): number | null =>
    rows.length
      ? Math.round(
          (rows.filter((r) => r.recommended && r.position !== null && r.position <= 3).length / rows.length) * 1000
        ) / 10
      : null;

  const compOnlyA = rowsA.filter((r) => r.competitorNames.length > 0 && !r.brandMentioned).length;
  const compOnlyB = rowsB.filter((r) => r.competitorNames.length > 0 && !r.brandMentioned).length;

  // intent-level (by category)
  const categories = ["BRAND", "PRODUCT", "CATEGORY", "BUYER_INTENT", "USE_CASE", "COMPARISON", "ALTERNATIVES", "PROBLEM_SOLUTION", "EXPERT_TECHNICAL", "COMPETITOR"];
  const intent: RunComparison["intent"] = [];
  for (const cat of categories) {
    const a = likesA.filter((r) => r.status === "SUCCESS" && r.category === cat);
    const b = likesB.filter((r) => r.status === "SUCCESS" && r.category === cat);
    if (a.length === 0 && b.length === 0) continue;
    intent.push({
      category: cat,
      before: { mentioned: a.filter((r) => r.brandMentioned).length, total: a.length },
      after: { mentioned: b.filter((r) => r.brandMentioned).length, total: b.length },
      change: b.filter((r) => r.brandMentioned).length - a.filter((r) => r.brandMentioned).length,
    });
  }

  // sources
  const countsA = new Map<string, number>();
  const countsB = new Map<string, number>();
  const typeOf = new Map<string, string>();
  for (const r of rowsA)
    for (const s of r.sources) {
      if (!s.domain || s.domain === "null") continue;
      countsA.set(s.domain, (countsA.get(s.domain) ?? 0) + 1);
      if (s.sourceType) typeOf.set(s.domain, s.sourceType);
    }
  for (const r of rowsB)
    for (const s of r.sources) {
      if (!s.domain || s.domain === "null") continue;
      countsB.set(s.domain, (countsB.get(s.domain) ?? 0) + 1);
      if (s.sourceType) typeOf.set(s.domain, s.sourceType);
    }
  const newDomains = Array.from(countsB.keys())
    .filter((d) => !countsA.has(d))
    .map((d) => ({ domain: d, countAfter: countsB.get(d)! }))
    .sort((a, b) => b.countAfter - a.countAfter);
  const disappearedDomains = Array.from(countsA.keys())
    .filter((d) => !countsB.has(d))
    .map((d) => ({ domain: d, countBefore: countsA.get(d)! }))
    .sort((a, b) => b.countBefore - a.countBefore);
  const repeatedDomains = Array.from(countsB.keys())
    .filter((d) => countsA.has(d))
    .map((d) => ({
      domain: d,
      countBefore: countsA.get(d)!,
      countAfter: countsB.get(d)!,
      change: countsB.get(d)! - countsA.get(d)!,
    }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  // positioning phrases
  const phrasesA = new Map<string, number>();
  const phrasesB = new Map<string, number>();
  for (const key of POSITIONING_KEYS) {
    for (const [p, c] of phraseCounts(rowsA, key)) phrasesA.set(p, (phrasesA.get(p) ?? 0) + c);
    for (const [p, c] of phraseCounts(rowsB, key)) phrasesB.set(p, (phrasesB.get(p) ?? 0) + c);
  }
  const newPhrases = Array.from(phrasesB.keys())
    .filter((p) => !phrasesA.has(p))
    .map((p) => ({ phrase: p, countAfter: phrasesB.get(p)! }))
    .sort((a, b) => b.countAfter - a.countAfter)
    .slice(0, 25);
  const removedPhrases = Array.from(phrasesA.keys())
    .filter((p) => !phrasesB.has(p))
    .map((p) => ({ phrase: p, countBefore: phrasesA.get(p)! }))
    .sort((a, b) => b.countBefore - a.countBefore)
    .slice(0, 25);
  const increased = Array.from(phrasesB.keys())
    .filter((p) => phrasesA.has(p) && phrasesB.get(p)! > phrasesA.get(p)!)
    .map((p) => ({ phrase: p, before: phrasesA.get(p)!, after: phrasesB.get(p)!, change: phrasesB.get(p)! - phrasesA.get(p)! }))
    .sort((a, b) => b.change - a.change)
    .slice(0, 20);
  const decreased = Array.from(phrasesA.keys())
    .filter((p) => phrasesB.has(p) && phrasesB.get(p)! < phrasesA.get(p)!)
    .map((p) => ({ phrase: p, before: phrasesA.get(p)!, after: phrasesB.get(p)!, change: phrasesB.get(p)! - phrasesA.get(p)! }))
    .sort((a, b) => a.change - b.change)
    .slice(0, 20);

  const providerChanged =
    !!runA && !!runB && (runA.mode !== runB.mode || runA.providers.join(",") !== runB.providers.join(","));
  const promptSetCompatible =
    !!runA && !!runB && !!runA.promptSetHash && !!runB.promptSetHash && runA.promptSetHash === runB.promptSetHash;

  return {
    runA: runA
      ? { runNumber: runA.runNumber, mode: runA.mode, providers: runA.providers, total: runA.total, date: runA.completedAt ? runA.completedAt.toISOString() : null }
      : null,
    runB: runB
      ? { runNumber: runB.runNumber, mode: runB.mode, providers: runB.providers, total: runB.total, date: runB.completedAt ? runB.completedAt.toISOString() : null }
      : null,
    promptSetCompatible,
    providerChanged,
    metrics: {
      mentionRate: cmp(mentionA, mentionB),
      recommendationRate: cmp(recA, recB),
      top3Rate: cmp(top3(rowsA), top3(rowsB)),
      citationRate: cmp(citeA, citeB),
      officialSourceRate: cmp(officialRateA, officialRateB),
      competitorOnlyCount: { before: compOnlyA, after: compOnlyB, change: compOnlyB - compOnlyA },
    },
    intent,
    sources: {
      newDomains,
      disappearedDomains,
      repeatedDomains,
      officialMentions: { before: officialA, after: officialB, change: officialB - officialA },
      competitorMentions: { before: compSourceA, after: compSourceB, change: compSourceB - compSourceA },
      industryMentions: { before: indSourceA, after: indSourceB, change: indSourceB - indSourceA },
      officialDomain: ctx.officialDomain,
    },
    positioning: { newPhrases, removedPhrases, increased, decreased },
  };
}
