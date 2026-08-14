import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToneClasses, type StatusTone } from "@/lib/status";
import { StatusDot } from "@/components/ui/status-dot";

export type AttentionItem = {
  key: string;
  tone: StatusTone;
  label: string;
  count: number;
  note: string;
  href: string;
  cta: string;
};

type AttentionBlockProps = {
  items: AttentionItem[];
};

/**
 * Главный блок внимания на дашборде: одно состояние кампании = одна строка
 * «● СТАТУС → ДЕЙСТВИЕ». Показываются только реальные очереди (count > 0).
 */
export function AttentionBlock({ items }: AttentionBlockProps) {
  const visible = items.filter((i) => i.count > 0);
  if (visible.length === 0) return null;

  return (
    <section aria-label="Требует внимания" className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "group flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-zinc-50",
              getToneClasses(item.tone).tileBorder
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                <StatusDot tone={item.tone} />
                {item.label}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-zinc-950">{item.count}</span>
                <span className="text-sm text-zinc-500">{item.note}</span>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors group-hover:border-zinc-300 group-hover:bg-zinc-50">
              {item.cta}
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}