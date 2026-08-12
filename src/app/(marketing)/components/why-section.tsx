import { Sparkles, ListChecks, User, Layers, BarChart3 } from "lucide-react";

const reasons = [
  {
    icon: Sparkles,
    title: "AI-assisted",
    text: "AI помогает исследовать, приоритизировать и готовить контент.",
  },
  {
    icon: ListChecks,
    title: "Workflow-driven",
    text: "Процесс строится как последовательная campaign workflow, а не набор разрозненных действий.",
  },
  {
    icon: User,
    title: "Human-in-the-loop",
    text: "Система знает, когда передать действие человеку.",
  },
  {
    icon: Layers,
    title: "Platform-aware",
    text: "Каждая площадка может иметь собственные требования, ограничения и состояния.",
  },
  {
    icon: BarChart3,
    title: "Evidence & Reporting",
    text: "Результаты кампании остаются структурированными и доступны для отчётности.",
  },
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
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-5">
          {reasons.map((r) => (
            <div key={r.title} className="bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-900">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{r.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-zinc-900">
            SEOFlow не пытается заменить SEO-специалиста.
          </h3>
          <p className="mt-2 max-w-3xl leading-relaxed text-zinc-600">
            Он убирает повторяющуюся операционную работу, но оставляет человеку контроль над
            решениями и публикацией. Если площадка требует ручного шага — система честно передаст
            его вам, а не сделает вид, что всё «автоматизировано».
          </p>
        </div>
      </div>
    </section>
  );
}