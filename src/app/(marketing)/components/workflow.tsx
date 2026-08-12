import { Search, Target, Sparkles, Rocket, CheckCircle2, FileText } from "lucide-react";

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
    title: "AI-подготовка",
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
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Решение</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Одна кампания вместо десятков разрозненных действий.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-600">
            Каждая directory-кампания проходит один и тот же управляемый путь — от анализа до отчёта.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="group relative rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-xs text-zinc-300">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{step.text}</p>
              <p className="mt-3 font-mono text-xs text-zinc-400">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}