import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Политика конфиденциальности SEOFlow AI.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Политика конфиденциальности</h1>
        <p className="mt-2 text-sm text-zinc-500">Последнее обновление: август 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-600">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-zinc-900">1. Какие данные мы обрабатываем</h2>
            <p>
              SEOFlow AI обрабатывает данные, которые вы вносите в приложение: список площадок для
              кампаний, контент для листингов, учётные данные платформ для подачи заявок, а также
              автоматически собираемые технические данные (журналы автоматизации, скриншоты,
              статусы подач).
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-zinc-900">2. Как мы используем данные</h2>
            <p>
              Данные используются исключительно для выполнения кампаний по размещению бизнеса в
              каталогах: анализ платформ, подготовка контента, подача заявок, верификация и
              отчётность. Мы не продаём данные третьим лицам и не передаём их для рекламных целей.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-zinc-900">3. Хранение и защита</h2>
            <p>
              Данные хранятся в зашифрованном виде в управляемой базе данных. Доступ к учётным
              данным платформ ограничен и используется только в рамках выбранного вами сценария
              подачи.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-zinc-900">4. Ваши права</h2>
            <p>
              Вы можете запросить экспорт или удаление своих данных в любой момент, написав на
              support@seoflow.ai. Мы отвечаем в течение 30 дней.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
