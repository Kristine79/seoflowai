"use client";
import { Gauge, Zap, Clock } from "lucide-react";
import { CASE_SUMMARY, CASE_CATEGORIES, VERIFIED_PLATFORMS } from "../data/case-data";

export function AuditShowcase() {
  const max = Math.max(...CASE_CATEGORIES.map((c) => c.count));

  return (
    <section className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">SEO Audit</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Сначала понять, куда идти. Потом автоматизировать.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-zinc-600">
              SEOFlow оценивает платформы, помогает определить приоритеты и выделяет быстрые
              возможности — до того, как вы потратите время на подачу.
            </p>

            <div className="mt-8 space-y-4">
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
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 shadow-sm">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Распределение по категориям · 77 площадок
            </p>
            <div className="mt-5 space-y-3.5">
              {CASE_CATEGORIES.map((c) => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 truncate text-sm text-zinc-600 sm:w-52">{c.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200/70">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.count / max) * 100}%`, backgroundColor: c.color }}
                    />
                  </div>
                  <span className="w-6 text-right text-sm font-semibold text-zinc-700">{c.count}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-semibold text-zinc-900">
                Быстрые победы — размещено без сложностей
              </p>
              <div className="mt-2.5 divide-y divide-zinc-50">
                {VERIFIED_PLATFORMS.slice(0, 4).map((p) => (
                  <div key={p.platform} className="flex items-center justify-between py-1.5">
                    <span className="text-xs font-medium text-zinc-700">{p.platform}</span>
                    <span className="text-[10px] text-zinc-400">{p.note}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              {CASE_SUMMARY.total - CASE_SUMMARY.notApplicable} из {CASE_SUMMARY.total} площадок
              релевантны задаче размещения
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
