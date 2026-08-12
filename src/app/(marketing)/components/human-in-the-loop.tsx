import { Activity, User, AlertCircle } from "lucide-react";

const states = [
  {
    icon: Activity,
    key: "AUTOMATED",
    title: "Площадка доступна",
    text: "Система выполняет workflow: заполняет данные, отправляет форму, фиксирует результат.",
    examples: ["GoodFirms", "DesignRush", "Digital Agency Net"],
    accent: "emerald",
  },
  {
    icon: User,
    key: "HUMAN ACTION",
    title: "Нужен login / OAuth / подтверждение",
    text: "Задача передаётся человеку: войти, подтвердить, пройти капчу — и продолжить.",
    examples: ["TopSEOs", "Alignable", "Sitejabber"],
    accent: "amber",
  },
  {
    icon: AlertCircle,
    key: "BLOCKED",
    title: "Cloudflare / внешние ограничения",
    text: "Система фиксирует блокировку и причину вместо бесконечных повторных попыток.",
    examples: ["Yellow Pages", "Manta", "Superpages"],
    accent: "rose",
  },
];

const accentStyles = {
  emerald: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "bg-emerald-50 text-emerald-600",
    dot: "bg-emerald-500",
  },
  amber: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    icon: "bg-amber-50 text-amber-600",
    dot: "bg-amber-500",
  },
  rose: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "bg-rose-50 text-rose-600",
    dot: "bg-rose-500",
  },
} as const;

export function HumanInTheLoop() {
  return (
    <section className="border-t border-zinc-100 bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-blue-400">
            Human-in-the-loop
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Автоматизация не должна ломаться там, где нужен человек.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-400">
            SEOFlow различает автоматизируемые шаги и ситуации, требующие ручного действия.
            Это не ограничение — это зрелая автоматизация, которая знает свои границы.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {states.map((s) => {
            const style = accentStyles[s.accent];
            return (
              <div key={s.key} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.icon}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-widest ${style.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {s.key}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.text}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {s.examples.map((ex) => (
                    <span key={ex} className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Ни одна площадка не «зависает» в непонятном состоянии: каждый случай получает статус,
          причину и следующее действие.
        </p>
      </div>
    </section>
  );
}