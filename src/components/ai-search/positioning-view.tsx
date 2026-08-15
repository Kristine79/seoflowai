"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { AuditDetail } from "./shared";
import { POSITIONING_LABELS } from "@/lib/ai-search/positioning";
import type { PositioningKey } from "@/lib/ai-search/types";

type Props = {
  audit: AuditDetail;
  refresh: () => void;
};

type PhraseStat = {
  phrase: string;
  count: number;
  percentage: number | null;
  prompts: { promptId: string; promptText: string | null; responseId: string }[];
};

type PositioningData = {
  labels: Record<string, string>;
  keys: string[];
  run: { runNumber: number; mode: string; providers: string[]; total: number } | null;
  brand: {
    entity: string;
    mentionCount: number;
    byKey: Partial<Record<PositioningKey, PhraseStat[]>>;
  };
  competitors: {
    entity: string;
    mentions: number;
    topDescriptions: PhraseStat[];
    topProducts: PhraseStat[];
    topUseCases: PhraseStat[];
    topTechnical: PhraseStat[];
    topRecurring: PhraseStat[];
    topBuyerCriteria: PhraseStat[];
  }[];
  gaps: {
    type: string;
    item: string;
    severity: string;
    title: string;
    description: string;
    evidence: { promptIds: string[]; responseIds: string[]; stats: string };
  }[];
  backfillMissing: number;
};

export function PositioningView({ audit, refresh }: Props) {
  const [backfilling, setBackfilling] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery<PositioningData>({
    queryKey: ["ai-search-positioning", audit.id],
    queryFn: async () => {
      const res = await fetch(`/api/ai-search/${audit.id}/positioning`);
      if (!res.ok) throw new Error("Failed to load positioning");
      return res.json();
    },
    retry: 2,
  });

  const backfill = async () => {
    setBackfilling(true);
    await fetch(`/api/ai-search/${audit.id}/positioning`, { method: "POST" });
    setBackfilling(false);
    refresh();
  };

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="font-medium">Не удалось загрузить positioning</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  const brand = data.brand;
  const hasData = brand.mentionCount > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          AI Positioning — как AI описывает бренд в рамках данного набора промптов (run #
          {data.run?.runNumber ?? "—"}). Извлекается только то, что реально присутствует в raw
          responses. Это не «официальное позиционирование».
        </p>
        {data.backfillMissing > 0 && (
          <Button variant="outline" size="sm" onClick={backfill} disabled={backfilling} className="gap-1.5">
            {backfilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Извлечь positioning ({data.backfillMissing} ответов)
          </Button>
        )}
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">Positioning data not yet available</p>
            <p className="mt-1 text-sm text-zinc-500">
              {data.backfillMissing > 0
                ? "Запустите извлечение positioning — оно выполнит реальные AI-запросы по raw responses."
                : "Аудит ещё не выполнен."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Brand positioning */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Positioning — «How AI describes the brand»</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-zinc-500">
                Бренд упомянут в <span className="font-semibold">{brand.mentionCount}</span> ответах.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {(["categoryAssociations", "productAssociations", "useCases", "technicalTerms", "buyerCriteria", "brandDescriptions", "recurringPhrases", "differentiators"] as PositioningKey[]).map((key) => (
                  <PhraseList key={key} title={POSITIONING_LABELS[key]} stats={brand.byKey[key] ?? []} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competitor positioning */}
          {data.competitors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Competitor Positioning — «Observed AI positioning»</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {data.competitors.map((c) => (
                  <div key={c.entity}>
                    <div className="mb-2 flex items-center gap-2">
                      <h4 className="font-semibold">{c.entity}</h4>
                      <Badge variant="secondary">{c.mentions} упоминаний</Badge>
                      <span className="text-xs text-zinc-400">Observed AI positioning (не официальное)</span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <PhraseList title="Описания" stats={c.topDescriptions} />
                      <PhraseList title="Продукты" stats={c.topProducts} />
                      <PhraseList title="Use cases" stats={c.topUseCases} />
                      <PhraseList title="Технические" stats={c.topTechnical} />
                      <PhraseList title="Повторяющиеся" stats={c.topRecurring} />
                      <PhraseList title="Критерии покупателя" stats={c.topBuyerCriteria} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Brand vs competitor table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand vs Competitors</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-xs text-zinc-400">
                    <th className="py-2 pr-4 font-medium">Entity</th>
                    <th className="py-2 pr-4 font-medium">Top category</th>
                    <th className="py-2 pr-4 font-medium">Top product associations</th>
                    <th className="py-2 pr-4 font-medium">Top use cases</th>
                    <th className="py-2 pr-4 font-medium">Top technical terms</th>
                    <th className="py-2 font-medium">Top recurring descriptions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="py-3 pr-4 font-semibold text-zinc-900">{audit.brand}</td>
                    <TopCell stats={brand.byKey.categoryAssociations ?? []} />
                    <TopCell stats={brand.byKey.productAssociations ?? []} />
                    <TopCell stats={brand.byKey.useCases ?? []} />
                    <TopCell stats={brand.byKey.technicalTerms ?? []} />
                    <TopCell stats={brand.byKey.recurringPhrases ?? []} />
                  </tr>
                  {data.competitors.map((c) => (
                    <tr key={c.entity}>
                      <td className="py-3 pr-4 font-medium text-zinc-800">{c.entity}</td>
                      <TopCell stats={c.topDescriptions} />
                      <TopCell stats={c.topProducts} />
                      <TopCell stats={c.topUseCases} />
                      <TopCell stats={c.topTechnical} />
                      <TopCell stats={c.topRecurring} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Positioning gaps */}
          {data.gaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Positioning Gaps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.gaps.map((g) => (
                  <div key={`${g.type}-${g.item}`} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      {g.title}
                    </p>
                    <p className="mt-1 text-sm text-amber-700">{g.description}</p>
                    <p className="mt-1 text-xs text-amber-600">Evidence: {g.evidence.stats}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function PhraseList({ title, stats }: { title: string; stats: PhraseStat[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <p className="border-b border-zinc-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </p>
      {stats.length === 0 ? (
        <p className="px-3 py-3 text-sm text-zinc-400">Не обнаружено</p>
      ) : (
        <ul className="divide-y divide-zinc-50">
          {stats.slice(0, 8).map((s) => (
            <li key={s.phrase} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
              <span className="truncate text-zinc-700">{s.phrase}</span>
              <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                {s.count}
                {s.percentage !== null ? ` · ${s.percentage}%` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TopCell({ stats }: { stats: PhraseStat[] }) {
  return (
    <td className="py-3 pr-4">
      {stats.length === 0 ? (
        <span className="text-zinc-300">—</span>
      ) : (
        <ul className="space-y-0.5">
          {stats.slice(0, 3).map((s) => (
            <li key={s.phrase} className="text-xs text-zinc-600">
              {s.phrase} <span className="text-zinc-400">({s.count})</span>
            </li>
          ))}
        </ul>
      )}
    </td>
  );
}
