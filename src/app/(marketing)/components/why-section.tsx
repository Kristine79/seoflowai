"use client";
import { Sparkles, ListChecks, User, Layers, BarChart3, Quote } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

const reasons = [
  { icon: Sparkles, title: "AI-assisted", text: "Подготовка и исследование — за систему" },
  { icon: ListChecks, title: "Workflow-driven", text: "Каждая кампания проходит один управляемый путь" },
  { icon: User, title: "Human-in-the-loop", text: "Ручные шаги честно передаются человеку", key: true },
  { icon: Layers, title: "Platform-aware", text: "Требования каждой площадки учитываются" },
  { icon: BarChart3, title: "Evidence & Reporting", text: "Каждый результат имеет доказательство", key: true },
];

export function WhySection() {
  return (
    <section className="border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          {/* Пять принципов */}
          <div>
            <SectionLabel>Почему SEOFlow</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Не очередной список «фич». Пять принципов системы.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600">
              Каждая возможность работает в рамках одного подхода: автоматизация там, где она
              уместна, контроль человека — там, где он нужен.
            </p>

            <ul className="mt-9 divide-y divide-zinc-200/70 border-y border-zinc-200/70">
              {reasons.map((r, i) => (
                <li key={r.title} className="group flex items-center gap-4 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-blue-600 shadow-sm transition-colors group-hover:border-blue-300">
                    <r.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] font-semibold text-zinc-300">0{i + 1}</span>
                      <h3 className="text-sm font-semibold text-zinc-900">{r.title}</h3>
                      {r.key && (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-600">
                          ключевой
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 pl-6 text-xs text-zinc-500">{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Product philosophy */}
          <Reveal delay={120}>
            <div className="sticky top-24 flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-7 sm:p-8">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-zinc-200">
                    <Quote className="h-5 w-5" />
                  </div>
                  <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Product philosophy
                  </p>
                </div>
                <h3 className="mt-6 text-xl font-semibold leading-snug tracking-tight text-white sm:text-2xl">
                  SEOFlow не пытается заменить SEO-специалиста.
                </h3>
                <p className="mt-3 leading-relaxed text-zinc-400">
                  Он убирает повторяющуюся операционную работу, но оставляет человеку контроль над
                  решениями и публикацией. Если площадка требует ручного шага — система честно
                  передаст его вам, а не сделает вид, что всё «автоматизировано».
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3 border-t border-zinc-800 pt-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  <span className="font-semibold text-zinc-200">Решение остаётся за человеком.</span>{" "}
                  Система отвечает за повторяемую работу.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
