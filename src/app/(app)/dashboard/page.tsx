"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AttentionBlock, type AttentionItem } from "@/components/attention-block";
import { WorkflowStepper } from "@/components/workflow-stepper";
import { EmptyStateChecklist } from "@/components/empty-state-checklist";
import { HumanActionQueue } from "@/components/human-action-queue";
import { ArrowUpRight, FileSpreadsheet, Plus } from "lucide-react";
import Link from "next/link";

type DashboardData = {
  totalDirectories: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  completed: number;
  pending: number;
  inProgress: number;
  aiPrepared: number;
  ready: number;
  waitingVerification: number;
  verificationRequired: number;
  rejected: number;
  paymentRequired: number;
  readyToSubmit: number;
  needsAction: number;
  averageSeoScore: number;
  automationEasy: number;
  automationMedium: number;
  automationHard: number;
  automationManual: number;
  byCategory: Record<string, number>;
  recentDirectories: {
    id: string;
    platform: string;
    status: string;
    seoScore: number | null;
  }[];
};

const EMPTY_STATS: DashboardData = {
  totalDirectories: 0,
  highPriority: 0,
  mediumPriority: 0,
  lowPriority: 0,
  completed: 0,
  pending: 0,
  inProgress: 0,
  aiPrepared: 0,
  ready: 0,
  waitingVerification: 0,
  verificationRequired: 0,
  rejected: 0,
  paymentRequired: 0,
  readyToSubmit: 0,
  needsAction: 0,
  averageSeoScore: 0,
  automationEasy: 0,
  automationMedium: 0,
  automationHard: 0,
  automationManual: 0,
  byCategory: {},
  recentDirectories: [],
};

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
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

  const s = data || EMPTY_STATS;

  const attention: AttentionItem[] = [
    {
      key: "ready",
      tone: "blue",
      label: "Готовы к подаче",
      count: s.readyToSubmit,
      note: "AI-контент подготовлен",
      href: "/directories?status=READY",
      cta: "К подаче",
    },
    {
      key: "human",
      tone: "amber",
      label: "Требуют человека",
      count: s.automationManual + s.needsAction,
      note: "остановлены для решения",
      href: "/directories",
      cta: "Открыть",
    },
    {
      key: "verification",
      tone: "blue",
      label: "Ожидают проверки",
      count: s.waitingVerification + s.verificationRequired,
      note: "модерация или проверка",
      href: "/directories?status=WAITING_VERIFICATION",
      cta: "Проверить",
    },
  ];

  const steps = [
    { id: "analysis", label: "Анализ", count: s.pending, href: "/directories?status=PENDING" },
    { id: "prioritization", label: "Приоритизация", count: s.highPriority, href: "/directories" },
    { id: "preparation", label: "Подготовка", count: s.aiPrepared, href: "/directories?status=AI_PREPARED" },
    { id: "submission", label: "Подача", count: s.ready + s.inProgress, href: "/directories?status=READY" },
    { id: "verification-step", label: "Проверка", count: s.waitingVerification + s.verificationRequired, href: "/directories?status=WAITING_VERIFICATION" },
    { id: "report", label: "Отчёт", count: s.completed, href: "/directories?status=COMPLETED", done: s.completed > 0 },
  ];

  const campaignPct = s.totalDirectories > 0 ? Math.round((s.completed / s.totalDirectories) * 100) : 0;

  const isEmpty = s.totalDirectories === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Главная</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Обзор ваших SEO-кампаний по каталогам
          </p>
        </div>
        <Link href="/campaigns">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Новая кампания
          </Button>
        </Link>
      </div>

      {isEmpty && (
        <EmptyStateChecklist
          steps={[
            { id: "import", label: "Загрузить список платформ", note: "Excel или CSV со списком каталогов", href: "/campaigns", cta: "Загрузить", current: true },
            { id: "audit", label: "SEO Аудит", note: "Оценка ценности и автоматизируемости каждой площадки", href: "/audit", cta: "Запустить" },
            { id: "prioritize", label: "Приоритизировать", note: "Выбор первых площадок для подачи", href: "/directories", cta: "Смотреть" },
            { id: "content", label: "AI-контент", note: "Описания и ключевые слова под каждую платформу", href: "/content", cta: "Создать" },
            { id: "submit", label: "Подать", note: "Автоматическая подача с проверкой результата", href: "/directories?status=READY", cta: "Открыть" },
            { id: "verify", label: "Проверить", note: "Верификация публичных профилей и доказательства", href: "/directories?status=WAITING_VERIFICATION", cta: "Открыть" },
          ]}
        />
      )}

      {!isEmpty && (
        <>
          <AttentionBlock items={attention} />

          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <dl className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-zinc-100 sm:divide-y-0 sm:divide-x">
              <div className="px-5 py-4">
                <dt className="text-xs font-medium text-zinc-500">Всего платформ</dt>
                <dd className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">{s.totalDirectories}</dd>
              </div>
              <div className="px-5 py-4">
                <dt className="text-xs font-medium text-zinc-500">Средний SEO-балл</dt>
                <dd className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">{s.averageSeoScore}<span className="text-base font-medium text-zinc-400">/100</span></dd>
              </div>
              <div className="px-5 py-4">
                <dt className="text-xs font-medium text-zinc-500">Высокий приоритет</dt>
                <dd className="mt-1 text-2xl font-bold tracking-tight text-amber-600">{s.highPriority}</dd>
              </div>
              <div className="px-5 py-4">
                <dt className="text-xs font-medium text-zinc-500">Готово к подаче</dt>
                <dd className="mt-1 text-2xl font-bold tracking-tight text-blue-600">{s.readyToSubmit}</dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Этапы кампании</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <WorkflowStepper steps={steps} />
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Progress value={campaignPct} className="h-2" />
                  </div>
                  <span className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                    {campaignPct}% завершено · {s.completed} из {s.totalDirectories}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Распределение по приоритетам</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                      Высокий приоритет
                    </span>
                    <span className="font-semibold text-amber-600">{s.highPriority}</span>
                  </div>
                  <Progress value={s.totalDirectories ? (s.highPriority / s.totalDirectories) * 100 : 0} className="mt-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                      Средний приоритет
                    </span>
                    <span className="font-semibold text-blue-600">{s.mediumPriority}</span>
                  </div>
                  <Progress value={s.totalDirectories ? (s.mediumPriority / s.totalDirectories) * 100 : 0} className="mt-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" aria-hidden="true" />
                      Низкий приоритет
                    </span>
                    <span className="font-semibold text-zinc-500">{s.lowPriority}</span>
                  </div>
                  <Progress value={s.totalDirectories ? (s.lowPriority / s.totalDirectories) * 100 : 0} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <HumanActionQueue />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Последние каталоги</CardTitle>
              <Link href="/directories">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Все <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-zinc-100">
                {s.recentDirectories.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <FileSpreadsheet className="h-8 w-8 text-zinc-300" />
                    <p className="text-sm text-zinc-500">Ещё нет каталогов. Импортируйте Excel-файл.</p>
                    <Link href="/campaigns">
                      <Button variant="outline" size="sm" className="mt-2">
                        Создать кампанию
                      </Button>
                    </Link>
                  </div>
                ) : (
                  s.recentDirectories.map((dir) => (
                    <div key={dir.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <Link
                          href={`/directories/${dir.id}`}
                          className="text-sm font-medium text-zinc-900 hover:text-blue-600"
                        >
                          {dir.platform}
                        </Link>
                        <p className="text-xs text-zinc-400 tabular-nums">{dir.seoScore ? `${dir.seoScore}/100` : "нет оценки"}</p>
                      </div>
                      <StatusBadge status={dir.status} />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}