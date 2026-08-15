"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import type { AuditDetail, RunLike } from "./shared";
import { fmtDate } from "./shared";
import { PROMPT_CATEGORY_LABELS } from "@/lib/ai-search/types";

type Props = { audit: AuditDetail };

type Comparison = {
  runA: { runNumber: number; mode: string; providers: string[]; total: number; date: string | null } | null;
  runB: { runNumber: number; mode: string; providers: string[]; total: number; date: string | null } | null;
  promptSetCompatible: boolean;
  providerChanged: boolean;
  metrics: Record<
    string,
    { before: number | null; after: number | null; change: number | null } | { before: number; after: number; change: number }
  >;
  intent: { category: string; before: { mentioned: number; total: number }; after: { mentioned: number; total: number }; change: number }[];
  sources: {
    newDomains: { domain: string; countAfter: number }[];
    disappearedDomains: { domain: string; countBefore: number }[];
    repeatedDomains: { domain: string; countBefore: number; countAfter: number; change: number }[];
    officialMentions: { before: number; after: number; change: number };
    competitorMentions: { before: number; after: number; change: number };
    industryMentions: { before: number; after: number; change: number };
    officialDomain: string | null;
  };
  positioning: {
    newPhrases: { phrase: string; countAfter: number }[];
    removedPhrases: { phrase: string; countBefore: number }[];
    increased: { phrase: string; before: number; after: number; change: number }[];
    decreased: { phrase: string; before: number; after: number; change: number }[];
  };
};

const fmtPct = (v: number | null) => (v === null ? "—" : `${v}%`);

