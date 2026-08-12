"use client";
import { Search, BarChart3, Sparkles, ArrowUpRight, CheckSquare, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CASE_SUMMARY } from "../data/case-data";

const workflowSteps = [
  { id: 1, label: "Audit", icon: Search },
  { id: 2, label: "Select", icon: BarChart3 },
  { id: 3, label: "Prepare", icon: Sparkles },
  { id: 4, label: "Submit", icon: ArrowUpRight },
  { id: 5, label: "Verify", icon: CheckSquare },
  { id: 6, label: "Report", icon: FileText },
];

const statusCounts = [
  { label: "Размещено", value: CASE_SUMMARY.verified, className: "text-emerald-600" },
  { label: "Заявка отправлена", value: CASE_SUMMARY.submitted, className: "text-blue-600" },
  { label: "К проверке", value: CASE_SUMMARY.needsHuman, className: "text-amber-600" },
  { label: "Заблокировано", value: CASE_SUMMARY.blocked, className: "text-rose-600" },
  { label: "Не подходит", value: CASE_SUMMARY.notApplicable, className: "text-zinc-500" },
];

/**
 * Реплика карточки кампании из реального UI (src/app/(app)/campaigns/page.tsx).
 * Данные — реальная кампания "77 Platforms" (client-report/client-directory-report-final.md).
 */
export function CampaignCard({ compact = false }: { compact?: boolean }) {
  const total = CASE_SUMMARY.total;
  const processed = CASE_SUMMARY.verified + CASE_SUMMARY.submitted + CASE_SUMMARY.needsHuman;
  const progressPct = Math.round((processed / total) * 100);
  const currentStep = 5;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-medium">77 Platforms · ITllect</h3>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Активна
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Каталоги и отраслевые площадки</p>
        </div>
        <span className="hidden rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 sm:inline-flex">
          Загрузить Excel
        </span>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="flex items-center gap-1">
          {workflowSteps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-1">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
                  currentStep >= step.id ? "bg-blue-50 text-blue-700" : "text-zinc-400"
                )}
              >
                <step.icon className="h-3 w-3" />
                {!compact && <span>{step.label}</span>}
              </div>
              {i < workflowSteps.length - 1 && (
                <div className={cn("h-px w-2 sm:w-3", currentStep > step.id ? "bg-blue-300" : "bg-zinc-200")} />
              )}
            </div>
          ))}
        </div>

        <div className={cn("grid gap-3", compact ? "grid-cols-3" : "grid-cols-5")}>
          {statusCounts.slice(0, compact ? 3 : 5).map((s) => (
            <div key={s.label} className="text-center">
              <div className={cn("text-sm font-semibold", s.className)}>{s.value}</div>
              <div className={cn("text-[10px] text-zinc-400", compact && "truncate")}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <span className="min-w-[3rem] text-right text-xs text-zinc-500">{progressPct}%</span>
        </div>

        {!compact && (
          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3.5 py-2.5 text-xs">
            <span className="text-zinc-600">
              Следующее действие: <span className="font-medium text-zinc-900">проверка заявок на модерации</span>
            </span>
            <span className="font-medium text-blue-600">Открыть →</span>
          </div>
        )}
      </div>
    </div>
  );
}
