"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { AttentionBlock, type AttentionItem } from "@/components/attention-block";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Play, ArrowUpRight, History, AlertTriangle, RotateCcw, Loader2, ChevronDown, FileDown } from "lucide-react";
import { useState } from "react";
import type { AuditDetail, AiSearchMetrics, RunLike } from "./shared";
import { analyzeOf, fmtDate, fmtRate, listValues } from "./shared";
import { reportBaseName as reportBaseNameFn } from "@/lib/ai-search/filename";

type OverviewProps = {
  audit: AuditDetail;
  analysis: { metrics: AiSearchMetrics; gaps: { id: string; type: string; severity: string; title: string }[]; actions: unknown[]; insights?: { type: string; severity: string; title: string; description: string }[] } | undefined;
  onTab: (tab: "prompts" | "responses" | "sources" | "competitors" | "gaps" | "actions") => void;
  refresh: () => void;
  runId: string | null;
  runs: RunLike[];
  latestRun: RunLike | null;
};

function MetricTile({ label, value, definition }: { label: string; value: string; definition: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-medium text-zinc-500" title={definition}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">{value}</p>
      <p className="mt-1 hidden text-[11px] leading-snug text-zinc-400 lg:block">{definition}</p>
    </div>
  );
}

export function OverviewView({ audit, analysis, onTab, refresh, runId, runs, latestRun }: OverviewProps) {
  const [exporting, setExporting] = useState<"idle" | "pdf" | "md">("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const metrics: AiSearchMetrics | null = analysis?.metrics ?? null;
  const gaps = analysis?.gaps ?? [];
  const selectedRun = runs.find((r) => r.id === runId) ?? null;
  const scopeLabel = selectedRun
    ? `${selectedRun.id === latestRun?.id ? "Latest Run" : `Run #${selectedRun.runNumber}`} · #${selectedRun.runNumber} · ${selectedRun.mode === "web_search" ? "web_search" : "chat"} · ${selectedRun.total} ответов`
    : `All Runs · ${runs.length} ${runs.length === 1 ? "run" : "runs"} · ${audit.responses.length} ответов`;

  const successCount = metrics?.success ?? 0;
  const notEnough = successCount === 0;

  const reportBaseName = reportBaseNameFn(audit.brand);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const generatePdf = async () => {
    setExporting("pdf");
    setExportError(null);
    try {
      const res = await fetch(`/api/ai-search/${audit.id}/report/pdf`, { method: "POST" });
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      downloadBlob(blob, `${reportBaseName}.pdf`);
    } catch {
      setExportError("Не удалось подготовить PDF. Попробуйте ещё раз.");
    }
    setExporting("idle");
  };

  const generateMarkdown = async () => {
    setExporting("md");
    setExportError(null);
    try {
      const res = await fetch(`/api/ai-search/${audit.id}/report`, { method: "POST" });
      if (!res.ok) throw new Error("Markdown failed");
      const data = await res.json();
      const blob = new Blob([data.report], { type: "text/markdown" });
      downloadBlob(blob, `${reportBaseName}.md`);
      refresh();
    } catch {
      setExportError("Не удалось подготовить Markdown. Попробуйте ещё раз.");
    }
    setExporting("idle");
  };

  const attention: AttentionItem[] = [
    ...(metrics && metrics.competitorOnlyCount > 0
      ? [{
          key: "competitor-only",
          tone: "rose" as const,
          label: "Конкуренты без бренда",
          count: metrics.competitorOnlyCount,
          note: "в ответах упомянуты конкуренты",
          href: `/ai-search/${audit.id}?tab=responses`,
          cta: "Смотреть",
        }]
      : []),
    ...(metrics && metrics.potentialIssues.length > 0
      ? [{
          key: "issues",
          tone: "amber" as const,
          label: "Потенциальные проблемы",
          count: metrics.potentialIssues.length,
          note: "утверждения, требующие проверки человеком",
          href: `/ai-search/${audit.id}?tab=gaps`,
          cta: "Проверить",
        }]
      : []),
    ...(gaps.filter((g) => g.severity === "HIGH").length > 0
      ? [{
          key: "gaps",
          tone: "amber" as const,
          label: "Важные гэпы",
          count: gaps.filter((g) => g.severity === "HIGH").length,
          note: "требуют внимания",
          href: `/ai-search/${audit.id}?tab=gaps`,
          cta: "Открыть",
        }]
      : []),
    ...(metrics && metrics.success > 0 && !metrics.sourceDataAvailable
      ? [{
          key: "sources",
          tone: "blue" as const,
          label: "Source data unavailable",
          count: 1,
          note: "провайдер не вернул citations",
          href: `/ai-search/${audit.id}?tab=sources`,
          cta: "Анализ",
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">AI Search Intelligence</CardTitle>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <StatusBadge status={audit.status} />
              <Button variant="outline" size="sm" onClick={() => onTab("prompts")} className="gap-1.5">
                <Play className="h-3.5 w-3.5" />
                Запустить
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={exporting !== "idle"} className="gap-1.5">
                    {exporting !== "idle" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FileText className="h-3.5 w-3.5" />
                    )}
                    {exporting === "pdf"
                      ? "Подготовка PDF…"
                      : exporting === "md"
                        ? "Подготовка Markdown…"
                        : "Отчёт"}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem disabled={exporting !== "idle"} onSelect={generatePdf}>
                    <FileDown className="h-4 w-4 text-zinc-500" />
                    Скачать PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={exporting !== "idle"} onSelect={generateMarkdown}>
                    <FileText className="h-4 w-4 text-zinc-500" />
                    Скачать Markdown
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {exportError && (
              <p className="max-w-xs text-right text-xs text-rose-600">{exportError}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-zinc-500">Бренд</p>
              <p className="mt-1 font-semibold">{audit.brand}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Рынок</p>
              <p className="mt-1 text-sm text-zinc-700">{audit.market || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Промптов</p>
              <p className="mt-1 text-sm text-zinc-700">{audit.promptCount}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Выполнен</p>
              <p className="mt-1 text-sm text-zinc-700">{fmtDate(audit.executedAt)}</p>
            </div>
          </div>
          {metrics && metrics.providers.length > 0 && (
            <div className="border-t border-zinc-100 pt-3 text-xs text-zinc-400">
              Providers: {metrics.providers.join(" · ")}
            </div>
          )}
        </CardContent>
      </Card>

      {!notEnough ? (
        <>
          <AttentionBlock items={attention} />

          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-2.5">
              <p className="text-xs font-medium text-zinc-500">Метрики: {scopeLabel}</p>
              {!selectedRun && (
                <p className="text-[11px] text-zinc-400">агрегация по всем ответам всех runs</p>
              )}
            </div>
            <div className="grid grid-cols-2 divide-y divide-zinc-100 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
              <MetricTile
                label="Mentioned"
                value={fmtRate(metrics?.mentionRate)}
                definition="Ответов с упоминанием бренда / успешных ответов"
              />
              <MetricTile
                label="Recommended"
                value={fmtRate(metrics?.recommendationRate)}
                definition="Ответов, где бренд рекомендован / успешных ответов"
              />
              <MetricTile
                label="Top 3"
                value={fmtRate(metrics?.top3Rate)}
                definition="Ответов, где бренд в топ-3 рекомендаций / успешных ответов"
              />
              <MetricTile
                label="Cited"
                value={fmtRate(metrics?.citationRate)}
                definition="Ответов с хотя бы одним источником / успешных ответов"
              />
            </div>
          </div>

          <RunHistory audit={audit} />

          <InsightsBlock insights={analysis?.insights} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  Конкуренты
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500">
                    {runId ? "run scope" : "all runs"}
                  </span>
                </CardTitle>
                <Link href={`/ai-search/${audit.id}?tab=competitors`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Все <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <CompetitorSummary audit={audit} runId={runId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  Источники
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500">
                    {runId ? "run scope" : "all runs"}
                  </span>
                </CardTitle>
                <Link href={`/ai-search/${audit.id}?tab=sources`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Все <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <SourcesSummary metrics={metrics} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Свежие ответы</CardTitle>
              <Link href={`/ai-search/${audit.id}?tab=responses`}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Все <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-zinc-100">
                {audit.responses.slice(0, 5).map((r) => {
                  const a = analyzeOf(r);
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">{r.promptText || r.prompt.text}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {r.provider ? `${r.provider}${r.model ? ` · ${r.model}` : ""} · ` : ""}
                          {fmtDate(r.completedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {a?.brandMentioned && (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            упомянут
                          </span>
                        )}
                        <StatusBadge status={r.status === "SUCCESS" ? "AI_RESPONSE_SUCCESS" : r.status === "FAILED" ? "AI_RESPONSE_FAILED" : "AI_RESPONSE_PENDING"} />
                      </div>
                    </div>
                  );
                })}
                {audit.responses.length === 0 && (
                  <p className="py-6 text-center text-sm text-zinc-400">Ответов пока нет — запустите аудит.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="font-medium">Not enough data</p>
            <p className="max-w-md text-sm text-zinc-500">
              Аудит ещё не выполнен. Откройте вкладку «Промпты», проверьте набор запросов
              и запустите выполнение.
            </p>
            <Button className="mt-2 gap-2" onClick={() => onTab("prompts")}>
              <Play className="h-4 w-4" />
              К промптам
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CompetitorSummary({ audit, runId }: { audit: AuditDetail; runId: string | null }) {
  const competitors = listValues(audit.competitors);
  const scoped = runId ? audit.responses.filter((r) => r.runId === runId) : audit.responses;
  const brandMentioned = scoped.filter((r) => analyzeOf(r)?.brandMentioned).length;

  const agg = new Map<string, { mentioned: number; recommended: number; withBrand: number }>();
  for (const r of scoped) {
    const a = analyzeOf(r);
    if (!a) continue;
    for (const c of a.competitors) {
      const name = c.name;
      const existing = agg.get(name) || { mentioned: 0, recommended: 0, withBrand: 0 };
      if (c.mentioned) existing.mentioned++;
      if (c.recommended) existing.recommended++;
      if (a.brandMentioned) existing.withBrand++;
      agg.set(name, existing);
    }
  }

  const rows = competitors
    .map((name) => {
      const match = Array.from(agg.entries()).find(([n]) => n.toLowerCase().includes(name.split(" ")[0].toLowerCase()));
      return { name, stats: match?.[1] ?? { mentioned: 0, recommended: 0, withBrand: 0 } };
    })
    .sort((a, b) => b.stats.mentioned - a.stats.mentioned);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
        <span className="text-sm font-semibold">{audit.brand}</span>
        <span className="text-sm text-zinc-500">{brandMentioned} упоминаний</span>
      </div>
      {rows.map((row) => (
        <div key={row.name} className="flex items-center justify-between px-3 py-1.5">
          <span className="text-sm text-zinc-700">{row.name}</span>
          <span className="text-sm text-zinc-500">
            {row.stats.mentioned} упоминаний · {row.stats.recommended} рекомендаций
          </span>
        </div>
      ))}
      {rows.length === 0 && <p className="py-4 text-center text-sm text-zinc-400">Конкуренты не указаны в конфигурации.</p>}
    </div>
  );
}

function SourcesSummary({ metrics }: { metrics: AiSearchMetrics | null }) {
  const sources = metrics?.sourceCoverage?.slice(0, 6) ?? [];
  return (
    <div className="space-y-2">
      {sources.map((s) => (
        <div key={s.domain} className="flex items-center justify-between px-1 py-1.5">
          <div className="min-w-0">
            <span className="truncate text-sm text-zinc-700">{s.domain}</span>
            {s.official && (
              <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                official
              </span>
            )}
          </div>
          <span className="text-sm tabular-nums text-zinc-500">{s.count}</span>
        </div>
      ))}
      {sources.length === 0 && (
        <p className="py-4 text-center text-sm text-zinc-400">
          {metrics?.sourceDataAvailable
            ? "Источники не зафиксированы."
            : "Source data unavailable from this provider."}
        </p>
      )}
    </div>
  );
}

function RunHistory({ audit }: { audit: AuditDetail }) {
  const runs: RunLike[] = (audit.runs ?? []).filter((r) => r.total > 0).sort((a, b) => a.runNumber - b.runNumber);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  if (runs.length === 0) return null;

  const baseline = runs[0];
  const latest = runs[runs.length - 1];
  const promptSetChanged =
    baseline && latest && baseline.promptSetHash && latest.promptSetHash && baseline.promptSetHash !== latest.promptSetHash;

  const runVerification = async () => {
    setVerifying(true);
    setVerifyError(null);
    const promptIds = audit.prompts.filter((p) => p.enabled).map((p) => p.id);
    try {
      const res = await fetch(`/api/ai-search/${audit.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptIds, mode: latest.mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Run verification failed");
      await fetch(`/api/ai-search/${audit.id}/analysis?runId=${data.runId}`, { method: "POST" });
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : String(err));
    }
    setVerifying(false);
    location.reload();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Run history
        </CardTitle>
        <div className="flex items-center gap-2">
          {promptSetChanged && (
            <span className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Prompt set changed — direct comparison may be unreliable
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={verifying}
            onClick={runVerification}
            title={`Verification run: тот же prompt set, режим ${latest.mode === "web_search" ? "web_search" : "chat"}`}
          >
            {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Run verification
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {verifyError && (
          <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {verifyError}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-400">
                <th className="py-2 pr-4 font-medium">Run</th>
                <th className="py-2 pr-4 font-medium">Дата</th>
                <th className="py-2 pr-4 font-medium">Mode</th>
                <th className="py-2 pr-4 font-medium">Providers</th>
                <th className="py-2 pr-4 font-medium">Успех</th>
                <th className="py-2 pr-4 font-medium">Источники</th>
                <th className="py-2 pr-4 font-medium">Mention</th>
                <th className="py-2 pr-4 font-medium">Recommend</th>
                <th className="py-2 font-medium">Citations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {runs.map((r) => (
                <tr key={r.id} className={r.id === latest.id ? "bg-blue-50/50" : ""}>
                  <td className="py-2.5 pr-4 font-medium text-zinc-900">
                    #{r.runNumber}
                    {r.id === latest.id && (
                      <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        latest
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-zinc-600">{fmtDate(r.completedAt ?? r.startedAt)}</td>
                  <td className="py-2.5 pr-4">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600">
                      {r.mode === "web_search" ? "web_search" : "chat"}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate py-2.5 pr-4 text-zinc-500">{r.providers.join(", ") || "—"}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-zinc-600">
                    {r.success}/{r.total}
                    {r.failed > 0 && <span className="ml-1 text-rose-600">({r.failed} err)</span>}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums text-zinc-600">
                    {r.mode === "web_search" ? `${r.sourceDetectedResponses}/${r.total}` : "—"}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums text-zinc-600">{fmtRate(r.metrics.mentionRate)}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-zinc-600">{fmtRate(r.metrics.recommendationRate)}</td>
                  <td className="py-2.5 tabular-nums text-zinc-600">{fmtRate(r.metrics.citationRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          Каждый run сохраняет свои raw responses (immutable evidence), runId, timestamp, providers,
          promptSetVersion/hash. Сравнение корректно только при неизменном prompt set.
        </p>
      </CardContent>
    </Card>
  );
}

function InsightsBlock({
  insights,
}: {
  insights: { type: string; severity: string; title: string; description: string; evidence?: { stats: string } }[] | undefined;
}) {
  if (!insights || insights.length === 0) return null;
  return (
    <div className="space-y-4">
      {insights.map((ins) => (
        <Card key={ins.type}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Badge variant={ins.severity === "HIGH" ? "destructive" : "warning"} className="text-xs">
                {ins.severity === "HIGH" ? "HIGH" : "MEDIUM"}
              </Badge>
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{ins.type}</span>
            </div>
            <h3 className="mt-2 font-semibold">{ins.title}</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-zinc-600">{ins.description}</p>
            {ins.evidence?.stats && (
              <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                Evidence: {ins.evidence.stats}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
