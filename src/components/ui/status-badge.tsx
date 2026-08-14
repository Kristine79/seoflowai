import { cn } from "@/lib/utils";
import { getStatusMeta, getToneClasses, type StatusTone } from "@/lib/status";
import { StatusDot } from "./status-dot";

type StatusBadgeProps = {
  status?: string | null;
  label?: string;
  tone?: StatusTone;
  className?: string;
  dotClassName?: string;
};

export function StatusBadge({ status, label, tone, className, dotClassName }: StatusBadgeProps) {
  const meta = getStatusMeta(status);
  const resolvedTone = tone ?? meta.tone;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
        getToneClasses(resolvedTone).badge,
        className
      )}
    >
      <StatusDot tone={resolvedTone} className={cn("h-1.5 w-1.5", dotClassName)} />
      {label ?? meta.label}
    </span>
  );
}
