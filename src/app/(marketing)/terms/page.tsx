import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Условия использования",
  description: "Условия использования SEOFlow AI.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-full bg-white">
      <header className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
              <Search className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-zinc-900">
              SEOFlow <span className="text-zinc-400">AI</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Условия использования</h1>
        <p className="mt-2 text-sm text-zinc-500">Последнее обновление: август 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-600">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-zinc-900">1. О сервисе</h2>
            <p>
              SEOFlow AI — инструмент автоматизации SEO directory campaigns: анализ платформ,
              подготовка контента, подача заявок, проверка результатов и отчётность.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-zinc-900">2. Ответственность за подачи</h2>
            <p>
              Вы несёте ответственность за достоверность данных о компании, используемых при
              регистрации на внешних платформах. SEOFlow выполняет подачи в соответствии с правилами
              каждой платформы и останавливается, когда требуется участие человека (CAPTCHA, OAuth,
              верификация, модерация). Мы не гарантируем публикацию листинга на сторонних сайтах.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-zinc-900">3. Ограничение ответственности</h2>
            <p>
              Сервис предоставляется «как есть». Мы не несём ответственности за прямой или косвенный
              ущерб, связанный с использованием сервиса, включая блокировки внешних платформ и
              недоступность отдельных функций.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-zinc-900">4. Изменение условий</h2>
            <p>
              Мы можем обновлять условия использования. Актуальная версия всегда доступна на этой
              странице; продолжение использования сервиса означает согласие с обновлёнными условиями.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
