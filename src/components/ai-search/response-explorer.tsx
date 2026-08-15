"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { AuditDetail } from "./shared";
import { analyzeOf, fmtDate, PROMPT_CATEGORY_LABELS } from "./shared";

type Props = { audit: AuditDetail };

export function ResponseExplorer({ audit }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const responses = [...audit.responses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      {responses.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">Ответов пока нет</p>
            <p className="mt-1 text-sm text-zinc-500">
              Запустите аудит на вкладке «Промпты» — каждый raw-ответ AI сохранится здесь как evidence.
            </p>
          </CardContent>
        </Card>
      )}

      {responses.map((r) => {
        const a = analyzeOf(r);
        const isOpen = open === r.id;
        return (
          <Card key={r.id}>
            <CardContent className="p-0">
              <button
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
                onClick={() => setOpen(isOpen ? null : r.id)}
              >
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {r.promptText || r.prompt.text}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {PROMPT_CATEGORY_LABELS[r.prompt.category] ?? r.prompt.category} ·{" "}
                    {r.provider ? `${r.provider}${r.model ? ` (${r.model})` : ""} · ` : ""}
                    {fmtDate(r.completedAt)}
                    {r.latencyMs ? ` · ${Math.round(r.latencyMs / 1000)}s` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.webSearchUsed && (
                    <Badge variant="info">web_search</Badge>
                  )}
                  {a?.brandMentioned && (
                    <Badge variant="success">упомянут</Badge>
                  )}
                  {a?.recommended && (
                    <Badge variant="info">
                      рекомендация{a?.recommendationPosition ? ` #${a.recommendationPosition}` : ""}
                    </Badge>
                  )}
                  <StatusBadge
                    status={
                      r.status === "SUCCESS"
                        ? "AI_RESPONSE_SUCCESS"
                        : r.status === "FAILED"
                        ? "AI_RESPONSE_FAILED"
                        : "AI_RESPONSE_PENDING"
                    }
                  />
                </div>
              </button>

              {isOpen && (
                <div className="space-y-5 border-t border-zinc-100 px-5 py-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Prompt
                    </h4>
                    <p className="mt-1.5 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-800">
                      {r.promptText || r.prompt.text}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      AI Response (raw)
                    </h4>
                    {r.status === "FAILED" ? (
                      <p className="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        {r.error || "Ошибка выполнения"}
                      </p>
                    ) : (
                      <pre className="mt-1.5 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 font-sans text-sm leading-relaxed text-zinc-800">
                        {r.rawResponse || "—"}
                      </pre>
                    )}
                  </div>

                  {a && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          Analysis
                        </h4>
                        <div className="mt-1.5 space-y-1.5 text-sm">
                          <p>
                            <span className="text-zinc-500">Бренд упомянут:</span>{" "}
                            <span className={a.brandMentioned ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
                              {a.brandMentioned ? "да" : "нет"}
                            </span>
                          </p>
                          <p>
                            <span className="text-zinc-500">Рекомендован:</span>{" "}
                            <span className={a.recommended ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
                              {a.recommended ? `да${a.recommendationPosition ? ` (позиция ${a.recommendationPosition})` : ""}` : "нет"}
                            </span>
                          </p>
                          {a.competitors.length > 0 && (
                            <p>
                              <span className="text-zinc-500">Конкуренты:</span>{" "}
                              <span className="font-medium">
                                {a.competitors.map((c) => `${c.name}${c.recommended ? " (рекомендован)" : ""}`).join(", ")}
                              </span>
                            </p>
                          )}
                          {a.products.length > 0 && (
                            <p>
                              <span className="text-zinc-500">Продукты:</span> {a.products.join(", ")}
                            </p>
                          )}
                          {a.claims.length > 0 && (
                            <div>
                              <p className="text-zinc-500">Утверждения:</p>
                              <ul className="mt-1 space-y-1">
                                {a.claims.map((c, i) => (
                                  <li key={i} className="text-zinc-700">
                                    {c.potentialIssue ? (
                                      <span className="rounded bg-amber-50 px-1 py-0.5 text-amber-800">{c.text}</span>
                                    ) : (
                                      c.text
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {a.insight && (
                            <p className="rounded-lg bg-blue-50 p-2.5 text-blue-800">{a.insight}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          Sources / Citations
                        </h4>
                        {(r.citations && Array.isArray(r.citations) && (r.citations as unknown[]).length > 0) ||
                        a.sources.length > 0 ||
                        a.citations.length > 0 ? (
                          <ul className="mt-1.5 space-y-1.5">
                            {(r.citations && Array.isArray(r.citations) ? (r.citations as { url?: string; title?: string | null; domain?: string | null; citationText?: string | null; sourceType?: string | null }[]) : [])
                              .filter((c) => c && c.url)
                              .map((c, i) => (
                                <li key={`prov-${i}`} className="flex items-start gap-2 text-sm">
                                  <a
                                    href={c.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {c.title || c.domain || c.url}
                                  </a>
                                  {c.sourceType && (
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                                      {c.sourceType}
                                    </Badge>
                                  )}
                                  {c.citationText && (
                                    <span className="ml-1 max-w-xs truncate text-xs text-zinc-400">
                                      «{c.citationText}»
                                    </span>
                                  )}
                                </li>
                              ))}
                            {a.sources.map((s, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                {s.url ? (
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {s.name || s.domain || s.url}
                                  </a>
                                ) : (
                                  <span className="text-zinc-700">{s.name || s.domain}</span>
                                )}
                                {s.official && (
                                  <Badge variant="success" className="px-1.5 py-0 text-[10px]">
                                    official
                                  </Badge>
                                )}
                                {s.competitorRelated && (
                                  <Badge variant="warning" className="px-1.5 py-0 text-[10px]">
                                    competitor
                                  </Badge>
                                )}
                              </li>
                            ))}
                            {a.citations.map((c, i) => (
                              <li key={`c-${i}`} className="flex items-center gap-2 text-sm">
                                {c.url && (
                                  <a
                                    href={c.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {c.title || c.domain || c.url}
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1.5 text-sm text-zinc-400">
                            {r.webSearchUsed
                              ? "Провайдер web_search не вернул citations для этого ответа."
                              : "Провайдер не вернул ссылки; в тексте ответа источники не упомянуты."}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
                    <span>Provider: {r.provider || "—"}</span>
                    <span>Model: {r.model || "—"}</span>
                    <span>Latency: {r.latencyMs ? `${Math.round(r.latencyMs / 1000)}s` : "—"}</span>
                    <span>Started: {fmtDate(r.startedAt)}</span>
                    <span>Completed: {fmtDate(r.completedAt)}</span>
                    {r.usage && (
                      <span>Tokens: {String((r.usage as { totalTokens?: number }).totalTokens ?? "—")}</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}