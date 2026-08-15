"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import type { AuditDetail } from "./shared";

type Action = {
  id: string;
  gapId: string | null;
  priority: string;
  problem: string;
  evidence: { promptIds?: string[]; responseIds?: string[]; stats?: string } | null;
  recommendation: string;
  target: string | null;
  expectedPurpose: string | null;
  whyThisAction: string | null;
  verificationMethod: string | null;
  status: string;
  note: string | null;
  implementedDate: string | null;
  affectedUrl: string | null;
};

type Props = { audit: AuditDetail; refresh: () => void };

const PRIORITY_BADGE: Record<string, { variant: "destructive" | "warning" | "secondary"; label: string }> = {
  HIGH: { variant: "destructive", label: "P0" },
  MEDIUM: { variant: "warning", label: "P1" },
  LOW: { variant: "secondary", label: "P2" },
};

const STATUS_BADGE: Record<string, { variant: "secondary" | "warning" | "success"; label: string }> = {
  SUGGESTED: { variant: "secondary", label: "Предложено" },
  PLANNED: { variant: "warning", label: "Запланировано" },
  DONE: { variant: "success", label: "Выполнено" },
};

const NEXT_STATUS: Record<string, string> = {
  SUGGESTED: "PLANNED",
  PLANNED: "DONE",
  DONE: "PLANNED",
};

export function ActionsView({ audit, refresh }: Props) {
  const actions: Action[] = audit.actions ?? [];
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { note: string; url: string; date: string }>>({});

  const setStatus = async (action: Action, status: string) => {
    setSavingId(action.id);
    const d = drafts[action.id] ?? { note: "", url: "", date: "" };
    await fetch(`/api/ai-search/${audit.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionId: action.id,
        status,
        note: d.note || undefined,
        affectedUrl: d.url || undefined,
        implementedDate: d.date || undefined,
      }),
    });
    setSavingId(null);
    refresh();
  };

  const draftOf = (id: string) => drafts[id] ?? { note: "", url: "", date: "" };
  const setDraft = (id: string, patch: Partial<{ note: string; url: string; date: string }>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...draftOf(id), ...patch } }));

  return (
    <div className="space-y-4">
      {actions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">План действий пуст</p>
            <p className="mt-1 text-sm text-zinc-500">
              Действия генерируются из гэпов после выполнения аудита.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            Каждое действие основано на observed gap с evidence. Статусы: SUGGESTED → PLANNED →
            DONE. Отметка DONE — это декларация пользователя о внесении изменения (система не
            проверяет фактическое выполнение). После DONE запустите «Run verification» в Обзоре.
          </p>
          {actions.map((a) => {
            const p = PRIORITY_BADGE[a.priority] ?? PRIORITY_BADGE.MEDIUM;
            const st = STATUS_BADGE[a.status] ?? STATUS_BADGE.SUGGESTED;
            const d = draftOf(a.id);
            const saving = savingId === a.id;
            return (
              <Card key={a.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={p.variant}>{p.label}</Badge>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        {a.target && <Badge variant="outline">{a.target}</Badge>}
                        {a.implementedDate && (
                          <span className="text-xs text-zinc-400">
                            implemented {new Date(a.implementedDate).toLocaleDateString("ru-RU")}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 font-semibold">{a.problem}</h3>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="text-zinc-700">
                      <span className="font-medium text-zinc-500">Recommended action: </span>
                      {a.recommendation}
                    </p>
                    {a.whyThisAction && (
                      <p className="text-zinc-600">
                        <span className="font-medium text-zinc-500">Why this action? </span>
                        {a.whyThisAction}
                      </p>
                    )}
                    {a.expectedPurpose && (
                      <p className="text-zinc-600">
                        <span className="font-medium text-zinc-500">Expected purpose: </span>
                        {a.expectedPurpose}
                      </p>
                    )}
                    {a.verificationMethod && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          How to verify?
                        </p>
                        <p className="mt-1 text-zinc-700">{a.verificationMethod}</p>
                      </div>
                    )}
                  </div>
                  {a.evidence && a.evidence.stats && (
                    <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                      Evidence: {a.evidence.stats}
                    </p>
                  )}

                  {(a.note || a.affectedUrl) && (
                    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                      {a.note && <p className="text-zinc-700">Note: {a.note}</p>}
                      {a.affectedUrl && (
                        <p className="mt-1 text-xs text-zinc-500">
                          URL:{" "}
                          <a href={a.affectedUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            {a.affectedUrl}
                          </a>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.status !== "SUGGESTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => setStatus(a, NEXT_STATUS[a.status] ?? "SUGGESTED")}
                        >
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          {a.status === "DONE" ? "Вернуть в PLANNED" : a.status === "PLANNED" ? "→ DONE" : "→ PLANNED"}
                        </Button>
                      )}
                      {a.status === "SUGGESTED" && (
                        <Button size="sm" variant="outline" disabled={saving} onClick={() => setStatus(a, "PLANNED")}>
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          → PLANNED
                        </Button>
                      )}
                    </div>
                    {a.status !== "DONE" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={d.note}
                          onChange={(e) => setDraft(a.id, { note: e.target.value })}
                          placeholder="Action note (например: добавлен материал по выбору системы)"
                          className="max-w-sm py-1 text-sm"
                        />
                        <Input
                          value={d.url}
                          onChange={(e) => setDraft(a.id, { url: e.target.value })}
                          placeholder="URL (опционально)"
                          className="max-w-[180px] py-1 text-sm"
                        />
                        <Input
                          type="date"
                          value={d.date}
                          onChange={(e) => setDraft(a.id, { date: e.target.value })}
                          className="w-40 py-1 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
