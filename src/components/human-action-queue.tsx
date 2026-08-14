"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowUpRight, Contact } from "lucide-react";
import { getStatusMeta, getToneClasses } from "@/lib/status";
import { StatusDot } from "@/components/ui/status-dot";

type DirectoryHuman = {
  id: string;
  platform: string;
  status: string;
  url: string | null;
  seoAudit: {
    automationLevel: string | null;
    automationReason: string | null;
  } | null;
};

type HumanQueueProps = {
  className?: string;
  limit?: number;
};

/**
 * Очередь человеческих действий: платформы, где автоматизация остановилась
 * (ручной режим подачи, отклонение, оплата). Только реальные данные из API.
 */
export function HumanActionQueue({ className, limit = 8 }: HumanQueueProps) {
  const { data, isLoading } = useQuery<DirectoryHuman[]>({
    queryKey: ["directories"],
    queryFn: async () => {
      const res = await fetch("/api/directories");
      return res.json();
    },
  });

  const items = (data || []).filter(
    (d) =>
      d.seoAudit?.automationLevel === "MANUAL" ||
      d.status === "REJECTED" ||
      d.status === "PAYMENT_REQUIRED"
  );
  const shown = items.slice(0, limit);

  if (!isLoading && items.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50">
            <Contact className="h-4 w-4 text-amber-600" />
          </span>
          <h2 className="text-base font-semibold text-zinc-950">
            Требуют человека
            <span className="ml-2 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {items.length}
            </span>
          </h2>
        </div>
        <Link
          href="/directories"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          Все площадки <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        Автоматизация остановилась здесь намеренно: нужно ваше решение или действие в браузере.
      </p>
      <ul className="mt-4 divide-y divide-zinc-100">
        {shown.map((d) => {
          const reason = d.seoAudit?.automationReason || getStatusMeta(d.status).label;
          const tone = getToneClasses(getStatusMeta(d.status).tone);
          return (
            <li key={d.id}>
              <Link
                href={`/directories/${d.id}`}
                className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-zinc-50 rounded-lg px-2 -mx-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{d.platform}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-zinc-500">
                    <StatusDot tone={getStatusMeta(d.status).tone} className="h-1.5 w-1.5" />
                    {reason}
                  </p>
                </div>
                <span className={tone.text}>
                  <ArrowUpRight className="h-4 w-4 shrink-0" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {items.length > limit && (
        <Link
          href="/directories"
          className="mt-2 block text-center text-xs font-medium text-blue-600 hover:underline"
        >
          Показать все {items.length} площадок
        </Link>
      )}
    </div>
  );
}
