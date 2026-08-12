"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CampaignCard } from "./campaign-card";
import { CASE_SUMMARY } from "../data/case-data";

const points = [
  {
    title: "Прогресс и статусы",
    text: "Каждая площадка имеет статус: размещено, отправлено, требует действия, заблокировано.",
  },
  {
    title: "Next actions",
    text: "Система подсказывает следующее действие — не нужно вспоминать, на чём остановились.",
  },
  {
    title: "Prepared content",
    text: "Готовый AI-контент хранится вместе с кампанией, а не в отдельных файлах.",
  },
  {
    title: "Submission results",
    text: "Результат подачи фиксируется с доказательством — скриншотом, URL или ответом сервера.",
  },
];

export function CampaignShowcase() {
  return (
    <section className="border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Кампании</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              От первой площадки до финального отчёта — в одной кампании.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-zinc-600">
              Кампания — единая точка управления: площадки, контент, подачи, проверки и отчёты
              собираются в одном месте.
            </p>

            <ul className="mt-8 space-y-4">
              {points.map((p) => (
                <li key={p.title} className="flex gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{p.title}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/campaigns"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Создать кампанию
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <span className="text-sm text-zinc-400">
                {CASE_SUMMARY.total} площадок · реальная кампания
              </span>
            </div>
          </div>

          <CampaignCard />
        </div>
      </div>
    </section>
  );
}
