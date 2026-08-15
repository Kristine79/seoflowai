"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Sparkles, ArrowUpRight, Radar } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type AuditListItem = {
  id: string;
  name: string;
  brand: string;
  status: string;
  createdAt: string;
  executedAt: string | null;
  promptCount: number;
  responseCount: number;
  executed: number;
  success: number;
  failed: number;
  mentionRate: number | null;
  recommendationRate: number | null;
  top3Rate: number | null;
};

const WORKFLOW_STEPS = [
  { id: "create", label: "Создать аудит", note: "Бренд, продукты, конкуренты — из Company Profile" },
  { id: "prompts", label: "Промпты", note: "Шаблонный набор запросов, редактируется перед запуском" },
  { id: "run", label: "Запуск", note: "Реальные ответы AI на каждый промпт, raw-копия сохраняется" },
  { id: "analysis", label: "Анализ", note: "Упоминания, рекомендации, конкуренты, источники" },
  { id: "gaps", label: "Гэпы", note: "Evidence-backed пробелы присутствия" },
  { id: "actions", label: "План действий", note: "Что можно сделать и как проверить" },
];

export default function AiSearchPage() {
  const { data: audits, isLoading } = useQuery<AuditListItem[]>({
    queryKey: ["ai-search"],
    queryFn: async () => {
      const res = await fetch("/api/ai-search");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  const isEmpty = !audits || audits.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Search Intelligence</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Как AI-ассистенты представляют ваш бренд, продукты и конкурентов в ответах
          </p>
        </div>
        <Link href="/ai-search/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Новый аудит
          </Button>
        </Link>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-14">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <Radar className="h-7 w-7 text-blue-600" />
            </div>
            <div className="max-w-md text-center">
              <p className="text-lg font-semibold">Исследуйте, как AI видит ваш бренд</p>
              <p className="mt-2 text-sm text-zinc-500">
                Создайте первый AI Search Audit: бренд, продукты и конкуренты.
                SEOFlow сгенерирует набор запросов, получит реальные ответы AI
                и покажет, где бренд упоминается, где нет и что можно сделать.
              </p>
            </div>
            <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={step.id} className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <p className="text-sm font-semibold">{step.label}</p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{step.note}</p>
                </div>
              ))}
            </div>
            <Link href="/ai-search/new">
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Создать первый аудит
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {audits.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <Link href={`/ai-search/${a.id}`} className="group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium group-hover:text-blue-600">{a.name}</h3>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="mt-1 text-sm text-zinc-500">
                          {a.brand} · {a.promptCount} промптов · создан {formatDate(a.createdAt)}
                          {a.executedAt ? ` · выполнен ${formatDate(a.executedAt)}` : ""}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-blue-600" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-5">
                    <div>
                      <p className="text-xs text-zinc-400">Успешно</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums">
                        {a.success}
                        {a.failed > 0 && <span className="text-sm font-normal text-rose-500"> / {a.failed} fail</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Mention Rate</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums">
                        {a.mentionRate === null ? "—" : `${a.mentionRate}%`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Recommendation</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums">
                        {a.recommendationRate === null ? "—" : `${a.recommendationRate}%`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Top-3</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums">
                        {a.top3Rate === null ? "—" : `${a.top3Rate}%`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Ответы</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums">{a.responseCount}</p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}