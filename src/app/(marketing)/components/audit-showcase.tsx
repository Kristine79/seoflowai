"use client";
import { Gauge, Zap, Clock, Check } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";
import { CASE_SUMMARY, CASE_CATEGORIES, VERIFIED_PLATFORMS } from "../data/case-data";

export function AuditShowcase({ embedded = false }: { embedded?: boolean }) {
  const max = Math.max(...CASE_CATEGORIES.map((c) => c.count));
  const relevant = CASE_SUMMARY.total - CASE_SUMMARY.notApplicable;

  const content = (
    <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-16">
      <div>
        {!embedded && <SectionLabel>SEO Audit</SectionLabel>}
        {!embedded && (
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Сначала понять, куда идти. Потом автоматизировать.
          </h2>
        )}
        {!embedded && (
          <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-600">
            SEOFlow оценивает платформы, помогает определить приоритеты и выделяет быстрые
            возможности — до того, как вы потратите время на подачу.
          </p>
        )}

        <ol className="mt-8 space-y-5">
              {[
                {
                  icon: Gauge,
                  title: "SEO score",
                  text: "Каждая площадка получает балл по ценности, усилиям и автоматизируемости.",
                },
                {
                  icon: Zap,
                  title: "Quick wins",
                  text: "Площадки с высоким эффектом и низкими усилиями выделяются отдельно.",
                },
                {
                  icon: Clock,
                  title: "7-day plan",
                  text: "Из аудита собирается план действий и рекомендации по приоритетам.",
                },
              ].map((item, i) => (
                <li key={item.title} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold text-blue-600">0{i + 1}</span>
                      <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Отчётная панель аудита */}
          <Reveal delay={120}>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-zinc-900 px-6 py-4">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-300">
                  SEO Audit · {CASE_SUMMARY.total} площадок
                </p>
                <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-[10px] font-medium text-zinc-300">
                  отчёт по кампании
                </span>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Распределение по категориям
                  </p>
                  <div className="mt-3.5 space-y-3">
                    {CASE_CATEGORIES.map((c, i) => (
                      <div key={c.label} className="flex items-center gap-3">
                        <span className="flex w-56 shrink-0 items-center gap-2 text-sm text-zinc-600">
                          <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: c.color }} />
                          <span className="truncate">{c.label}</span>
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full animate-grow-x"
                            style={{ width: `${(c.count / max) * 100}%`, backgroundColor: c.color, animationDelay: `${i * 100}ms` }}
                          />
                        </div>
                        <span className="w-6 text-right text-sm font-semibold tabular-nums text-zinc-700">
                          {c.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <p className="text-xs font-semibold text-zinc-900">
                    Быстрые победы — размещено без сложностей
                  </p>
                  <div className="mt-2.5 divide-y divide-zinc-200/60">
                    {VERIFIED_PLATFORMS.slice(0, 4).map((p) => (
                      <div key={p.platform} className="flex items-center justify-between py-2">
                        <span className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                          <Check className="h-3 w-3 text-emerald-500" />
                          {p.platform}
                        </span>
                        <span className="max-w-[55%] truncate text-[10px] text-zinc-400">{p.note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                  <span>
                    {relevant} из {CASE_SUMMARY.total} площадок релевантны задаче размещения
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">relevant / total</span>
                </p>
              </div>
            </div>
          </Reveal>
      </div>
  );

  if (embedded) return content;

  return (
    <section className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">{content}</div>
    </section>
  );
}
