"use client";
import { Gauge, ListChecks, Layers, FileText, Hash, TrendingUp, Lightbulb, Rocket } from "lucide-react";

const features = [
  {
    icon: Gauge,
    title: "SEO Audit",
    text: "Каждая площадка получает SEO-балл: ценность, усилия и оценка автоматизируемости.",
  },
  {
    icon: ListChecks,
    title: "Анализ платформ",
    text: "Требования, ограничения и особенности учитываются до начала подачи.",
  },
  {
    icon: Layers,
    title: "Приоритизация",
    text: "Площадки ранжируются по ценности и усилиям, быстрые победы выделяются отдельно.",
  },
  {
    icon: FileText,
    title: "AI Content Generator",
    text: "Описания, услуги и ключевые слова готовятся под конкретную платформу.",
  },
  {
    icon: Hash,
    title: "Platform-specific описания",
    text: "Один профиль компании — адаптированный контент для каждой площадки.",
  },
  {
    icon: TrendingUp,
    title: "Keyword research",
    text: "Ключевые слова подбираются с учётом направления компании и площадки.",
  },
  {
    icon: Lightbulb,
    title: "SEO рекомендации",
    text: "Стратегические рекомендации и 7-дневный план действий по результатам аудита.",
  },
  {
    icon: Rocket,
    title: "Подготовка кампании",
    text: "Из аудита и профиля компании собирается готовая к запуску кампания.",
  },
];

export function AiFeatures() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Возможности</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            AI берёт на себя подготовительную работу.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-600">
            Исследование, приоритизация и подготовка контента — самая повторяемая часть работы.
            SEOFlow делает её за вас, а решения остаются за человеком.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <f.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="mt-3.5 text-sm font-semibold text-zinc-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}