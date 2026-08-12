"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";
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
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Search className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight">SEOFlow AI</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            Войти
          </Link>
          <Link
            href="/campaigns"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Начать кампанию
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-50 md:hidden"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={cn("border-t border-zinc-100 bg-white md:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {item.label}
            </a>
          ))}
          <div className="flex gap-3 pt-3">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Войти
            </Link>
            <Link
              href="/campaigns"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
            >
              Начать кампанию
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
