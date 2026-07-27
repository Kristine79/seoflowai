"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Globe,
  ExternalLink,
  Copy,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowLeft,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { cn, getStatusColor, getAutomationColor, translateStatus, translatePriority } from "@/lib/utils";

type DirectoryDetail = {
  id: string;
  platform: string;
  url: string | null;
  priority: string;
  category: string | null;
  notes: string | null;
  status: string;
  liveUrl: string | null;
  createdAt: string;
  seoAudit: {
    seoScore: number | null;
    platformType: string | null;
    priority: string | null;
    automationLevel: string | null;
    automationReason: string | null;
    valueReason: string | null;
    requiredAssets: string | null;
    duplicateWarning: string | null;
    recommendation: string | null;
  } | null;
  submission: {
    login: string | null;
    password: string | null;
    listingUrl: string | null;
    notes: string | null;
  } | null;
  generatedContent: {
    shortDescription: string | null;
    mediumDescription: string | null;
    longDescription: string | null;
    serviceDescription: string | null;
    socialBio: string | null;
    keywords: string | null;
  } | null;
  campaign: {
    name: string;
    company: {
      name: string;
    };
  } | null;
};

const STATUSES = ["PENDING", "AI_PREPARED", "READY", "IN_PROGRESS", "VERIFICATION_REQUIRED", "REJECTED", "PAYMENT_REQUIRED", "COMPLETED"];

