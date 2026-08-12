"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  ListTree,
  Search,
  FileText,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
  { href: "/campaigns", label: "Кампании", icon: Briefcase },
  { href: "/case-studies/seo-agency-directory-campaign", label: "Кейс: 77 Platforms", icon: Sparkles },
  { href: "/company", label: "Компания", icon: Building2 },
  { href: "/directories", label: "Каталоги", icon: ListTree },
  { href: "/audit", label: "SEO Аудит", icon: Search },
  { href: "/content", label: "Генератор контента", icon: FileText },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-14 items-center gap-2 border-b border-zinc-100 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Search className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight">SeoFlowAI</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {isActive && <ChevronRight className="ml-auto h-4 w-4 text-zinc-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-100 p-4">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs font-medium text-blue-700">AI Кредиты</p>
          <p className="mt-1 text-lg font-semibold text-blue-900">2 450</p>
          <div className="mt-2 h-1.5 rounded-full bg-blue-200">
            <div className="h-1.5 w-3/4 rounded-full bg-blue-600" />
          </div>
        </div>
      </div>
    </aside>
  );
}
