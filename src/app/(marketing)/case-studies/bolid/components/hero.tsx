import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AUDIT_URL } from "../data";
import { BlueNote } from "./ui";

export function Hero() {
  return (
    <section className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-5xl px-8 py-16 sm:py-20">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              SEOFlow AI · AI Search Intelligence
            </span>
            <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-500">
              Case study
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl">
              AI Search Visibility Audit
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-zinc-600">
              Как генеративные AI-ответы представляют{" "}
              <span className="font-semibold text-zinc-900">АО НВП «Болид»</span> — его продукты,
              источники, конкурентов и позиционирование: замер на 34 промптах в 10 интент-категориях,
              три запуска, 102 ответа.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-zinc-500">
            <span>34 промпта</span>
            <span className="h-1 w-1 rounded-full bg-zinc-300" />
            <span>10 интент-категорий</span>
            <span className="h-1 w-1 rounded-full bg-zinc-300" />
            <span>3 запуска</span>
            <span className="h-1 w-1 rounded-full bg-zinc-300" />
            <span>102 ответа</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={AUDIT_URL}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Открыть live audit
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href="#methodology"
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Методология
            </a>
          </div>

          <BlueNote>
            Это наблюдение за ответами AI в рамках фиксированного набора промптов и провайдеров —
            не статистическое исследование рынка и не заявление о позиционировании бренда.
          </BlueNote>
        </div>
      </div>
    </section>
  );
}