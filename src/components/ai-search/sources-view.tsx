"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { AuditDetail, AiSearchMetrics } from "./shared";
import { analyzeOf } from "./shared";

type Props = {
  audit: AuditDetail;
  analysis: { metrics: AiSearchMetrics } | undefined;
};

const TYPE_LABELS: Record<string, string> = {
  official: "Официальный",
  competitor: "Конкурент",
  industry: "Отраслевой",
  documentation: "Документация",
  review: "Обзоры/отзывы",
  community: "Сообщества",
  media: "СМИ",
  other: "Прочее",
};

export function SourcesView({ audit, analysis }: Props) {
  const metrics = analysis?.metrics;
  const coverage = metrics?.sourceCoverage ?? [];
  const typeCounts = metrics?.sourceTypeCounts;

  // per-domain: type + prompts + related
  const perDomain = new Map<string, { type: string; appearances: number; prompts: { promptId: string; promptText: string; responseId: string }[]; urls: string[]; official: boolean; competitor: boolean }>();
  for (const r of audit.responses) {
    const a = analyzeOf(r);
    const doms: { domain: string; type: string; url: string | null }[] = [];
    for (const c of (r.citations ?? []) as { url?: string; domain?: string | null; title?: string | null; sourceType?: string | null }[]) {
      if (c.url) {
        try {
          const d = new URL(c.url).hostname.replace(/^www\./, "");
          doms.push({ domain: d, type: c.sourceType ?? "other", url: c.url });
        } catch {
          /* skip */
        }
      }
    }
    for (const s of a?.sources ?? []) {
      if (s.domain) doms.push({ domain: s.domain, type: s.type ?? "other", url: s.url });
    }
    for (const d of doms) {
      const existing = perDomain.get(d.domain) || { type: d.type, appearances: 0, prompts: [], urls: [], official: false, competitor: false };
      existing.appearances++;
      existing.type = d.type;
      if (d.url && !existing.urls.includes(d.url)) existing.urls.push(d.url);
      const typeOf = d.type;
      if (typeOf === "official" || d.domain === audit.website?.replace(/^https?:\/\//, "").replace(/\/.*$/, "")) existing.official = true;
      if (typeOf === "competitor") existing.competitor = true;
      if (!existing.prompts.some((p) => p.responseId === r.id)) {
        existing.prompts.push({ promptId: r.promptId, promptText: r.promptText || r.prompt.text, responseId: r.id });
      }
      perDomain.set(d.domain, existing);
    }
  }

  const officialDomain = audit.website
    ? audit.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "")
    : null;
  const officialMentions = coverage.filter((s) => s.official).reduce((a, s) => a + s.count, 0);
  const sourceDataAvailable = metrics?.sourceDataAvailable ?? false;
  const totalMentions = coverage.reduce((a, s) => a + s.count, 0);
  const responsesWithSources = audit.responses.filter((r) => {
    const a = analyzeOf(r);
    const hasCitation = Array.isArray(r.citations) && (r.citations as unknown[]).length > 0;
    return r.status === "SUCCESS" && (hasCitation || (a?.sources?.length ?? 0) > 0);
  }).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source Intelligence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-500">
            Observed source pattern: какие источники реально были обнаружены в ответах (citations от
            провайдера + источники в тексте). Классификация rule-based. Это наблюдение, а не вывод о
            причинно-следственной связи.
          </p>

          {!sourceDataAvailable && totalMentions === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Source data unavailable from this provider
              </p>
              <p className="mt-1 text-sm text-amber-700">
                В полученных ответах источники не были обнаружены (no sources detected in returned
                response). Отсутствие citations не является доказательством того, что официальный сайт
                не используется.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Всего упоминаний" value={String(totalMentions)} />
                <Stat label="Уникальных доменов" value={String(coverage.length)} />
                <Stat label="Ответов с источниками" value={String(responsesWithSources)} />
                <Stat label="Типов источников" value={String(Object.values(typeCounts ?? {}).filter((v) => v > 0).length)} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <TypeStat label="Официальные" value={typeCounts?.official ?? 0} tone="emerald" />
                <TypeStat label="Конкуренты" value={typeCounts?.competitor ?? 0} tone="rose" />
                <TypeStat label="Отраслевые" value={typeCounts?.industry ?? 0} tone="blue" />
                <TypeStat label="Сообщества" value={typeCounts?.community ?? 0} tone="zinc" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <TypeStat label="Документация" value={typeCounts?.documentation ?? 0} tone="blue" />
                <TypeStat label="Обзоры/отзывы" value={typeCounts?.review ?? 0} tone="amber" />
                <TypeStat label="СМИ" value={typeCounts?.media ?? 0} tone="zinc" />
                <TypeStat label="Прочее" value={typeCounts?.other ?? 0} tone="zinc" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {officialDomain && sourceDataAvailable && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source Gap</CardTitle>
          </CardHeader>
          <CardContent>
            {officialMentions === 0 ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-medium text-rose-800">
                  No {officialDomain} citations were detected in this audit ({officialMentions} /{" "}
                  {metrics?.success ?? 0} ответов).
                </p>
                <p className="mt-1 text-xs text-rose-700">
                  Это наблюдение в рамках данного аудита. Не утверждается, что официальный сайт «не
                  используется» AI — только то, что citations с ним не обнаружены.
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-600">
                Citations с официальным доменом {officialDomain} обнаружены: {officialMentions}.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Источники по доменам</CardTitle>
        </CardHeader>
        <CardContent>
          {perDomain.size === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">
              В полученных ответах источники не были обнаружены.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-xs text-zinc-400">
                    <th className="py-2 pr-4 font-medium">Домен</th>
                    <th className="py-2 pr-4 font-medium">URL</th>
                    <th className="py-2 pr-4 font-medium">Тип</th>
                    <th className="py-2 pr-4 font-medium">Появлений</th>
                    <th className="py-2 pr-4 font-medium">Промпты</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {Array.from(perDomain.entries())
                    .sort((a, b) => b[1].appearances - a[1].appearances)
                    .map(([domain, info]) => (
                      <tr key={domain}>
                        <td className="py-2.5 pr-4 font-medium text-zinc-900">
                          {domain}
                          {info.official && <Badge variant="success" className="ml-2">official</Badge>}
                          {info.competitor && <Badge variant="warning" className="ml-2">competitor</Badge>}
                        </td>
                        <td className="max-w-[180px] truncate py-2.5 pr-4 text-zinc-500">
                          {info.urls[0] ? (
                            <a href={info.urls[0]} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                              {info.urls[0]}
                            </a>
                          ) : "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-zinc-500">{TYPE_LABELS[info.type] ?? info.type}</td>
                        <td className="py-2.5 pr-4 tabular-nums text-zinc-600">{info.appearances}</td>
                        <td className="max-w-[260px] py-2.5">
                          <div className="space-y-0.5">
                            {info.prompts.slice(0, 3).map((p) => (
                              <p key={p.responseId} className="truncate text-xs text-zinc-400">
                                {p.promptText}
                              </p>
                            ))}
                            {info.prompts.length > 3 && (
                              <p className="text-xs text-zinc-300">+{info.prompts.length - 3} ещё</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-950">{value}</p>
    </div>
  );
}

function TypeStat({ label, value, tone }: { label: string; value: number; tone: "emerald" | "rose" | "blue" | "amber" | "zinc" }) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    zinc: "border-zinc-200 bg-zinc-50 text-zinc-600",
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${tones[tone]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
