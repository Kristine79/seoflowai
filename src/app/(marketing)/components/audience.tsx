"use client";
import { Building2, User, Zap, TrendingUp, ArrowDown, Check } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

const audiences = [
  {
    icon: Building2,
    title: "SEO-агентства",
    text: "Управляйте directory-кампаниями клиентов из одного рабочего пространства.",
    problem: "Кампании клиентов живут в таблицах и переписке",
    result: "Все размещения и отчёты — в одном рабочем пространстве",
  },
  {
    icon: User,
    title: "In-house SEO teams",
    text: "Стандартизируйте повторяющиеся SEO-операции и размещения.",
    problem: "Повторяющиеся размещения отнимают время команды",
    result: "Единый workflow для операций и размещений",
  },
  {
    icon: Zap,
    title: "Marketing teams",
    text: "Подготавливайте и запускайте размещения без ручного хаоса.",
    problem: "Запуск размещений — ручной хаос из вкладок и файлов",
    result: "Управляемый процесс подготовки и подачи",
  },
  {
    icon: TrendingUp,
    title: "Growth teams",
    text: "Находите, оценивайте и масштабируйте новые возможности для размещения.",
    problem: "Новые площадки сложно оценивать вручную",
    result: "Оценка и приоритизация новых возможностей",
  },
];

export function Audience() {
  return (
    <section id="audience" className="scroll-mt-20 border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <SectionLabel>Для кого</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Для SEO-команд, которые регулярно работают с десятками площадок.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {audiences.map((a, i) => (
            <Reveal key={a.title} delay={i * 80}>
              <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                      <a.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold text-zinc-900">{a.title}</h3>
                  </div>
                  <span className="font-mono text-xs font-semibold text-zinc-300">0{i + 1}</span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-zinc-500">{a.text}</p>

                <div className="mt-5 flex-1 border-t border-zinc-100 pt-4">
                  <div className="rounded-xl bg-zinc-50 px-4 py-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                      Проблема
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">{a.problem}</p>
                  </div>
                  <div className="my-2 flex justify-center">
                    <ArrowDown className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-blue-500">
                      <Check className="h-3 w-3" />
                      Результат
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-800">{a.result}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
