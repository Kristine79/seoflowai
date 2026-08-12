"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Globe,
  Target,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { translateStatus } from "@/lib/utils";

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

  const stats = data || {
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

  const nextActionReady = stats.readyToSubmit > 0;
  const nextActionNeedsVerification = stats.waitingVerification + stats.verificationRequired > 0;
  const nextActionNeedsAction = stats.needsAction > 0;
  const campaignProgress = stats.completed + stats.inProgress + stats.readyToSubmit + stats.pending;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Главная</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Обзор ваших SEO-кампаний по каталогам
          </p>
        </div>
        <Link href="/campaigns">
          <Button className="gap-2">
            <Zap className="h-4 w-4" />
            Новая кампания
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Всего платформ</CardTitle>
            <Globe className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalDirectories}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-500">
              <ArrowUpRight className="h-3 w-3" />
              <span>SEO-кампания активна</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Средний SEO-балл</CardTitle>
            <Target className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.averageSeoScore}/100</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
              <TrendingUp className="h-3 w-3" />
              <span>{stats.highPriority} высокоценных платформ</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Высокий приоритет</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{stats.highPriority}</div>
            <div className="mt-1 text-xs text-zinc-500">
              Готовы к подаче
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">AI подготовлено</CardTitle>
            <Layers className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{stats.aiPrepared}</div>
            <div className="mt-1 text-xs text-zinc-500">
              Контент готов для {stats.automationEasy + stats.automationMedium} платформ
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Распределение по приоритетам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Высокий приоритет</span>
                  <span className="font-medium">{stats.highPriority}</span>
                </div>
                <Progress
                  value={stats.totalDirectories ? (stats.highPriority / stats.totalDirectories) * 100 : 0}
                  className="mt-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Средний приоритет</span>
                  <span className="font-medium">{stats.mediumPriority}</span>
                </div>
                <Progress
                  value={stats.totalDirectories ? (stats.mediumPriority / stats.totalDirectories) * 100 : 0}
                  className="mt-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Низкий приоритет</span>
                  <span className="font-medium">{stats.lowPriority}</span>
                </div>
                <Progress
                  value={stats.totalDirectories ? (stats.lowPriority / stats.totalDirectories) * 100 : 0}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ход кампании</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Завершено</span>
                <span className="font-medium text-emerald-600">{stats.completed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">В процессе</span>
                <span className="font-medium text-amber-600">{stats.inProgress}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Готово к подаче</span>
                <span className="font-medium text-blue-600">{stats.readyToSubmit}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Требуют внимания</span>
                <span className="font-medium text-red-600">{stats.needsAction}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Ожидает модерации</span>
                <span className="font-medium text-orange-600">{stats.waitingVerification + stats.verificationRequired}</span>
              </div>
              <Separator className="my-2" />
              <Progress
                value={campaignProgress ? (stats.completed / campaignProgress) * 100 : 0}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Что делать дальше</CardTitle>
          <Link href={nextActionReady ? "/directories?status=READY" : "/campaigns"}>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              {nextActionReady ? "Продолжить →" : "К кампаниям"}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.totalDirectories === 0 ? (
            <div className="flex items-center gap-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                <FileSpreadsheet className="h-6 w-6 text-zinc-400" />
              </div>
              <div>
                <p className="font-medium">Начните с импорта платформ</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Загрузите Excel-файл со списком каталогов для запуска кампании.
                </p>
              </div>
            </div>
          ) : nextActionReady ? (
            <div className="flex items-center gap-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{stats.readyToSubmit} платформ готовы к подаче</p>
                <p className="mt-1 text-sm text-zinc-500">
                  AI-контент подготовлен. Запустите автоматическую или ручную подачу.
                </p>
              </div>
              <Link href="/directories?status=READY">
                <Button className="gap-2">
                  <Zap className="h-4 w-4" />
                  К подаче
                </Button>
              </Link>
            </div>
          ) : nextActionNeedsVerification ? (
            <div className="flex items-center gap-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Проверьте статус размещений</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {stats.waitingVerification + stats.verificationRequired} платформ ожидают проверки или требуют действия.
                </p>
              </div>
              <Link href="/directories?status=WAITING_VERIFICATION">
                <Button variant="outline" className="gap-2">
                  Проверить
                </Button>
              </Link>
            </div>
          ) : nextActionNeedsAction ? (
            <div className="flex items-center gap-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{stats.needsAction} платформ требуют действия</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Требуется оплата, повторная подача или проверка отклонённых заявок.
                </p>
              </div>
              <Link href="/directories?status=REJECTED">
                <Button variant="outline" className="gap-2">
                  Исправить
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Кампания завершена</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Все {stats.totalDirectories} платформ обработаны. Посмотрите отчёт.
                </p>
              </div>
              <Link href="/campaigns">
                <Button variant="outline" className="gap-2">
                  Отчёт
                </Button>
              </Link>
            </div>
          )}
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
            {stats.recentDirectories.length === 0 ? (
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
              stats.recentDirectories.map((dir) => (
                <div key={dir.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link
                      href={`/directories/${dir.id}`}
                      className="text-sm font-medium hover:text-blue-600"
                    >
                      {dir.platform}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    {dir.seoScore && (
                      <span className="text-sm text-zinc-500">{dir.seoScore}/100</span>
                    )}
                    <Badge
                      variant={
                        dir.status === "COMPLETED"
                          ? "success"
                          : dir.status === "IN_PROGRESS"
                          ? "warning"
                          : dir.status === "AI_PREPARED"
                          ? "info"
                          : "secondary"
                      }
                    >
                      {translateStatus(dir.status)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
