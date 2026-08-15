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
import { HumanActionCount } from "@/components/human-action-count";

const navItems = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
  { href: "/campaigns", label: "Кампании", icon: Briefcase },
  { href: "/directories", label: "Каталоги", icon: ListTree },
  { href: "/audit", label: "SEO Аудит", icon: Search },
  { href: "/ai-search", label: "AI Search", icon: Sparkles },
  { href: "/content", label: "Генератор контента", icon: FileText },
  { href: "/company", label: "Компания", icon: Building2 },
  { href: "/settings", label: "Настройки", icon: Settings },
];

const resourceItems = [
  { href: "/case-studies/seo-agency-directory-campaign", label: "Кейс: 77 Platforms", icon: Sparkles },
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
          const isActive =
            item.href === "/ai-search"
              ? pathname === "/ai-search" || pathname.startsWith("/ai-search/")
              : pathname === item.href;
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

        <div className="px-3 pb-1 pt-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Ресурсы</p>
        </div>

        {resourceItems.map((item) => {
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

      <div className="space-y-2 border-t border-zinc-100 p-4">
        <HumanActionCount />
      </div>
    </aside>
  );
}