export default function DirectoryDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: dir, isLoading } = useQuery<DirectoryDetail>({
    queryKey: ["directory", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/directories/${params.id}`);
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/directories/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directory", params.id] });
      queryClient.invalidateQueries({ queryKey: ["directories"] });
    },
  });

  const generateContent = async () => {
    setGenerating(true);
    await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ directoryId: params.id }),
    });
    setGenerating(false);
    queryClient.invalidateQueries({ queryKey: ["directory", params.id] });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  if (!dir) {
    return <div className="py-16 text-center text-zinc-500">Каталог не найден</div>;
  }

  const checklist = [
    { label: "Создать аккаунт", done: dir.status !== "PENDING" },
    { label: "Добавить название компании", done: dir.status !== "PENDING" },
    { label: "Добавить описание", done: !!dir.generatedContent?.shortDescription },
    { label: "Добавить услуги", done: !!dir.generatedContent?.serviceDescription },
    { label: "Добавить сайт", done: true },
    { label: "Подтвердить email", done: dir.status === "COMPLETED" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/directories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{dir.platform}</h1>
            <Select
              value={dir.status}
              onValueChange={(value) =>
                updateMutation.mutate({ status: value })
              }
            >
              <SelectTrigger className={cn("h-7 text-xs w-[160px]", getStatusColor(dir.status))}>
                <SelectValue>{translateStatus(dir.status)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{translateStatus(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {dir.url && (
            <a
              href={dir.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              {dir.url} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dir.url && (
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={dir.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Открыть сайт
              </a>
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => updateMutation.mutate({ status: "COMPLETED" })}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Завершить
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          {dir.seoAudit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  SEO Аудит
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500">SEO оценка</p>
                    <p className={cn("text-2xl font-bold", (dir.seoAudit.seoScore || 0) >= 80 ? "text-emerald-500" : (dir.seoAudit.seoScore || 0) >= 60 ? "text-amber-500" : "text-zinc-400")}>
                      {dir.seoAudit.seoScore || "—"}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Тип платформы</p>
                    <p className="text-sm font-medium">
                      {dir.seoAudit.platformType?.replace(/_/g, " ") || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Автоматизация</p>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1", getAutomationColor(dir.seoAudit.automationLevel || ""))}>
                      {dir.seoAudit.automationLevel === "EASY" ? "Легко" :
                       dir.seoAudit.automationLevel === "MEDIUM" ? "Средне" :
                       dir.seoAudit.automationLevel === "HARD" ? "Сложно" :
                       dir.seoAudit.automationLevel === "MANUAL" ? "Вручную" :
                       dir.seoAudit.automationLevel || "—"}
                    </span>
                    {dir.seoAudit.automationReason && (
                      <p className="mt-1 text-xs text-zinc-400">{dir.seoAudit.automationReason}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Приоритет</p>
                    <Badge
                      variant={
                        dir.seoAudit.priority === "HIGH"
                          ? "success"
                          : dir.seoAudit.priority === "MEDIUM"
                          ? "warning"
                          : "secondary"
                      }
                      className="mt-1"
                    >
                      {translatePriority(dir.seoAudit.priority)}
                    </Badge>
                  </div>
                </div>

                {dir.seoAudit.valueReason && (
                  <div>
                    <p className="text-xs text-zinc-500">Оценка ценности</p>
                    <p className="mt-1 text-sm">{dir.seoAudit.valueReason}</p>
                  </div>
                )}

                {dir.seoAudit.recommendation && (
                  <div>
                    <p className="text-xs text-zinc-500">Рекомендация</p>
                    <p className="mt-1 text-sm text-blue-700 bg-blue-50 rounded-lg p-3">
                      {dir.seoAudit.recommendation}
                    </p>
                  </div>
                )}

                {dir.seoAudit.duplicateWarning && (
                  <div>
                    <p className="text-xs text-zinc-500">Предупреждение о дубликатах</p>
                    <p className="mt-1 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                      {dir.seoAudit.duplicateWarning}
                    </p>
                  </div>
                )}

                {dir.seoAudit.requiredAssets && (
                  <div>
                    <p className="text-xs text-zinc-500">Необходимые материалы</p>
                    <p className="mt-1 text-sm">{dir.seoAudit.requiredAssets}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {dir.generatedContent && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  AI Контент
                </CardTitle>
                <Button onClick={generateContent} disabled={generating} size="sm" variant="outline" className="gap-2">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? "Генерация..." : "Сгенерировать"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {dir.generatedContent.shortDescription && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Короткое описание (~50 слов)</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.shortDescription!, "short")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copied === "short" ? "Скопировано!" : "Копировать"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm">{dir.generatedContent.shortDescription}</p>
                  </div>
                )}
                {dir.generatedContent.mediumDescription && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Среднее описание (~100 слов)</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.mediumDescription!, "medium")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copied === "medium" ? "Скопировано!" : "Копировать"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm">{dir.generatedContent.mediumDescription}</p>
                  </div>
                )}
                {dir.generatedContent.longDescription && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Полное описание (~300 слов)</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.longDescription!, "long")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copied === "long" ? "Скопировано!" : "Копировать"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm">{dir.generatedContent.longDescription}</p>
                  </div>
                )}
                {dir.generatedContent.serviceDescription && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Услуги</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.serviceDescription!, "services")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copied === "services" ? "Скопировано!" : "Копировать"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm">{dir.generatedContent.serviceDescription}</p>
                  </div>
                )}
                {dir.generatedContent.socialBio && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Социальная био</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.socialBio!, "bio")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copied === "bio" ? "Скопировано!" : "Копировать"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm">{dir.generatedContent.socialBio}</p>
                  </div>
                )}
                {dir.generatedContent.keywords && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Ключевые слова</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.keywords!, "keywords")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copied === "keywords" ? "Скопировано!" : "Копировать"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">{dir.generatedContent.keywords}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!dir.generatedContent && dir.seoAudit && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <Sparkles className="h-8 w-8 text-zinc-300" />
                <div className="text-center">
                  <p className="font-medium">AI контент ещё не создан</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Сгенерируйте оптимизированные описания и ключевые слова для этой платформы.
                  </p>
                </div>
                <Button onClick={generateContent} disabled={generating} className="gap-2">
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {generating ? "Генерация..." : "Создать контент с AI"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Чеклист подачи</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border",
                        item.done
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-zinc-200"
                      )}
                    >
                      {item.done && <CheckSquare className="h-3 w-3 text-emerald-600" />}
                    </div>
                    <span className={cn("text-sm", item.done ? "text-zinc-400 line-through" : "")}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Данные для подачи</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="login">Логин</Label>
                <Input
                  id="login"
                  value={dir.submission?.login || ""}
                  onChange={(e) =>
                    updateMutation.mutate({
                      submission: {
                        upsert: { ...dir.submission, login: e.target.value },
                      },
                    })
                  }
                  placeholder="username@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={dir.submission?.password || ""}
                  onChange={(e) =>
                    updateMutation.mutate({
                      submission: {
                        upsert: { ...dir.submission, password: e.target.value },
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="listingUrl">URL листинга</Label>
                <Input
                  id="listingUrl"
                  value={dir.submission?.listingUrl || ""}
                  onChange={(e) =>
                    updateMutation.mutate({
                      submission: {
                        upsert: { ...dir.submission, listingUrl: e.target.value },
                      },
                    })
                  }
                  placeholder="https://platform.com/company/itllect"
                />
              </div>
              <div>
                <Label htmlFor="notes">Заметки</Label>
                <textarea
                  id="notes"
                  className="mt-1 flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  value={dir.submission?.notes || ""}
                  onChange={(e) =>
                    updateMutation.mutate({
                      submission: {
                        upsert: { ...dir.submission, notes: e.target.value },
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
