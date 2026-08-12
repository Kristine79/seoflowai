import { cn } from "@/lib/utils";

/**
 * Единый системный label для секций landing page.
 * Вариант onDark — для тёмных секций (Human-in-the-loop, Final CTA).
 */
export function SectionLabel({
  children,
  onDark = false,
  className,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em]",
        onDark ? "text-blue-400" : "text-blue-600",
        className
      )}
    >
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 rounded-full", onDark ? "bg-blue-400" : "bg-blue-600")}
      />
      {children}
    </p>
  );
}
