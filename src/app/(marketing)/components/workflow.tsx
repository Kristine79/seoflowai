"use client";
import { Search, Target, Sparkles, Rocket, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

const steps = [
  {
    icon: Search,
    title: "Анализ",
    text: "SEOFlow оценивает площадки и возможности размещения.",
    detail: "SEO-балл, категория, требования платформы",
  },
  {
    icon: Target,
    title: "Приоритизация",
    text: "Система помогает определить, какие площадки стоит проходить в первую очередь.",
    detail: "Быстрые победы и высокоценные платформы",
  },
  {
    icon: Sparkles,
    title: "Подготовка",
    text: "Контент и данные адаптируются под конкретную площадку.",
    detail: "Из единого профиля компании",
  },
  {
    icon: Rocket,
    title: "Подача",
    text: "Кампания управляет процессом размещения.",
    detail: "Автоматически или с участием человека",
  },
  {
    icon: CheckCircle2,
    title: "Проверка",
    text: "Результаты фиксируются, а требующие внимания случаи передаются человеку.",
    detail: "Скриншоты, URL, статус каждого шага",
  },
  {
    icon: FileText,
    title: "Отчёт",
    text: "Каждый результат остаётся в единой системе.",
    detail: "Статусы и доказательства по каждой площадке",
  },
];

export function Workflow() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <SectionLabel>Решение</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Одна кампания вместо десятков разрозненных действий.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
              Каждая directory-кампания проходит один и тот же управляемый путь — от анализа до
              отчёта.
            </p>
          </div>
          <p className="text-xs text-zinc-400">
            Единый пайплайн · 6 этапов
          </p>
        </div>

        <Reveal className="mt-12">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 sm:p-6 lg:p-8">
            {/* desktop: горизонтальный workflow */}
            <div className="relative hidden lg:block">
              <div
                aria-hidden
                className="absolute inset-x-6 top-8 h-px bg-gradient-to-r from-blue-600/0 via-blue-600/40 to-blue-600/0"
              />
              <ol className="relative grid grid-cols-6 gap-6">
                {steps.map((step, i) => (
                  <li key={step.title} className="group">
                    <div className="flex h-4 w-4 -translate-y-2 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-sm transition-transform group-hover:scale-110" />
                    <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-blue-600 shadow-sm transition-colors group-hover:border-blue-300 group-hover:text-blue-700">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-600">
                        0{i + 1}
                      </span>
                      <h3 className="text-sm font-semibold text-zinc-900">{step.title}</h3>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{step.text}</p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                      {step.detail}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            {/* mobile/tablet: вертикальный workflow */}
            <ol className="relative space-y-0 lg:hidden">
              {steps.map((step, i) => (
                <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < steps.length - 1 && (
                    <span aria-hidden className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px bg-zinc-200" />
                  )}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-blue-600 shadow-sm">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 pt-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-600">0{i + 1}</span>
                      <h3 className="text-sm font-semibold text-zinc-900">{step.title}</h3>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600">{step.text}</p>
                    <p className="mt-1.5 text-xs text-zinc-400">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 hidden items-center justify-center gap-2 border-t border-zinc-200/70 pt-6 lg:flex">
              <span className="text-xs text-zinc-400">
                Каждый этап завершается статусом и следующей точкой контроля
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
