"use client";
import Link from "next/link";
import { Search } from "lucide-react";

const columns = [
  {
    title: "Продукт",
    links: [
      { label: "Возможности", href: "#features" },
      { label: "Как работает", href: "#how-it-works" },
      { label: "Реальный кейс · 77 площадок", href: "/case-studies/seo-agency-directory-campaign" },
      { label: "Для кого", href: "#audience" },
    ],
  },
  {
    title: "Приложение",
    links: [
      { label: "Дашборд", href: "/dashboard" },
      { label: "Кампании", href: "/campaigns" },
      { label: "Каталоги", href: "/directories" },
      { label: "SEO Аудит", href: "/audit" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
                <Search className="h-4 w-4 text-white" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-zinc-900">
                SEOFlow <span className="text-zinc-400">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              Система для SEO directory campaigns: анализ, подготовка, подача, проверка и отчётность.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-zinc-100 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} SEOFlow AI. Все права защищены.
          </p>
          <div className="flex gap-6 text-xs text-zinc-400">
            <Link href="/privacy" className="transition-colors hover:text-zinc-900">
              Конфиденциальность
            </Link>
            <Link href="/terms" className="transition-colors hover:text-zinc-900">
              Условия
            </Link>
            <a
              href="https://github.com/Kristine79/seoflowai"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-zinc-900"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
