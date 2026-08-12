"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { CASE_SUMMARY, CASE_STATUSES, CASE_PLATFORMS } from "../data/case-data";

const STATUS_STYLE: Record<string, string> = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  submitted: "border-blue-200 bg-blue-50 text-blue-700",
  needsHuman: "border-amber-200 bg-amber-50 text-amber-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
  notApplicable: "border-zinc-200 bg-zinc-50 text-zinc-500",
};

const STATUS_LABEL: Record<string, string> = {
  verified: "Размещено",
  submitted: "Заявка отправлена",
  needsHuman: "Требуется действие",
  blocked: "Площадка недоступна",
  notApplicable: "Не подходит",
};

export function CaseStudy() {
  const [filter, setFilter] = useState<string>("all");

  const platforms = filter === "all" ? CASE_PLATFORMS : CASE_PLATFORMS.filter((p) => p.status === filter);

  return (
    <section id="case" className="scroll-mt-20 border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Реальный кейс · 2026
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            77 площадок. Одна реальная кампания.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-600">
            Кампания по размещению ITllect в business и agency каталогах. Каждая площадка прошла
            путь: анализ → подготовка → подача → проверка. Без выдуманных цифр — только реальные
            статусы кампании.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CASE_STATUSES.map((s) => (
            <div key={s.key} className="rounded-2xl border border-zinc-200 bg-white p-5 text-center shadow-sm">
              <div
                className={cn(
                  "text-3xl font-bold",
                  s.color === "emerald" && "text-emerald-600",
                  s.color === "blue" && "text-blue-600",
                  s.color === "amber" && "text-amber-600",
                  s.color === "rose" && "text-rose-600",
                  s.color === "zinc" && "text-zinc-500"
                )}
              >
                {s.count}
              </div>
              <div className="mt-1 text-sm text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
            <p className="text-sm font-medium text-zinc-900">
              Площадки кампании
              <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">
                {platforms.length}
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "all", label: "Все" },
                ...CASE_STATUSES.map((s) => ({ key: s.key, label: `${s.label} · ${s.count}` })),
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilter(t.key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    filter === t.key
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-px bg-zinc-100 sm:grid-cols-2 lg:grid-cols-3">
            {platforms.map((p) => (
              <div key={p.name} className="flex items-center justify-between bg-white px-5 py-3">
                <span className="truncate text-sm font-medium text-zinc-800">{p.name}</span>
                <span className={cn("ml-3 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", STATUS_STYLE[p.status])}>
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-4">
            <p className="text-xs text-zinc-400">
              {platforms.length} из {CASE_SUMMARY.total} площадок · наиболее показательные результаты кампании
            </p>
            <a
              href="/SEOFlow-77-Platform-Campaign-Report.xlsx"
              download="SEOFlow-77-Platform-Campaign-Report.xlsx"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
            >
              <Download className="h-3.5 w-3.5" />
              Скачать полный отчёт
            </a>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/case-studies/seo-agency-directory-campaign"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
          >
            Посмотреть полный кейс
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
