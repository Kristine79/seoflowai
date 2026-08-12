import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";

export function FinalCta() {
  return (
    <section className="border-t border-zinc-100 bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <p className="font-mono text-xs uppercase tracking-widest text-blue-400">Начать</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Следующая SEO-кампания не должна начинаться с таблицы.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
          Создайте кампанию, подготовьте площадки и управляйте всем процессом из одного рабочего
          пространства.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/campaigns"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 sm:w-auto"
          >
            Начать кампанию
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/case-studies/seo-agency-directory-campaign"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-7 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 sm:w-auto"
          >
            <FileText className="h-4 w-4 text-zinc-400" />
            Посмотреть кейс 77 Platforms
          </Link>
        </div>
      </div>
    </section>
  );
}