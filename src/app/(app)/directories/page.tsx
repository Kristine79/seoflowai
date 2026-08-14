"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ListTree,
  Search,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn, getStatusColor, translateStatus, translatePriority, deriveNextAction } from "@/lib/utils";

type Directory = {
  id: string;
  platform: string;
  url: string | null;
  priority: string;
  category: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  seoAudit: {
    seoScore: number | null;
    automationLevel: string | null;
    platformType: string | null;
  } | null;
  generatedContent: Record<string, unknown> | null;
};

const STATUSES = ["ALL", "PENDING", "AI_PREPARED", "READY", "IN_PROGRESS", "VERIFICATION_REQUIRED", "REJECTED", "PAYMENT_REQUIRED", "COMPLETED"];
const PRIORITIES = ["ALL", "HIGH", "MEDIUM", "LOW"];

export default function DirectoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const { data: directories, isLoading } = useQuery<Directory[]>({
    queryKey: ["directories"],
    queryFn: async () => {
      const res = await fetch("/api/directories");
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/directories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directories"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  const categories = [...new Set((directories || []).map((d) => d.category).filter(Boolean))] as string[];

  const filtered = (directories || []).filter((d) => {
    const matchSearch = d.platform.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    const matchPriority = priorityFilter === "ALL" || d.priority === priorityFilter;
    const matchCategory = categoryFilter === "ALL" || d.category === categoryFilter;
    return matchSearch && matchStatus && matchPriority && matchCategory;
  });

  const statusCounts: Record<string, number> = {};
  (directories || []).forEach((d) => {
    statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Каталоги</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {directories?.length || 0} платформ всего
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Поиск платформ..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Приоритет" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Все приоритеты</SelectItem>
            {PRIORITIES.filter(p => p !== "ALL").map((p) => (
              <SelectItem key={p} value={p}>{translatePriority(p)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Все статусы</SelectItem>
            {STATUSES.filter(s => s !== "ALL").map((s) => (
              <SelectItem key={s} value={s}>{translateStatus(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Все категории</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.filter(s => s !== "ALL").map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="text-xs"
          >
            {translateStatus(s)}
            {statusCounts[s] > 0 && (
              <span className="ml-1.5 rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px]">
                {statusCounts[s]}
              </span>
            )}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <ListTree className="h-10 w-10 text-zinc-300" />
              <p className="text-sm text-zinc-500">Каталоги не найдены</p>
              <Link href="/campaigns">
                <Button variant="outline" size="sm">
                  Импортировать из кампании
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1.2fr_1.2fr_0.5fr] gap-4 px-6 py-3 text-xs font-medium text-zinc-500 lg:grid">
                <span>Платформа</span>
                <span>Приоритет</span>
                <span>SEO</span>
                <span>Автоматизация</span>
                <span>Статус</span>
                <span>Следующее действие</span>
                <span></span>
              </div>
              {filtered.map((dir) => (
                <div
                  key={dir.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 text-sm hover:bg-zinc-50 transition-colors lg:grid-cols-[2fr_1fr_1fr_1fr_1.2fr_1.2fr_0.5fr] lg:gap-4 lg:px-6"
                >
                  <Link href={`/directories/${dir.id}`} className="col-span-1">
                    <span className="font-medium">{dir.platform}</span>
                    {dir.category && (
                      <p className="text-xs text-zinc-400">{dir.category}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:hidden">
                      {dir.priority && (
                        <Badge
                          variant={
                            dir.priority === "HIGH"
                              ? "success"
                              : dir.priority === "MEDIUM"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-[11px]"
                        >
                          {translatePriority(dir.priority)}
                        </Badge>
                      )}
                      {dir.seoAudit?.seoScore ? (
                        <span
                          className={cn(
                            "rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold",
                            dir.seoAudit.seoScore >= 80
                              ? "text-emerald-700"
                              : dir.seoAudit.seoScore >= 60
                              ? "text-amber-700"
                              : "text-zinc-500"
                          )}
                        >
                          SEO {dir.seoAudit.seoScore}
                        </span>
                      ) : null}
                      {dir.seoAudit?.automationLevel && (
                        <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500">
                          {dir.seoAudit.automationLevel === "EASY" ? "Легко" :
                           dir.seoAudit.automationLevel === "MEDIUM" ? "Средне" :
                           dir.seoAudit.automationLevel === "HARD" ? "Сложно" :
                           dir.seoAudit.automationLevel === "MANUAL" ? "Вручную" :
                           dir.seoAudit.automationLevel}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="hidden lg:block">
                    <Badge
                      variant={
                        dir.priority === "HIGH"
                          ? "success"
                          : dir.priority === "MEDIUM"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {translatePriority(dir.priority)}
                    </Badge>
                  </div>
                  <div className="hidden lg:block">
                    {dir.seoAudit?.seoScore ? (
                      <span
                        className={cn(
                          "font-semibold",
                          dir.seoAudit.seoScore >= 80
                            ? "text-emerald-600"
                            : dir.seoAudit.seoScore >= 60
                            ? "text-amber-600"
                            : "text-zinc-400"
                        )}
                      >
                        {dir.seoAudit.seoScore}/100
                      </span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </div>
                  <div className="hidden lg:block">
                    {dir.seoAudit?.automationLevel ? (
                      <span className="text-xs text-zinc-500">
                        {dir.seoAudit.automationLevel === "EASY" ? "Легко" :
                         dir.seoAudit.automationLevel === "MEDIUM" ? "Средне" :
                         dir.seoAudit.automationLevel === "HARD" ? "Сложно" :
                         dir.seoAudit.automationLevel === "MANUAL" ? "Вручную" :
                         dir.seoAudit.automationLevel}
                      </span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </div>
                  <div>
                    <Select
                      value={dir.status}
                      onValueChange={(value) =>
                        statusMutation.mutate({ id: dir.id, status: value })
                      }
                    >
                      <SelectTrigger className={cn("h-9 md:h-7 text-xs border-0 shadow-none p-0", getStatusColor(dir.status))}>
                        <SelectValue>{translateStatus(dir.status)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.filter(s => s !== "ALL").map((s) => (
                          <SelectItem key={s} value={s}>{translateStatus(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="hidden text-xs text-zinc-500 lg:block">
                    <span>{deriveNextAction(dir.status)}</span>
                  </div>
                  <div className="hidden lg:flex justify-end">
                    <ArrowUpRight className="h-4 w-4 text-zinc-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
