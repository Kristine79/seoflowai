"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditDetail } from "./shared";
import { analyzeOf, listValues } from "./shared";

type Props = { audit: AuditDetail; runId: string | null };

export function CompetitorsView({ audit, runId }: Props) {
  const competitors = listValues(audit.competitors);
  const scoped = runId ? audit.responses.filter((r) => r.runId === runId) : audit.responses;

  const brandMentioned = scoped.filter((r) => analyzeOf(r)?.brandMentioned).length;
  const brandRecommended = scoped.filter((r) => analyzeOf(r)?.recommended).length;
  const total = scoped.filter((r) => r.status === "SUCCESS").length;

  const agg = new Map<string, { mentioned: number; recommended: number; withBrand: number; positions: number[] }>();
  for (const r of scoped) {
    const a = analyzeOf(r);
    if (!a) continue;
    for (const c of a.competitors) {
      const existing = agg.get(c.name) || { mentioned: 0, recommended: 0, withBrand: 0, positions: [] };
      if (c.mentioned) existing.mentioned++;
      if (c.recommended) {
        existing.recommended++;
        if (c.position) existing.positions.push(c.position);
      }
      if (a.brandMentioned) existing.withBrand++;
      agg.set(c.name, existing);
    }
  }

  const rows = competitors
    .map((name) => {
      const match = Array.from(agg.entries()).find(([n]) => n.toLowerCase().includes(name.split(" ")[0].toLowerCase()));
      return { name, stats: match?.[1] ?? { mentioned: 0, recommended: 0, withBrand: 0, positions: [] } };
    })
    .sort((a, b) => b.stats.mentioned - a.stats.mentioned);

  const avgPos = (positions: number[]) =>
    positions.length ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1) : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Бренд vs конкуренты
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500">
            {runId ? "run scope" : "all runs"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-zinc-500">
          Сравнение основано на ответах AI в этом аудите ({total} успешных
          {runId ? " ответов выбранного run" : " ответов по всем runs"}).
          Учитываются только конкуренты из конфигурации аудита.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-400">
                <th className="py-2 pr-4 font-medium">Кто</th>
                <th className="py-2 pr-4 font-medium">Упоминаний</th>
                <th className="py-2 pr-4 font-medium">Рекомендаций</th>
                <th className="py-2 pr-4 font-medium">Средняя позиция</th>
                <th className="py-2 font-medium">Упомянут вместе с брендом</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <tr className="bg-zinc-50/60">
                <td className="py-2.5 pr-4 font-semibold text-zinc-900">{audit.brand}</td>
                <td className="py-2.5 pr-4 font-semibold tabular-nums text-emerald-600">{brandMentioned}</td>
                <td className="py-2.5 pr-4 font-semibold tabular-nums text-emerald-600">{brandRecommended}</td>
                <td className="py-2.5 pr-4 text-zinc-500">—</td>
                <td className="py-2.5 text-zinc-500">—</td>
              </tr>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td className="py-2.5 pr-4 font-medium text-zinc-900">{row.name}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-zinc-600">{row.stats.mentioned}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-zinc-600">{row.stats.recommended}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-zinc-600">{avgPos(row.stats.positions)}</td>
                  <td className="py-2.5 tabular-nums text-zinc-600">{row.stats.withBrand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {competitors.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-400">
            Конкуренты не указаны в конфигурации аудита.
          </p>
        )}
        {total > 0 && rows.some((r) => r.stats.mentioned > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {rows.filter((r) => r.stats.recommended > 0).map((r) => (
              <Badge key={r.name} variant="warning">
                {r.name} — рекомендован в {r.stats.recommended} ответах
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}