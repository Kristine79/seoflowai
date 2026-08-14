import { cn } from "@/lib/utils";
import { getStatusMeta, getToneClasses, type StatusTone } from "@/lib/status";
import { StatusDot } from "./status-dot";

type NextActionProps = {
  status?: string | null;
  action?: string;
  tone?: StatusTone;
  className?: string;
};

/**
 * Подпись-паттерн продукта: «● СТАТУС → СЛЕДУЮЩЕЕ ДЕЙСТВИЕ».
 * Показывает, в каком состоянии находится платформа и что делать дальше.
 */
export function NextAction({ status, action, tone, className }: NextActionProps) {
  const meta = getStatusMeta(status);
  const resolvedTone = tone ?? meta.tone;
  const nextAction = action ?? meta.nextAction;
  if (!nextAction) return null;
  return (
    <p className={cn("flex items-center gap-1.5 text-sm", getToneClasses(resolvedTone).text, className)}>
      <StatusDot tone={resolvedTone} />
      <span>{meta.label}</span>
      <span aria-hidden="true" className="text-zinc-400">→</span>
      <span className="font-semibold">{nextAction}</span>
    </p>
  );
}
