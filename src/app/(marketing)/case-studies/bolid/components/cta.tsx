import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AUDIT_URL } from "../data";

export function Cta() {
  return (
    <section className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-5xl px-8 py-16 sm:py-20">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-8 py-12 text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            Live audit
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Посмотрите этот аудит вживую
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            В рабочем пространстве SEOFlow: 34 промпта, 3 запуска, 102 ответа, источники,
            конкуренты, позиционирование, гэпы и план действий — в одном месте.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={AUDIT_URL}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Открыть live audit
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 font-mono text-xs text-zinc-400">/ai-search/cmst1p1gk0000dwutci61bh6b?tab=overview</p>
        </div>
      </div>
    </section>
  );
}