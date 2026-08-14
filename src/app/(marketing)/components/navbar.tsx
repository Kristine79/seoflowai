"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#product", label: "Продукт" },
  { href: "#how-it-works", label: "Как работает" },
  { href: "#features", label: "Возможности" },
  { href: "#case", label: "Кейс" },
  { href: "#audience", label: "Для кого" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm transition-shadow group-hover:shadow-md">
            <Search className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-zinc-900">
            SEOFlow <span className="text-zinc-400">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100/80 hover:text-zinc-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/dashboard"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            Войти
          </Link>
          <Link
            href="/case-studies/seo-agency-directory-campaign"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
          >
            Смотреть кейс
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 md:hidden"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={cn("border-t border-zinc-100 bg-white md:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto max-w-7xl space-y-0.5 px-4 py-3">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              {item.label}
            </a>
          ))}
          <div className="flex gap-2.5 pt-3">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Войти
            </Link>
            <Link
              href="/case-studies/seo-agency-directory-campaign"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Смотреть кейс
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
