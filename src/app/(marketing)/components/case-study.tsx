"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";
import {
  CASE_SUMMARY,
  CASE_STATUSES,
  CASE_PLATFORMS,
  COMPANY_PROFILE,
} from "../data/case-data";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

const STATUS_TONE: Record<string, "emerald" | "blue" | "amber" | "rose" | "zinc"> = {
  verified: "emerald",
  submitted: "blue",
  needsHuman: "amber",
  blocked: "rose",
  notApplicable: "zinc",
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
        {/* Заголовок */}
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel className="justify-center">Реальный кейс · 2026</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            77 площадок. Одна реальная кампания.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            Кампания по размещению digital-агентства в business и agency каталогах. Каждая площадка прошла
            путь: анализ → подготовка → подача → проверка. Без выдуманных цифр — только реальные
            статусы кампании.
          </p>
        </div>

        {/* Сводка кампании */}
        <Reveal className="mt-12">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-zinc-100 bg-zinc-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm">
                  77
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Кампания «{CASE_SUMMARY.total} Platforms» · {COMPANY_PROFILE.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Каталоги и отраслевые площадки
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-400">
                статусы — из финального отчёта
              </p>
            </div>

            <div className="grid grid-cols-2 divide-zinc-100 sm:grid-cols-3 lg:grid-cols-5">
              {CASE_STATUSES.map((s) => (
                <div
                  key={s.key}
                  className="flex flex-col justify-between gap-3 p-5 lg:[&:not(:first-child)]:border-l lg:border-zinc-100"
                >
                  <div className="flex items-center gap-2">
                    <StatusDot tone={STATUS_TONE[s.key]} />
                    <span className="text-xs font-medium text-zinc-400">
                      {s.label}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "text-4xl font-semibold tabular-nums tracking-tight",
                      s.color === "emerald" && "text-emerald-600",
                      s.color === "blue" && "text-blue-600",
                      s.color === "amber" && "text-amber-600",
                      s.color === "rose" && "text-rose-600",
                      s.color === "zinc" && "text-zinc-500"
                    )}
                  >
                    {s.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Таблица площадок */}
        <Reveal delay={120} className="mt-8">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {/* фильтры */}
            <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
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
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* desktop: таблица */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-zinc-100 bg-zinc-50/60 px-5 py-2.5">
                <span className="text-xs font-medium text-zinc-400">Площадка</span>
                <span className="w-44 text-right text-xs font-medium text-zinc-400">
                  Статус
                </span>
              </div>
              <div className="divide-y divide-zinc-50">
                {platforms.map((p) => (
                  <div
                    key={p.name}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-2.5 transition-colors hover:bg-zinc-50/70"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium text-zinc-800">{p.name}</span>
                    </div>
                    <StatusBadge
                      tone={STATUS_TONE[p.status]}
                      label={STATUS_LABEL[p.status]}
                      className="w-44 justify-end"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* mobile: карточки */}
            <div className="divide-y divide-zinc-50 sm:hidden">
              {platforms.map((p) => (
                <div key={p.name} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-zinc-800">{p.name}</span>
                  </div>
                  <StatusBadge
                    tone={STATUS_TONE[p.status]}
                    label={STATUS_LABEL[p.status]}
                    className="shrink-0"
                  />
                </div>
              ))}
            </div>

            {/* footer таблицы */}
            <div className="flex flex-col gap-3 border-t border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-400">
                {platforms.length} из {CASE_SUMMARY.total} площадок · наиболее показательные результаты кампании
              </p>
              <a
                href="/SEOFlow-77-Platform-Campaign-Report.xlsx"
                download="SEOFlow-77-Platform-Campaign-Report.xlsx"
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
              >
                <Download className="h-3.5 w-3.5" />
                Скачать полный отчёт
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-10 text-center">
          <Link
            href="/case-studies/seo-agency-directory-campaign"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
          >
            Посмотреть полный кейс
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
