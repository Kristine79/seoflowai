"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, CheckCircle2, XCircle, MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import type { AuditDetail, AiSearchMetrics } from "./shared";

type Gap = {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string | null;
  hypothesis: string | null;
  evidence: unknown;
  status: string;
};

type Props = {
  audit: AuditDetail;
  analysis: { metrics: AiSearchMetrics; gaps: Gap[] } | undefined;
  refresh: () => void;
};

const SEVERITY_BADGE: Record<string, { variant: "destructive" | "warning" | "secondary"; label: string }> = {
  HIGH: { variant: "destructive", label: "Высокий" },
  MEDIUM: { variant: "warning", label: "Средний" },
  LOW: { variant: "secondary", label: "Низкий" },
};

const ISSUE_STATUS_BADGE: Record<string, { variant: "warning" | "success" | "secondary"; label: string }> = {
  PENDING_REVIEW: { variant: "warning", label: "На проверке" },
  VERIFIED: { variant: "success", label: "Подтверждено" },
  FALSE_POSITIVE: { variant: "secondary", label: "Ложное срабатывание" },
};

export function GapsView({ audit, analysis, refresh }: Props) {
  const [recomputing, setRecomputing] = useState(false);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const gaps = analysis?.gaps ?? audit.gaps ?? [];
  const issues = audit.issues ?? [];

  const recompute = async () => {
    setRecomputing(true);
    await fetch(`/api/ai-search/${audit.id}/analysis`, { method: "POST" });
    setRecomputing(false);
    refresh();
  };

  const reviewIssue = async (issueId: string, status: string) => {
    await fetch(`/api/ai-search/${audit.id}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId, status, note: noteDraft[issueId] || undefined }),
    });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Гэпы — наблюдаемые паттерны, каждый со ссылкой на evidence. Гипотезы явно отделены от
          фактов. Рекомендации без данных не генерируются.
        </p>
        <Button variant="outline" size="sm" onClick={recompute} disabled={recomputing} className="gap-1.5">
          {recomputing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Пересчитать
        </Button>
      </div>

      {gaps.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">Гэпы не обнаружены</p>
            <p className="mt-1 text-sm text-zinc-500">
              После запуска аудита здесь появятся evidence-backed гэпы присутствия.
            </p>
          </CardContent>
        </Card>
      ) : (
        gaps.map((g) => {
          const sev = SEVERITY_BADGE[g.severity] ?? SEVERITY_BADGE.MEDIUM;
          return (
            <Card key={g.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sev.variant}>{sev.label}</Badge>
                      <Badge variant="secondary">{g.type}</Badge>
                      <span className="text-xs text-zinc-400">{g.status}</span>
                    </div>
                    <h3 className="mt-2 font-semibold">{g.title}</h3>
                    {g.description && <p className="mt-1 text-sm text-zinc-600">{g.description}</p>}
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Evidence</p>
                  <p className="mt-1 text-zinc-700">
                    {(g.evidence as { stats?: string }).stats || "—"}
                  </p>
                  {(g.evidence as { promptIds?: string[] }).promptIds &&
                    (g.evidence as { promptIds?: string[] }).promptIds!.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-zinc-400">Промпты:</span>
                        {(g.evidence as { promptIds?: string[] }).promptIds!.slice(0, 8).map((pid) => (
                          <Link
                            key={pid}
                            href={`/ai-search/${audit.id}?tab=responses`}
                            className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-blue-600 hover:underline"
                          >
                            {pid.slice(-6)}
                          </Link>
                        ))}
                      </div>
                    )}
                  {g.hypothesis && (
                    <div className="mt-3 border-t border-zinc-200 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Interpretation (hypothesis — не факт)
                      </p>
                      <p className="mt-1 text-zinc-700">{g.hypothesis}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquarePlus className="h-4 w-4" />
              Potential issues — human review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-500">
              Analysis пометил утверждения как потенциально некорректные или непроверяемые. Это не
              автоматическое признание фактической ошибки: статус определяет человек. Raw responses
              остаются immutable evidence.
            </p>
            {issues.map((iss) => {
              const st = ISSUE_STATUS_BADGE[iss.status] ?? ISSUE_STATUS_BADGE.PENDING_REVIEW;
              return (
                <div key={iss.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">«{iss.claim}»</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        response: {iss.responseId ? iss.responseId.slice(-6) : "—"} · prompt:{" "}
                        {iss.promptId ? iss.promptId.slice(-6) : "—"}
                        {iss.reviewedAt ? ` · reviewed ${new Date(iss.reviewedAt).toLocaleString("ru-RU")}` : ""}
                      </p>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  {iss.status === "PENDING_REVIEW" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Input
                        value={noteDraft[iss.id] ?? ""}
                        onChange={(e) => setNoteDraft((prev) => ({ ...prev, [iss.id]: e.target.value }))}
                        placeholder="Заметка (опционально)"
                        className="max-w-xs py-1 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-emerald-700"
                        onClick={() => reviewIssue(iss.id, "VERIFIED")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Подтверждено
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-rose-700"
                        onClick={() => reviewIssue(iss.id, "FALSE_POSITIVE")}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Ложное срабатывание
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
