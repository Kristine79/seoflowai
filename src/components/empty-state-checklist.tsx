import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChecklistStep = {
  id: string;
  label: string;
  note: string;
  href: string;
  cta: string;
  done?: boolean;
  current?: boolean;
};

type EmptyStateChecklistProps = {
  steps: ChecklistStep[];
  title?: string;
  description?: string;
};

/**
 * Пустое состояние кампании: 6 шагов запуска (Загрузить список → SEO Аудит →
 * Приоритизировать → AI-контент → Подать → Проверить), каждый со своим действием.
 */
export function EmptyStateChecklist({
  steps,
  title = "Запустите первую кампанию",
  description = "Шесть шагов — от списка площадок до проверенных размещений.",
}: EmptyStateChecklistProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
      <ol className="mt-5 space-y-2.5">
        {steps.map((step, i) => (
          <li key={step.id}>
            <div
              className={cn(
                "flex items-center gap-4 rounded-lg border px-4 py-3",
                step.current ? "border-blue-200 bg-blue-50/40" : "border-zinc-200 bg-white"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  step.done
                    ? "bg-emerald-500 text-white"
                    : step.current
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-500"
                )}
              >
                {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", step.done ? "text-zinc-400 line-through" : "text-zinc-900")}>
                  {step.label}
                </p>
                <p className="text-xs text-zinc-500">{step.note}</p>
              </div>
              {!step.done && (
                <Link
                  href={step.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors",
                    step.current
                      ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  {step.cta}
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
