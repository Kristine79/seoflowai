"use client";
import {
  Gauge,
  ListChecks,
  Layers,
  FileText,
  Hash,
  TrendingUp,
  Lightbulb,
  Rocket,
  ArrowRight,
  Check,
} from "lucide-react";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";
import { CASE_SUMMARY, CASE_CATEGORIES, VERIFIED_PLATFORMS, COMPANY_PROFILE } from "../data/case-data";

export function AiFeatures() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <SectionLabel>Возможности</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              AI берёт на себя подготовительную работу.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
              Исследование, приоритизация и подготовка контента — самая повторяемая часть работы.
              SEOFlow делает её за вас, а решения остаются за человеком.
            </p>
          </div>

          {/* framing: что делает AI */}
          <div className="flex flex-wrap items-center gap-2">
            {["исследует", "приоритизирует", "готовит", "рекомендует"].map((v, i, arr) => (
              <div key={v} className="flex items-center gap-2">
                <span className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm">
                  {v}
                </span>
                {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-zinc-300" />}
              </div>
            ))}
            <span className="ml-1 text-xs text-zinc-400">— человек решает</span>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {/* Панель 1: SEO Audit */}
          <Reveal className="lg:col-span-1">
            <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">SEO Audit</h3>
                  <p className="text-xs text-zinc-500">Оценка площадок до старта работы</p>
                </div>
              </div>

              <ul className="mt-5 space-y-3 border-t border-zinc-100 pt-5">
                {[
                  { icon: Gauge, title: "SEO-балл", text: "Ценность, усилия и автоматизируемость каждой площадки" },
                  { icon: ListChecks, title: "Анализ платформ", text: "Требования и ограничения учитываются до подачи" },
                  { icon: Layers, title: "Приоритизация", text: "Ранжирование по ценности, быстрые победы отдельно" },
                ].map((c) => (
                  <li key={c.title} className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                      <c.icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{c.title}</p>
                      <p className="text-xs leading-relaxed text-zinc-500">{c.text}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* snippet: реальные категории */}
              <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  Проанализировано · {CASE_SUMMARY.total} площадок
                </p>
                <div className="mt-3 space-y-2">
                  {CASE_CATEGORIES.slice(0, 3).map((c) => (
                    <div key={c.label} className="flex items-center gap-2.5">
                      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: c.color }} />
                      <span className="flex-1 truncate text-[11px] text-zinc-600">{c.label}</span>
                      <span className="text-[11px] font-semibold tabular-nums text-zinc-800">{c.count}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-zinc-200/70 pt-2.5 text-[10px] text-zinc-400">
                  {CASE_SUMMARY.total - CASE_SUMMARY.notApplicable} из {CASE_SUMMARY.total} релевантны размещению
                </p>
              </div>
            </div>
          </Reveal>

          {/* Панель 2: AI Content */}
          <Reveal delay={100} className="lg:col-span-1">
            <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">AI Content Generator</h3>
                  <p className="text-xs text-zinc-500">Контент под конкретную площадку</p>
                </div>
              </div>

              <ul className="mt-5 space-y-3 border-t border-zinc-100 pt-5">
                {[
                  { icon: Hash, title: "Platform-specific описания", text: "Один профиль — адаптированный контент для каждой площадки" },
                  { icon: TrendingUp, title: "Keyword research", text: "Ключевые слова под направление компании и тематику каталога" },
                ].map((c) => (
                  <li key={c.title} className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                      <c.icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{c.title}</p>
                      <p className="text-xs leading-relaxed text-zinc-500">{c.text}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* snippet: from → to */}
              <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  Из профиля — под площадку
                </p>
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
                    <p className="text-[11px] font-medium text-zinc-800">{COMPANY_PROFILE.name} — {COMPANY_PROFILE.category}</p>
                    <p className="truncate text-[10px] text-zinc-400">{COMPANY_PROFILE.services}</p>
                  </div>
                  <ArrowRight className="mx-auto h-3.5 w-3.5 rotate-90 text-blue-500" />
                  <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2">
                    <p className="text-[11px] font-medium text-blue-800">Описание для каталога агентств</p>
                    <p className="text-[10px] leading-relaxed text-blue-600">
                      Краткое описание услуг и ключевые слова — по требованиям площадки
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Панель 3: Рекомендации и запуск */}
          <Reveal delay={200} className="lg:col-span-1">
            <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">Рекомендации и запуск</h3>
                  <p className="text-xs text-zinc-500">План и готовая кампания</p>
                </div>
              </div>

              <ul className="mt-5 space-y-3 border-t border-zinc-100 pt-5">
                {[
                  { icon: Lightbulb, title: "SEO рекомендации", text: "Стратегические рекомендации по результатам аудита" },
                  { icon: Rocket, title: "Подготовка кампании", text: "Из аудита и профиля собирается готовая к запуску кампания" },
                ].map((c) => (
                  <li key={c.title} className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                      <c.icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{c.title}</p>
                      <p className="text-xs leading-relaxed text-zinc-500">{c.text}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* snippet: 7-day plan + quick wins */}
              <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  7-дневный план · первые шаги
                </p>
                <ul className="mt-3 space-y-2">
                  {[
                    "Проверить быстрые победы — размещено без сложностей",
                    "Подать заявки на релевантные каталоги",
                    "Передать ручные шаги человеку",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[11px] text-zinc-600">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-zinc-200/70 pt-2.5">
                  {VERIFIED_PLATFORMS.slice(0, 4).map((p) => (
                    <span key={p.platform} className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 ring-1 ring-zinc-200">
                      {p.platform}
                    </span>
                  ))}
                  <span className="text-[10px] text-zinc-400">— быстрые победы кейса</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
