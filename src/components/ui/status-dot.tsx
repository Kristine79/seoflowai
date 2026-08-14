import { cn } from "@/lib/utils";
import { getTone, getToneClasses, type StatusTone } from "@/lib/status";

type StatusDotProps = {
  tone?: StatusTone;
  status?: string | null;
  className?: string;
};

export function StatusDot({ tone, status, className }: StatusDotProps) {
  const resolved = tone ?? getTone(status);
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block h-2 w-2 shrink-0 rounded-full", getToneClasses(resolved).dot, className)}
    />
  );
}
