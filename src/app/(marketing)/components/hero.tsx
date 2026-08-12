"use client";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, FileText, Layers, Search, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { CASE_SUMMARY } from "../data/case-data";

const heroSteps = [
  { label: "Аудит", icon: Search, state: "done" },
  { label: "Выбор", icon: Target, state: "done" },
  { label: "Подготовка", icon: Sparkles, state: "active" },
  { label: "Подача", icon: Layers, state: "pending" },
  { label: "Проверка", icon: CheckCircle2, state: "pending" },
  { label: "Отчёт", icon: FileText, state: "pending" },
] as const;

export function Hero() {
  const processed = CASE_SUMMARY.verified + CASE_SUMMARY.submitted + CASE_SUMMARY.needsHuman;
  const progressPct = Math.round((processed / CASE_SUMMARY.total) * 100);

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.07),transparent_62%)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-32 lg:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* ---- Левая часть: заявление ---- */}
          <div className="min-w-0 animate-fade-up">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-blue-600">
              SEO Automation Platform
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-zinc-950 sm:text-5xl lg:text-[3.4rem]">
              SEO-каталоги без ручной рутины.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
              SEOFlow помогает исследовать площадки, готовить контент, запускать directory-кампании
              и отслеживать результат — в одном рабочем пространстве.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/campaigns"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
              >
                Начать кампанию
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-6 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
              >
                Как это работает
              </a>
            </div>

            <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-zinc-400">
              AI-подготовка <span className="text-zinc-300">·</span> Автоматизация
              <span className="text-zinc-300">·</span> Human-in-the-loop
              <span className="text-zinc-300">·</span> Отчётность
            </p>
          </div>

          {/* ---- Правая часть: живой product mockup ---- */}
          <div className="relative min-w-0 animate-fade-up [animation-delay:120ms]">
            <div className="relative mx-auto max-w-[560px] lg:max-w-none">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_60px_-24px_rgba(24,24,27,0.25)]">
                {/* window chrome */}
                <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5">
                  <div className="flex gap-1.5" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
                  </div>
                  <div className="flex-1 truncate rounded-md bg-white px-3 py-1 text-center font-mono text-[11px] text-zinc-400 ring-1 ring-zinc-200">
                    app.seoflow.ai/campaigns/77-platforms
                  </div>
                </div>

                {/* campaign header */}
                <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                      77
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">77 Platforms · ITllect</p>
                      <p className="text-xs text-zinc-500">Business и agency каталоги</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                    Активна
                  </span>
                </div>

                <div className="space-y-4 px-5 py-4">
                  {/* workflow steps */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {heroSteps.map((step, i) => (
                      <div key={step.label} className="flex shrink-0 items-center gap-1">
                        <div
                          className={cn(
                            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium",
                            step.state === "done" && "bg-blue-50 text-blue-700",
                            step.state === "active" && "bg-blue-600 text-white shadow-sm",
                            step.state === "pending" && "text-zinc-400"
                          )}
                        >
                          <step.icon className="h-3 w-3" />
                          {step.label}
                        </div>
                        {i < heroSteps.length - 1 && (
                          <div
                            className={cn(
                              "h-px w-3",
                              step.state === "done" ? "bg-blue-300" : "bg-zinc-200"
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* status distribution */}
                  <div className="grid grid-cols-5 gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3">
                    {[
                      { value: CASE_SUMMARY.verified, label: "Размещено", color: "text-emerald-600" },
                      { value: CASE_SUMMARY.submitted, label: "Отправлено", color: "text-blue-600" },
                      { value: CASE_SUMMARY.needsHuman, label: "Действие", color: "text-amber-600" },
                      { value: CASE_SUMMARY.blocked, label: "Блок", color: "text-rose-600" },
                      { value: CASE_SUMMARY.notApplicable, label: "Не подходит", color: "text-zinc-400" },
                    ].map((s) => (
                      <div key={s.label} className="min-w-0 text-center">
                        <div className={cn("text-sm font-semibold tabular-nums", s.color)}>{s.value}</div>
                        <div className="mt-0.5 truncate text-[9.5px] leading-tight text-zinc-400">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* progress */}
                  <div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-zinc-600">Ход кампании</span>
                      <span className="font-mono tabular-nums text-zinc-500">{progressPct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-blue-600 animate-grow-x"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] text-zinc-400">
                      <span>{processed} из {CASE_SUMMARY.total} обработано</span>
                      <span>осталось {CASE_SUMMARY.total - processed}</span>
                    </div>
                  </div>

                  {/* next action */}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">
                        !
                      </span>
                      <p className="truncate text-xs text-zinc-700">
                        Следующее действие:{" "}
                        <span className="font-medium text-zinc-900">проверка 23 заявок</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-blue-600">Открыть →</span>
                  </div>
                </div>
              </div>

              {/* floating stat card */}
              <div className="absolute -bottom-5 left-4 hidden items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg sm:flex">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                  <span className="text-[11px] font-medium text-zinc-600">Профили в каталогах:</span>
                  <span className="text-sm font-semibold text-emerald-600">5</span>
                </div>
                <div className="h-4 w-px bg-zinc-200" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-zinc-600">Опубликовано:</span>
                  <span className="text-sm font-semibold text-zinc-900">Wellfound · Bark.com</span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <HeroStat value={CASE_SUMMARY.total} label="площадок в кампании" />
              <HeroStat value={CASE_SUMMARY.verified} label="размещено" tone="emerald" />
              <HeroStat value={CASE_SUMMARY.needsHuman} label="требуют действия" tone="amber" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  value,
  label,
  tone = "default",
}: {
  value: number;
  label: string;
  tone?: "default" | "emerald" | "amber";
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3.5 shadow-sm">
      <div
        className={cn(
          "text-2xl font-semibold tabular-nums tracking-tight",
          tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-zinc-900"
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs leading-snug text-zinc-500">{label}</div>
    </div>
  );
}
