"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
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

  const { data: analysis } = useQuery({
    queryKey: ["ai-search-analysis", id],
    queryFn: async () => {
      const res = await fetch(`/api/ai-search/${id}/analysis`);
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
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{audit.name}</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {audit.brand}
          {audit.website ? ` · ${audit.website}` : ""}
          {audit.promptCount ? ` · ${audit.promptCount} промптов` : ""}
        </p>
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
        <OverviewView audit={audit} analysis={analysis} onTab={setTab} refresh={refresh} />
      )}
      {tab === "prompts" && <PromptExplorer audit={audit} onDone={refresh} />}
      {tab === "responses" && <ResponseExplorer audit={audit} />}
      {tab === "sources" && <SourcesView audit={audit} analysis={analysis} />}
      {tab === "competitors" && <CompetitorsView audit={audit} />}
      {tab === "positioning" && <PositioningView audit={audit} refresh={refresh} />}
      {tab === "gaps" && <GapsView audit={audit} analysis={analysis} refresh={refresh} />}
      {tab === "actions" && <ActionsView audit={audit} refresh={refresh} />}
      {tab === "runs" && <RunsView audit={audit} />}
    </div>
  );
}