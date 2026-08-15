"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Play, RotateCcw, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { AuditDetail } from "./shared";
import { PROMPT_CATEGORY_LABELS, latestResponseOf } from "./shared";

type PromptRow = {
  id: string | null;
  category: string;
  text: string;
  enabled: boolean;
  custom: boolean;
  dirty?: boolean;
};

type Props = {
  audit: AuditDetail;
  onDone: () => void;
};

const CATEGORIES = Object.keys(PROMPT_CATEGORY_LABELS);
const BATCH_SIZE = 2;

export function PromptExplorer({ audit, onDone }: Props) {
  const [rows, setRows] = useState<PromptRow[]>(
    () => audit.prompts.map((p) => ({ id: p.id, category: p.category, text: p.text, enabled: p.enabled, custom: p.custom }))
  );
  const [filter, setFilter] = useState<string>("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runMode, setRunMode] = useState<"chat" | "web_search">("chat");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [lastRun, setLastRun] = useState<{ success: number; failed: number; mode?: string } | null>(null);

  const { data: meta } = useQuery<{ providers: { name: string; model: string }[]; count: number }>({
    queryKey: ["ai-search-meta"],
    queryFn: async () => (await fetch("/api/ai-search/meta")).json(),
  });

  const latestOf = (promptId: string) => latestResponseOf(audit.responses, promptId);

  const enabledRows = rows.filter((r) => r.enabled);
  const failedIds = audit.responses.filter((r) => r.status === "FAILED").map((r) => r.promptId);
  const failedRows = enabledRows.filter((r) => r.id && failedIds.includes(r.id));
  const estimate = enabledRows.length * (meta?.count ?? 1);

  const filtered = useMemo(() => {
    if (filter === "ALL") return rows;
    return rows.filter((r) => r.category === filter);
  }, [rows, filter]);

  const mutateRow = (id: string | null, patch: Partial<PromptRow>) => {
    setRows((prev) =>
      id === null
        ? [...prev, { id: null, category: "BRAND", text: "", enabled: true, custom: true, ...patch }]
        : prev.map((r) => (r.id === id ? { ...r, ...patch, dirty: true } : r))
    );
  };

  const removeRow = (id: string | null) => setRows((prev) => prev.filter((r) => r.id !== id));

  const saveChanges = async () => {
    setSaving(true);
    const existing = rows.filter((r) => r.id);
    const news = rows.filter((r) => !r.id);
    const removed = audit.prompts.filter((p) => !rows.some((r) => r.id === p.id)).map((p) => p.id);
    await fetch(`/api/ai-search/${audit.id}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompts: [...existing.map((r) => ({ id: r.id, category: r.category, text: r.text, enabled: r.enabled })), ...news.map((r) => ({ category: r.category, text: r.text, enabled: r.enabled }))],
        deletedIds: removed,
      }),
    });
    setSaving(false);
    onDone();
  };

  const runBatch = async (promptIds: string[]) => {
    const res = await fetch(`/api/ai-search/${audit.id}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptIds, mode: runMode }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Run failed");
    }
    return res.json();
  };

  const runAll = async (ids: string[]) => {
    setRunning(true);
    setLastRun(null);
    setProgress({ done: 0, total: ids.length });
    let success = 0;
    let failed = 0;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      try {
        const res = await runBatch(batch);
        success += res.success;
        failed += res.failed;
      } catch {
        failed += batch.length;
      }
      setProgress({ done: Math.min(i + BATCH_SIZE, ids.length), total: ids.length });
    }
    await fetch(`/api/ai-search/${audit.id}/analysis`, { method: "POST" });
    setRunning(false);
    setLastRun({ success, failed, mode: runMode });
    onDone();
  };

  const saveAndRun = async () => {
    await saveChanges();
    await new Promise((r) => setTimeout(r, 400));
    const ids = rows.filter((r) => r.enabled && r.id).map((r) => r.id as string);
    await runAll(ids);
  };

  const dirty = rows.some((r) => r.dirty) || rows.some((r) => !r.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Промпты аудита</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Все категории</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {PROMPT_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-zinc-100">
            {filtered.map((row) => {
              const latest = row.id ? latestOf(row.id) : undefined;
              return (
                <div key={row.id ?? `new-${row.text}`} className="flex items-center gap-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => mutateRow(row.id, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300"
                    aria-label="Включить промпт"
                  />
                  <Badge variant="secondary" className="w-28 shrink-0 justify-center">
                    {PROMPT_CATEGORY_LABELS[row.category] ?? row.category}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    {editingId === row.id ? (
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="py-1 text-sm"
                        autoFocus
                      />
                    ) : (
                      <p className="truncate text-sm text-zinc-800">{row.text}</p>
                    )}
                  </div>

                  {latest && (
                    <StatusBadge
                      status={latest.status === "SUCCESS" ? "AI_RESPONSE_SUCCESS" : latest.status === "FAILED" ? "AI_RESPONSE_FAILED" : "AI_RESPONSE_PENDING"}
                    />
                  )}

                  {editingId === row.id ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => {
                          if (editText.trim()) {
                            mutateRow(row.id, { text: editText.trim() });
                          }
                          setEditingId(null);
                        }}
                        aria-label="Сохранить промпт"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100"
                        onClick={() => setEditingId(null)}
                        aria-label="Отменить"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100"
                        onClick={() => {
                          setEditingId(row.id);
                          setEditText(row.text);
                        }}
                        aria-label="Редактировать"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {row.custom && (
                        <button
                          className="rounded-md p-1.5 text-rose-400 hover:bg-rose-50"
                          onClick={() => removeRow(row.id)}
                          aria-label="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-400">Промпты не найдены.</p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-zinc-100 pt-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => mutateRow(null, { category: "BRAND", text: "" })}
            >
              <Plus className="h-3.5 w-3.5" />
              Свой промпт
            </Button>
            {rows.filter((r) => !r.id).map((r) => (
              <NewPromptEditor key={`new-${r.text}-${r.category}`} row={r} onSave={(patch) => mutateRow(null, patch)} onCancel={() => removeRow(null)} />
            ))}
          </div>

          {dirty && (
            <div className="flex justify-end">
              <Button size="sm" onClick={saveChanges} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Сохранить изменения
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Запуск аудита</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-zinc-400">Промптов к запуску:</span>{" "}
              <span className="font-semibold">{enabledRows.length}</span>
            </div>
            <div>
              <span className="text-zinc-400">Провайдеров:</span>{" "}
              <span className="font-semibold">{meta?.count ?? "—"}</span>
              {meta && meta.providers.length > 0 && (
                <span className="ml-1 text-xs text-zinc-400">({meta.providers.map((p) => p.model).join(", ")})</span>
              )}
            </div>
            <div title={`${enabledRows.length} промптов × ${meta?.count ?? 1} провайдеров (каждый может последовательно пробовать провайдеров)`}>
              <span className="text-zinc-400">Оценка запросов:</span>{" "}
              <span className="font-semibold">~{estimate}</span>{" "}
              <span className="text-xs text-zinc-400">(выполнения, с учётом failover)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Режим запуска:</span>
              <Select value={runMode} onValueChange={(v) => setRunMode(v as "chat" | "web_search")}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">chat (baseline)</SelectItem>
                  <SelectItem value="web_search">web_search (source-aware)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {runMode === "web_search" && (
              <p className="max-w-md text-xs text-zinc-500">
                Используются только search-capable провайдеры (например, perplexity/* на OpenRouter).
                Citations реально возвращённые провайдером сохраняются в structured виде. Если таких
                провайдеров нет — запуск вернёт ошибку «Source data unavailable», ничего не
                симулируется.
              </p>
            )}
          </div>

          {running && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                <span>
                  Выполняется: {progress.done} / {progress.total}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                  реальные ответы AI сохраняются как evidence
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {lastRun && !running && (
            <p className="text-sm text-zinc-600">
              Запуск завершён{lastRun.mode ? ` (${lastRun.mode})` : ""}:{" "}
              <span className="font-semibold text-emerald-600">{lastRun.success} успешно</span>
              {lastRun.failed > 0 && (
                <>
                  {" · "}
                  <span className="font-semibold text-rose-600">{lastRun.failed} ошибок</span>
                </>
              )}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => saveAndRun()}
              disabled={running || enabledRows.length === 0}
              className="gap-2"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Выполняется..." : `Запустить аудит (${enabledRows.length} промптов)`}
            </Button>
            {failedRows.length > 0 && !running && (
              <Button
                variant="outline"
                onClick={() => runAll(failedRows.map((r) => r.id as string))}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Повторить упавшие ({failedRows.length})
              </Button>
            )}
          </div>

          {enabledRows.length > 0 && !running && (
            <p className="text-xs text-zinc-400">
              Оценка: ~{estimate} API-запросов. Запуск выполняется батчами по {BATCH_SIZE} промпта;
              при ошибке одного промпта остальные продолжаются. Не закрывайте вкладку до завершения.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NewPromptEditor({
  row,
  onSave,
  onCancel,
}: {
  row: PromptRow;
  onSave: (patch: Partial<PromptRow>) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(row.text);
  const [category, setCategory] = useState(row.category);
  return (
    <div className="flex flex-1 items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-2">
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {PROMPT_CATEGORY_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Текст промпта" className="flex-1" autoFocus />
      <Button size="sm" variant="outline" onClick={() => text.trim() && onSave({ text: text.trim(), category })}>
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}