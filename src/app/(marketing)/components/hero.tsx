import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { CampaignCard } from "./campaign-card";
import { CASE_SUMMARY } from "../data/case-data";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.08),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-blue-600">
              SEO Automation Platform
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              SEO-каталоги без ручной рутины.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
              SEOFlow помогает исследовать площадки, готовить контент, запускать directory-кампании
              и отслеживать результат — в одном рабочем пространстве.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/campaigns"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Начать кампанию
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-6 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
              >
                <Play className="h-4 w-4 text-zinc-400" />
                Посмотреть, как это работает
              </a>
            </div>

            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-zinc-400">
              AI-подготовка · Автоматизация · Human-in-the-loop · Отчётность
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-blue-600/10 to-transparent blur-2xl" aria-hidden />
            <div className="relative space-y-4">
              <CampaignCard />
              <div className="grid grid-cols-3 gap-4">
                <HeroStat value={CASE_SUMMARY.total} label="площадок в кампании" />
                <HeroStat value={CASE_SUMMARY.verified} label="размещено" tone="emerald" />
                <HeroStat value={CASE_SUMMARY.needsHuman} label="требуют действия" tone="amber" />
              </div>
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div
        className={
          tone === "emerald" ? "text-2xl font-bold text-emerald-600"
          : tone === "amber" ? "text-2xl font-bold text-amber-600"
          : "text-2xl font-bold text-zinc-900"
        }
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
    </div>
  );
}
