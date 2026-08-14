"use client";
import Link from "next/link";
import { ArrowUpRight, CircleDot, ListTodo, FileStack, ShieldCheck } from "lucide-react";
import { CampaignCard } from "./campaign-card";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";
import { CASE_SUMMARY } from "../data/case-data";

const points = [
  {
    icon: CircleDot,
    title: "Прогресс и статусы",
    text: "Каждая площадка имеет статус: размещено, отправлено, требует действия, заблокировано.",
  },
  {
    icon: ListTodo,
    title: "Next actions",
    text: "Система подсказывает следующее действие — не нужно вспоминать, на чём остановились.",
  },
  {
    icon: FileStack,
    title: "Prepared content",
    text: "Готовый AI-контент хранится вместе с кампанией, а не в отдельных файлах.",
  },
  {
    icon: ShieldCheck,
    title: "Submission results",
    text: "Результат подачи фиксируется с доказательством — скриншотом, URL или ответом сервера.",
  },
];

export function CampaignShowcase({ embedded = false }: { embedded?: boolean }) {
  const content = (
    <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
      <div>
        {!embedded && <SectionLabel>Кампании</SectionLabel>}
        {!embedded && (
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            От первой площадки до финального отчёта — в одной кампании.
          </h2>
        )}
        {!embedded && (
          <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-600">
            Кампания — единая точка управления: площадки, контент, подачи, проверки и отчёты
            собираются в одном месте.
          </p>
        )}

        <ul className="mt-8 space-y-5">
          {points.map((p) => (
            <li key={p.title} className="flex gap-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-blue-600 shadow-sm">
                <p.icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">{p.title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/campaigns"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
          >
            Создать кампанию
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <span className="text-sm text-zinc-400">
            {CASE_SUMMARY.total} площадок · реальная кампания
          </span>
        </div>
      </div>

      <Reveal delay={embedded ? 0 : 120}>
        <CampaignCard />
      </Reveal>
    </div>
  );

  if (embedded) return content;

  return (
    <section className="border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">{content}</div>
    </section>
  );
}
