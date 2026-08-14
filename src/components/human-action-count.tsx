"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { StatusDot } from "@/components/ui/status-dot";

type SidebarCounts = {
  automationManual: number;
  needsAction: number;
};

/**
 * Amber-индикатор очереди человеческих действий в сайдбаре.
 * Появляется только когда есть реальные площадки, требующие человека.
 */
export function HumanActionCount() {
  const { data } = useQuery<SidebarCounts>({
    queryKey: ["dashboard-counts"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      return {
        automationManual: json.automationManual ?? 0,
        needsAction: json.needsAction ?? 0,
      };
    },
  });

  const count = (data?.automationManual ?? 0) + (data?.needsAction ?? 0);
  if (count === 0) return null;

  return (
    <Link
      href="/directories"
      className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
      aria-label={`${count} площадок требуют действий человека`}
    >
      <StatusDot tone="amber" className="h-1.5 w-1.5" />
      <span className="truncate">Требуют человека</span>
      <span className="ml-auto rounded-md bg-amber-100 px-1.5 py-0.5 font-semibold tabular-nums">
        {count}
      </span>
    </Link>
  );
}
