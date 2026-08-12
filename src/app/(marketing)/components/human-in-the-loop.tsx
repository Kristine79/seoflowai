"use client";
import { Activity, User, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

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
    badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    icon: "bg-emerald-400/10 text-emerald-400",
    dot: "bg-emerald-400",
    card: "hover:border-emerald-400/40",
  },
  amber: {
    badge: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    icon: "bg-amber-400/10 text-amber-400",
    dot: "bg-amber-400",
    card: "hover:border-amber-400/40",
  },
  rose: {
    badge: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    icon: "bg-rose-400/10 text-rose-400",
    dot: "bg-rose-400",
    card: "hover:border-rose-400/40",
  },
} as const;

export function HumanInTheLoop() {
  return (
    <section className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <SectionLabel onDark>Human-in-the-loop</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Автоматизация не должна ломаться там, где нужен человек.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            SEOFlow различает автоматизируемые шаги и ситуации, требующие ручного действия.
            Это не ограничение — это зрелая автоматизация, которая знает свои границы.
          </p>
        </div>

        {/* системный rail: три состояния */}
        <Reveal className="mt-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Три состояния системы
            </p>
            <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              {states.map((s, i) => {
                const style = accentStyles[s.accent];
                return (
                  <div key={s.key} className="flex flex-1 flex-col items-start gap-2 sm:flex-row sm:items-center">
                    <div
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${style.badge} sm:w-auto sm:flex-1`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">
                          {s.key}
                        </span>
                      </div>
                      <span className="hidden text-[10px] text-zinc-400 sm:block">{s.title}</span>
                    </div>
                    {i < states.length - 1 && (
                      <ArrowRight className="mx-auto h-4 w-4 shrink-0 rotate-90 text-zinc-600 sm:rotate-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* карточки состояний */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {states.map((s, i) => {
            const style = accentStyles[s.accent];
            return (
              <Reveal key={s.key} delay={i * 100}>
                <div className={`h-full rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-colors ${style.card}`}>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.icon}`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest ${style.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      {s.key}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.text}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {s.examples.map((ex) => (
                      <span key={ex} className="rounded-md border border-zinc-700/80 bg-zinc-800/80 px-2 py-1 text-xs text-zinc-400">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* зрелый подход — без обходов */}
        <Reveal className="mt-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:flex-row sm:items-start sm:gap-4 sm:p-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-300">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                SEOFlow не обходит CAPTCHA, Cloudflare и ограничения площадок.
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                Ни одна площадка не «зависает» в непонятном состоянии: каждый случай получает статус,
                причину и следующее действие. Система честно фиксирует ограничение и останавливается —
                без скрытых обходов и фейковых результатов.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
