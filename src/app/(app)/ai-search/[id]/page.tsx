"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { RunLike } from "@/components/ai-search/shared";
import { OverviewView } from "@/components/ai-search/overview-view";
import { PromptExplorer } from "@/components/ai-search/prompt-explorer";
import { ResponseExplorer } from "@/components/ai-search/response-explorer";
import { SourcesView } from "@/components/ai-search/sources-view";
import { CompetitorsView } from "@/components/ai-search/competitors-view";
import { GapsView } from "@/components/ai-search/gaps-view";
import { ActionsView } from "@/components/ai-search/actions-view";
import { PositioningView } from "@/components/ai-search/positioning-view";
import { RunsView } from "@/components/ai-search/runs-view";

type TabId = "overview" | "prompts" | "responses" | "sources" | "competitors" | "positioning" | "gaps" | "actions" | "runs";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Обзор" },
  { id: "prompts", label: "Промпты" },
  { id: "responses", label: "Ответы" },
  { id: "sources", label: "Источники" },
  { id: "competitors", label: "Конкуренты" },
  { id: "positioning", label: "Positioning" },
  { id: "gaps", label: "Гэпы" },
  { id: "actions", label: "План действий" },
  { id: "runs", label: "Runs" },
];

export default function AiSearchAuditPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;
  const queryClient = useQueryClient();

  const tabParam = searchParams.get("tab");
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "overview";
  const setTab = (t: TabId) => router.replace(`/ai-search/${id}?tab=${t}`);

  const { data: audit, isLoading } = useQuery({
    queryKey: ["ai-search", id],
    queryFn: async () => {
      const res = await fetch(`/api/ai-search/${id}`);
      if (!res.ok) throw new Error("Audit not found");
      return res.json();
    },
  });

  const executedRuns = useMemo(
    () => (audit?.runs ?? []).filter((r: RunLike) => r.total > 0).sort((a, b) => a.runNumber - b.runNumber),
    [audit]
  );
  const latestRun = executedRuns[executedRuns.length - 1] ?? null;
  const [explicitScope, setExplicitScope] = useState<string | "ALL" | null>(null);
  const explicitRun =
    explicitScope !== null && explicitScope !== "ALL" && executedRuns.some((r) => r.id === explicitScope)
      ? explicitScope
      : null;
  const runId = explicitScope === "ALL" ? null : explicitRun ?? latestRun?.id ?? null;

  const { data: analysis } = useQuery({
    queryKey: ["ai-search-analysis", id, runId ?? "all"],
    queryFn: async () => {
      const res = await fetch(`/api/ai-search/${id}/analysis${runId ? `?runId=${runId}` : ""}`);
      return res.json();
    },
  });

  if (isLoading || !audit) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ai-search", id] });
    queryClient.invalidateQueries({ queryKey: ["ai-search-analysis", id] });
    queryClient.invalidateQueries({ queryKey: ["ai-search"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{audit.name}</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {audit.brand}
            {audit.website ? ` · ${audit.website}` : ""}
            {audit.promptCount ? ` · ${audit.promptCount} промптов` : ""}
            {executedRuns.length > 0 ? ` · ${executedRuns.length} ${executedRuns.length === 1 ? "run" : "runs"} · ${audit.responses.length} ответов` : ""}
          </p>
        </div>
        {executedRuns.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Scope:</span>
                        <select
              value={runId ?? "all"}
              onChange={(e) => setExplicitScope(e.target.value === "all" ? "ALL" : e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs"
            >
              {executedRuns.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id === latestRun?.id ? "Latest Run" : `Run #${r.runNumber}`} · #{r.runNumber} · {r.mode === "web_search" ? "web_search" : "chat"} · {r.total} ответов
                </option>
              ))}
              <option value="all">
                All Runs · {executedRuns.length} runs · {audit.responses.length} ответов
              </option>
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-zinc-200 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewView
          audit={audit}
          analysis={analysis}
          onTab={setTab}
          refresh={refresh}
          runId={runId}
          runs={executedRuns}
          latestRun={latestRun}
        />
      )}
      {tab === "prompts" && <PromptExplorer audit={audit} onDone={refresh} />}
      {tab === "responses" && <ResponseExplorer audit={audit} />}
      {tab === "sources" && <SourcesView audit={audit} analysis={analysis} runId={runId} />}
      {tab === "competitors" && <CompetitorsView audit={audit} runId={runId} />}
      {tab === "positioning" && <PositioningView audit={audit} refresh={refresh} runId={runId} />}
      {tab === "gaps" && <GapsView audit={audit} analysis={analysis} refresh={refresh} runId={runId} />}
      {tab === "actions" && <ActionsView audit={audit} refresh={refresh} />}
      {tab === "runs" && <RunsView audit={audit} />}
    </div>
  );
}