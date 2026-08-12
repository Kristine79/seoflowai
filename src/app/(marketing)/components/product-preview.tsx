"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  ListTree,
  Search,
  Building2,
} from "lucide-react";
import { CampaignCard } from "./campaign-card";
import {
  CASE_SUMMARY,
  CASE_CATEGORIES,
  CASE_PLATFORMS,
  VERIFIED_PLATFORMS,
  COMPANY_PROFILE,
} from "../data/case-data";

type TabId = "dashboard" | "campaigns" | "catalogs" | "audit" | "company";

const tabs: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "Дашборд" },
  { id: "campaigns", label: "Кампании" },
  { id: "catalogs", label: "Каталоги" },
  { id: "audit", label: "SEO Аудит" },
  { id: "company", label: "Компания" },
];

const STATUS_META: Record<string, { label: string; className: string }> = {
  verified: { label: "Размещено", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  submitted: { label: "Заявка отправлена", className: "border-blue-200 bg-blue-50 text-blue-700" },
  needsHuman: { label: "Требуется действие", className: "border-amber-200 bg-amber-50 text-amber-700" },
  blocked: { label: "Заблокировано", className: "border-rose-200 bg-rose-50 text-rose-700" },
  notApplicable: { label: "Не подходит", className: "border-zinc-200 bg-zinc-50 text-zinc-500" },
};

export function ProductPreview() {
  const [active, setActive] = useState<TabId>("dashboard");

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_60px_-24px_rgba(24,24,27,0.22)]">
      {/* window chrome */}
      <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        </div>
        <div className="flex-1 rounded-md bg-white px-3 py-1.5 text-center font-mono text-xs text-zinc-400 ring-1 ring-zinc-200">
          app.seoflow.ai
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
          LIVE
        </span>
      </div>

      <div className="flex">
        {/* sidebar */}
        <div className="hidden w-44 shrink-0 border-r border-zinc-100 bg-white p-3 sm:block">
          <div className="flex items-center gap-2 px-2 pb-4 pt-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 shadow-sm">
              <Search className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-zinc-900">SEOFlow AI</span>
          </div>
          <div className="space-y-0.5">
            {[
              { icon: LayoutDashboard, label: "Главная", tab: "dashboard" as TabId },
              { icon: Briefcase, label: "Кампании", tab: "campaigns" as TabId },
              { icon: Building2, label: "Компания", tab: "company" as TabId },
              { icon: ListTree, label: "Каталоги", tab: "catalogs" as TabId },
              { icon: Search, label: "SEO Аудит", tab: "audit" as TabId },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActive(item.tab)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  active === item.tab
                    ? "bg-blue-50 text-blue-700"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* content */}
        <div className="min-w-0 flex-1 bg-zinc-50/60">
          <div className="flex gap-1 overflow-x-auto border-b border-zinc-100 bg-white px-3 pt-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={cn(
                  "whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2 text-xs font-medium transition-colors",
                  active === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-zinc-500 hover:text-zinc-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div key={active} className="animate-fade-in p-4">
            {active === "dashboard" && <DashboardScreen />}
            {active === "campaigns" && <CampaignCard />}
            {active === "catalogs" && <CatalogsScreen />}
            {active === "audit" && <AuditScreen />}
            {active === "company" && <CompanyScreen />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-zinc-200 bg-white p-4", className)}>{children}</div>;
}

function StatCard({ value, label, tone = "default" }: { value: number; label: string; tone?: "default" | "emerald" | "amber" | "blue" }) {
  return (
    <ScreenCard>
      <div
        className={cn(
          "text-2xl font-semibold tabular-nums tracking-tight",
          tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : tone === "blue" ? "text-blue-600" : "text-zinc-900"
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-zinc-500">{label}</div>
    </ScreenCard>
  );
}

function DashboardScreen() {
  const rows = [
    { label: "Размещено", value: CASE_SUMMARY.verified, color: "bg-emerald-500" },
    { label: "Заявка отправлена", value: CASE_SUMMARY.submitted, color: "bg-blue-500" },
    { label: "Требуют действия", value: CASE_SUMMARY.needsHuman, color: "bg-amber-500" },
    { label: "Заблокировано", value: CASE_SUMMARY.blocked, color: "bg-rose-500" },
    { label: "Не подходит", value: CASE_SUMMARY.notApplicable, color: "bg-zinc-300" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard value={CASE_SUMMARY.total} label="Всего платформ" />
        <StatCard value={CASE_SUMMARY.verified} label="Размещено" tone="emerald" />
        <StatCard value={CASE_SUMMARY.submitted} label="На модерации" tone="blue" />
        <StatCard value={CASE_SUMMARY.needsHuman} label="Требуют внимания" tone="amber" />
      </div>
      <ScreenCard>
        <p className="text-sm font-medium text-zinc-900">Ход кампании</p>
        <div className="mt-4 space-y-3">
          {rows.map((row, i) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs text-zinc-600">{row.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={cn("h-full rounded-full animate-grow-x", row.color)}
                  style={{ width: `${Math.round((row.value / CASE_SUMMARY.total) * 100)}%`, animationDelay: `${i * 120}ms` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-medium tabular-nums text-zinc-700">{row.value}</span>
            </div>
          ))}
        </div>
      </ScreenCard>
      <ScreenCard className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
            <span className="text-xs font-bold text-amber-700">!</span>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-900">23 площадки требуют действия</p>
            <p className="text-[11px] text-zinc-500">OAuth, подтверждение или ручная подача</p>
          </div>
        </div>
        <span className="rounded-md bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white">Проверить</span>
      </ScreenCard>
    </div>
  );
}

function CatalogsScreen() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-4 py-3">
        <p className="text-sm font-medium text-zinc-900">Каталоги</p>
        <p className="text-[11px] text-zinc-500">77 площадок · статус по каждой</p>
      </div>
      <div className="divide-y divide-zinc-50">
        {CASE_PLATFORMS.slice(0, 7).map((p) => {
          const meta = STATUS_META[p.status];
          return (
            <div key={p.name} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-xs font-medium text-zinc-800">{p.name}</span>
                <span className="hidden rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-400 sm:inline">
                  {p.status === "verified"
                    ? "Agency Directory"
                    : p.status === "blocked"
                    ? "Business Directory"
                    : p.status === "needsHuman"
                    ? "Partner Program"
                    : "Reviews"}
                </span>
              </div>
              <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", meta.className)}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-zinc-100 px-4 py-2.5 text-right">
        <span className="text-[11px] font-medium text-blue-600">Все 77 →</span>
      </div>
    </div>
  );
}

function AuditScreen() {
  const max = Math.max(...CASE_CATEGORIES.map((c) => c.count));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard value={CASE_SUMMARY.total} label="Проанализировано" />
        <StatCard value={VERIFIED_PLATFORMS.length} label="Быстрые победы" tone="emerald" />
        <StatCard value={Math.round(((CASE_SUMMARY.total - CASE_SUMMARY.notApplicable) / CASE_SUMMARY.total) * 100)} label="Релевантность, %" tone="blue" />
        <StatCard value={CASE_SUMMARY.blocked} label="Внешние ограничения" tone="amber" />
      </div>
      <ScreenCard>
        <p className="text-sm font-medium text-zinc-900">Категории платформ</p>
        <div className="mt-4 space-y-3">
          {CASE_CATEGORIES.map((c, i) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-48 shrink-0 truncate text-xs text-zinc-600">{c.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full animate-grow-x"
                  style={{ width: `${(c.count / max) * 100}%`, backgroundColor: c.color, animationDelay: `${i * 100}ms` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-medium tabular-nums text-zinc-700">{c.count}</span>
            </div>
          ))}
        </div>
      </ScreenCard>
      <ScreenCard>
        <p className="text-sm font-medium text-zinc-900">Лучшие платформы — размещено</p>
        <div className="mt-3 divide-y divide-zinc-50">
          {VERIFIED_PLATFORMS.map((p) => (
            <div key={p.platform} className="flex items-center justify-between py-2">
              <span className="text-xs font-medium text-zinc-800">{p.platform}</span>
              <span className="text-[10px] text-zinc-400">{p.note}</span>
            </div>
          ))}
        </div>
      </ScreenCard>
    </div>
  );
}

function CompanyScreen() {
  const fields = [
    ["Название", COMPANY_PROFILE.name],
    ["Юридическое название", COMPANY_PROFILE.legalName],
    ["Веб-сайт", COMPANY_PROFILE.website],
    ["Email", COMPANY_PROFILE.email],
    ["Телефон", COMPANY_PROFILE.phone],
    ["Адрес", COMPANY_PROFILE.address],
    ["Категория", COMPANY_PROFILE.category],
    ["Услуги", COMPANY_PROFILE.services],
  ];
  return (
    <div className="space-y-4">
      <ScreenCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Компания</p>
              <p className="text-[11px] text-zinc-500">Единый источник данных для всех площадок</p>
            </div>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600">100%</span>
        </div>
      </ScreenCard>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <ScreenCard key={label} className="py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
            <p className="mt-1 truncate text-xs font-medium text-zinc-800">{value}</p>
          </ScreenCard>
        ))}
      </div>
    </div>
  );
}
