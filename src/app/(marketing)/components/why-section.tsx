"use client";
import { Sparkles, ListChecks, User, Layers, BarChart3 } from "lucide-react";

const reasons = [
  { icon: Sparkles, title: "AI-assisted" },
  { icon: ListChecks, title: "Workflow-driven" },
  { icon: User, title: "Human-in-the-loop" },
  { icon: Layers, title: "Platform-aware" },
  { icon: BarChart3, title: "Evidence & Reporting" },
];

export function WhySection() {
  return (
    <section className="border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Почему SEOFlow</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Не очередной список «фич». Пять принципов системы.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-600">
            Каждая возможность работает в рамках одного подхода: автоматизация там, где она
            уместна, контроль человека — там, где он нужен.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {reasons.map((r) => (
            <div key={r.title} className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white px-4 py-2">
              <r.icon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-zinc-800">{r.title}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-zinc-900">
            SEOFlow не пытается заменить SEO-специалиста.
          </h3>
          <p className="mt-2 leading-relaxed text-zinc-600">
            Он убирает повторяющуюся операционную работу, но оставляет человеку контроль над
            решениями и публикацией. Если площадка требует ручного шага — система честно передаст
            его вам, а не сделает вид, что всё «автоматизировано».
          </p>
        </div>
      </div>
    </section>
  );
}
