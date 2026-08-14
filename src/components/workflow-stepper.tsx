import Link from "next/link";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/ui/status-dot";

export type WorkflowStep = {
  id: string;
  label: string;
  count?: number;
  href?: string;
  done?: boolean;
};

type WorkflowStepperProps = {
  steps: WorkflowStep[];
  className?: string;
};

/**
 * Единый пайплайн кампании: Анализ → Приоритизация → Подготовка → Подача → Проверка → Отчёт.
 * Каждый шаг кликабелен и ведёт к площадкам, находящимся на этом этапе.
 */
export function WorkflowStepper({ steps, className }: WorkflowStepperProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-2", className)}>
      {steps.map((step, i) => {
        const isActive = (step.count ?? 0) > 0;
        const inner = (
          <>
            <StatusDot tone={step.done ? "emerald" : isActive ? "blue" : "zinc"} />
            <span className={cn("font-medium", step.done ? "text-emerald-700" : isActive ? "text-blue-700" : "text-zinc-400")}>
              {step.label}
            </span>
            {typeof step.count === "number" && (
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                  isActive ? "bg-blue-50 text-blue-700" : "bg-zinc-100 text-zinc-400"
                )}
              >
                {step.count}
              </span>
            )}
          </>
        );

        return (
          <div key={step.id} className="flex items-center gap-x-2">
            {step.href && step.count ? (
              <Link
                href={step.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                  isActive
                    ? "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                    : "border-zinc-200 bg-white hover:bg-zinc-50"
                )}
              >
                {inner}
              </Link>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs",
                  isActive ? "border-blue-200 bg-blue-50/50" : "border-zinc-200 bg-white"
                )}
              >
                {inner}
              </span>
            )}
            {i < steps.length - 1 && <span aria-hidden="true" className="h-px w-2 bg-zinc-300" />}
          </div>
        );
      })}
    </div>
  );
}