export function RunsView({ audit }: Props) {
  const runs = (audit.runs ?? []).filter((r) => r.total > 0).sort((a, b) => a.runNumber - b.runNumber);
  const [runAId, setRunAId] = useState<string>(() => runs[0]?.id ?? "");
  const [runBId, setRunBId] = useState<string>(() => runs[runs.length - 1]?.id ?? "");

  const { data: comparison, isLoading } = useQuery<Comparison>({
    queryKey: ["ai-search-compare", audit.id, runAId, runBId],
    queryFn: async () => {
      const res = await fetch(`/api/ai-search/${audit.id}/compare?runA=${runAId}&runB=${runBId}`);
      if (!res.ok) throw new Error("Compare failed");
      return res.json();
    },
    enabled: !!runAId && !!runBId && runAId !== runBId,
  });

  const byNumber = useMemo(() => {
    const m = new Map<number, RunLike>();
    for (const r of runs) m.set(r.runNumber, r);
    return m;
  }, [runs]);

  if (runs.length < 2) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-medium">Для сравнения нужно минимум 2 запуска</p>
          <p className="mt-1 text-sm text-zinc-500">
            Запустите аудит повторно (или через «Run verification» в Обзоре) — после этого здесь
            появится сравнение runs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Сравнение запусков</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Run A (before)</label>
              <select
                value={runAId}
                onChange={(e) => setRunAId(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
              >
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    Run #{r.runNumber} · {r.mode} · {fmtDate(r.completedAt ?? r.startedAt)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Run B (after)</label>
              <select
                value={runBId}
                onChange={(e) => setRunBId(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
              >
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    Run #{r.runNumber} · {r.mode} · {fmtDate(r.completedAt ?? r.startedAt)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {comparison?.providerChanged && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Provider/mode изменился между runs — сравнение только как «observed change», без
              причинных выводов.
            </div>
          )}
          {comparison && !comparison.promptSetCompatible && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Prompt set changed — direct comparison may be unreliable.
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
        </div>
      ) : (
        comparison && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observed changes — metrics</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs text-zinc-400">
                      <th className="py-2 pr-4 font-medium">Метрика</th>
                      <th className="py-2 pr-4 font-medium">Before (Run #{comparison.runA?.runNumber})</th>
                      <th className="py-2 pr-4 font-medium">After (Run #{comparison.runB?.runNumber})</th>
                      <th className="py-2 font-medium">Observed change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <MetricRow label="Mention Rate" v={comparison.metrics.mentionRate} pct />
                    <MetricRow label="Recommendation Rate" v={comparison.metrics.recommendationRate} pct />
                    <MetricRow label="Top-3 Rate" v={comparison.metrics.top3Rate} pct />
                    <MetricRow label="Citation Rate" v={comparison.metrics.citationRate} pct />
                    <MetricRow label="Official Source Rate" v={comparison.metrics.officialSourceRate} pct />
                    <MetricRow label="Competitor-only responses" v={comparison.metrics.competitorOnlyCount} />
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-zinc-400">
                  «Observed change» — разница в рамках данного набора промптов. Не утверждение о причине.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Intent-level comparison</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs text-zinc-400">
                      <th className="py-2 pr-4 font-medium">Категория</th>
                      <th className="py-2 pr-4 font-medium">Before</th>
                      <th className="py-2 pr-4 font-medium">After</th>
                      <th className="py-2 font-medium">Observed change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {comparison.intent.map((i) => (
                      <tr key={i.category}>
                        <td className="py-2.5 pr-4 font-medium text-zinc-800">
                          {PROMPT_CATEGORY_LABELS[i.category] ?? i.category}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums text-zinc-600">
                          {i.before.mentioned}/{i.before.total}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums text-zinc-600">
                          {i.after.mentioned}/{i.after.total}
                        </td>
                        <td className="py-2.5">
                          <ChangeBadge value={i.change} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observed source changes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <SourceDelta label="Official mentions" d={comparison.sources.officialMentions} />
                  <SourceDelta label="Competitor mentions" d={comparison.sources.competitorMentions} />
                  <SourceDelta label="Industry mentions" d={comparison.sources.industryMentions} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <DeltaList
                    title={`New sources (${comparison.sources.newDomains.length})`}
                    items={comparison.sources.newDomains.map((d) => ({ label: d.domain, value: `${d.countAfter} mentions` }))}
                  />
                  <DeltaList
                    title={`Disappeared sources (${comparison.sources.disappearedDomains.length})`}
                    items={comparison.sources.disappearedDomains.map((d) => ({ label: d.domain, value: `${d.countBefore} mentions` }))}
                  />
                  <DeltaList
                    title={`Repeated sources (${comparison.sources.repeatedDomains.length})`}
                    items={comparison.sources.repeatedDomains.slice(0, 10).map((d) => ({
                      label: d.domain,
                      value: `${d.countBefore} → ${d.countAfter} (${d.change >= 0 ? "+" : ""}${d.change})`,
                    }))}
                  />
                </div>
                {comparison.sources.officialDomain && (
                  <p className="text-sm text-zinc-500">
                    Official domain: <span className="font-semibold">{comparison.sources.officialDomain}</span> — observed
                    source change, не причинный вывод.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observed positioning changes</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <DeltaList
                  title={`New phrases (${comparison.positioning.newPhrases.length})`}
                  items={comparison.positioning.newPhrases.slice(0, 12).map((p) => ({ label: p.phrase, value: `${p.countAfter} mentions` }))}
                />
                <DeltaList
                  title={`Removed phrases (${comparison.positioning.removedPhrases.length})`}
                  items={comparison.positioning.removedPhrases.slice(0, 12).map((p) => ({ label: p.phrase, value: `${p.countBefore} mentions` }))}
                />
                <DeltaList
                  title="Increased frequency"
                  items={comparison.positioning.increased.slice(0, 12).map((p) => ({
                    label: p.phrase,
                    value: `${p.before} → ${p.after} (observed +${p.change})`,
                  }))}
                  tone="emerald"
                />
                <DeltaList
                  title="Decreased frequency"
                  items={comparison.positioning.decreased.slice(0, 12).map((p) => ({
                    label: p.phrase,
                    value: `${p.before} → ${p.after} (observed ${p.change})`,
                  }))}
                  tone="rose"
                />
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  );
}

function MetricRow({
  label,
  v,
  pct,
}: {
  label: string;
  v: { before: number | null; after: number | null; change: number | null } | { before: number; after: number; change: number };
  pct?: boolean;
}) {
  const fmt = (n: number | null) => (n === null ? "—" : pct ? `${n}%` : String(n));
  const change = v.change as number | null;
  return (
    <tr>
      <td className="py-2.5 pr-4 font-medium text-zinc-800">{label}</td>
      <td className="py-2.5 pr-4 tabular-nums text-zinc-600">{fmt(v.before)}</td>
      <td className="py-2.5 pr-4 tabular-nums text-zinc-600">{fmt(v.after)}</td>
      <td className="py-2.5">
        <ChangeBadge value={change} />
      </td>
    </tr>
  );
}

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-zinc-400">—</span>;
  const positive = value > 0;
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
        value === 0 ? "bg-zinc-100 text-zinc-500" : positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {positive ? "+" : ""}
      {value}
    </span>
  );
}

function SourceDelta({ label, d }: { label: string; d: { before: number; after: number; change: number } }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-zinc-900">
        {d.before} → {d.after}
      </p>
      <p className="text-xs text-zinc-400">observed {d.change >= 0 ? "+" : ""}{d.change}</p>
    </div>
  );
}

function DeltaList({
  title,
  items,
  tone,
}: {
  title: string;
  items: { label: string; value: string }[];
  tone?: "emerald" | "rose";
}) {
  return (
    <div className="rounded-lg border border-zinc-200">
      <p className="border-b border-zinc-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="px-3 py-3 text-sm text-zinc-400">Нет</p>
      ) : (
        <ul className="max-h-64 divide-y divide-zinc-50 overflow-y-auto">
          {items.map((it) => (
            <li key={it.label} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
              <span className="truncate text-zinc-700">{it.label}</span>
              <span className={`shrink-0 text-xs tabular-nums ${tone === "emerald" ? "text-emerald-600" : tone === "rose" ? "text-rose-600" : "text-zinc-400"}`}>
                {it.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
