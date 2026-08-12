"use client";
import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-zinc-800 bg-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(37,99,235,0.12),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:py-32">
        <Reveal>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-blue-400">
            Начать
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Следующая SEO-кампания не должна начинаться с таблицы.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Создайте кампанию, подготовьте площадки и управляйте всем процессом в одном рабочем
            пространстве.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/campaigns"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/25 sm:w-auto"
            >
              Начать кампанию
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href="/case-studies/seo-agency-directory-campaign"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 px-8 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800 sm:w-auto"
            >
              <FileText className="h-4 w-4 text-zinc-400" />
              Посмотреть кейс 77 Platforms
            </a>
          </div>
          <p className="mt-8 text-xs text-zinc-500">
            Реальная кампания: 77 площадок · 5 размещено · 7 отправлено · 23 требуют действия
          </p>
        </Reveal>
      </div>
    </section>
  );
}
