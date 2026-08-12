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
  List,
  Hash,
  FolderTree,
  Tags,
  Play,
  ListChecks,
  Bot,
  Square,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useCallback } from "react";
import { cn, getStatusColor, getAutomationColor, translateStatus, translatePriority, formatDate } from "@/lib/utils";

type ChecklistItem = {
  task: string;
  completed: boolean;
};

type DirectoryDetail = {
  id: string;
  platform: string;
  url: string | null;
  priority: string;
  category: string | null;
  notes: string | null;
  status: string;
  liveUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  checklistProgress: string | null;
  automationMode: string | null;
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
    verificationStatus: string | null;
  } | null;
  generatedContent: {
    shortDescription: string | null;
    mediumDescription: string | null;
    longDescription: string | null;
    serviceDescription: string | null;
    serviceList: string | null;
    socialBio: string | null;
    keywords: string | null;
    primaryKeywords: string | null;
    secondaryKeywords: string | null;
    suggestedCategories: string | null;
  } | null;
  campaign: {
    name: string;
    company: {
      name: string;
    };
  } | null;
  submissionTemplate?: {
    id: string;
    fieldMapping: unknown;
    formStructure: unknown;
    submitSelector: string | null;
    version: number;
    createdAt: string;
  } | null;
  automationJobs?: {
    id: string;
    status: string;
    mode: string;
    startedAt: string | null;
    finishedAt: string | null;
    screenshot: string | null;
    error: string | null;
    logs: string | null;
    createdAt: string;
  }[];
};

const STATUSES = ["PENDING", "AI_PREPARED", "READY", "IN_PROGRESS", "WAITING_VERIFICATION", "VERIFICATION_REQUIRED", "REJECTED", "PAYMENT_REQUIRED", "COMPLETED"];

const VERIFICATION_STATUSES = ["PENDING", "VERIFIED", "FAILED"];

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { task: "Create account", completed: false },
  { task: "Add business name", completed: false },
  { task: "Select category", completed: false },
  { task: "Upload logo", completed: false },
  { task: "Add description", completed: false },
  { task: "Add services", completed: false },
  { task: "Add website", completed: false },
  { task: "Verify email", completed: false },
  { task: "Save listing URL", completed: false },
];

const AUTOMATION_LABELS: Record<string, string> = {
  MANUAL: "Ручная подача",
  AI_ASSISTED: "С помощью AI",
  AUTO_FILL_READY: "AI автозаполнение",
  NOT_SUPPORTED: "Не поддерживается",
};

function parseSuggestedCategories(json: string | null): { primary: string; secondary: string[] } | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return {
      primary: parsed.primary || "",
      secondary: Array.isArray(parsed.secondary) ? parsed.secondary : [],
    };
  } catch {
    return null;
  }
}

function splitLines(text: string | null): string[] {
  if (!text) return [];
  return text.split("\n").filter(Boolean);
}

function parseChecklist(json: string | null): ChecklistItem[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as ChecklistItem[];
  } catch {}
  return [];
}

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
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await fetch(`/api/directories/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directory", params.id] });
      queryClient.invalidateQueries({ queryKey: ["directories"] });
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [aiMode, setAiMode] = useState<"PREVIEW" | "SUBMIT">("PREVIEW");

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

  const handleStartAiSubmission = async (mode?: "PREVIEW" | "SUBMIT") => {
    setSubmitting(true);
    try {
      await fetch("/api/submission/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directoryId: params.id, mode: mode || aiMode }),
      });
      queryClient.invalidateQueries({ queryKey: ["directory", params.id] });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleStartSubmission = () => {
    updateMutation.mutate({
      status: "IN_PROGRESS",
      checklistProgress: DEFAULT_CHECKLIST,
    });
  };

  const handleToggleChecklist = useCallback(
    (index: number) => {
      const current = parseChecklist(dir?.checklistProgress || null);
      const list = current.length > 0 ? current : DEFAULT_CHECKLIST;
      list[index].completed = !list[index].completed;
      updateMutation.mutate({ checklistProgress: list });
    },
    [dir?.checklistProgress, updateMutation]
  );

  const handleCompleteSubmission = () => {
    updateMutation.mutate({ status: "COMPLETED" });
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

  const categories = parseSuggestedCategories(dir.generatedContent?.suggestedCategories || null);
  const serviceItems = splitLines(dir.generatedContent?.serviceList);
  const primaryKeywords = splitLines(dir.generatedContent?.primaryKeywords);
  const secondaryKeywords = splitLines(dir.generatedContent?.secondaryKeywords);

  const checklistItems = parseChecklist(dir.checklistProgress || null);
  const activeChecklist = checklistItems.length > 0 ? checklistItems : DEFAULT_CHECKLIST;
  const completedCount = activeChecklist.filter((i) => i.completed).length;
  const totalCount = activeChecklist.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount && totalCount > 0;
  const isInProgress = dir.status === "IN_PROGRESS" || dir.status === "WAITING_VERIFICATION";
  const isReady = dir.status === "READY";
  const isCompleted = dir.status === "COMPLETED";
  const isReadonly = dir.status === "COMPLETED" || dir.status === "REJECTED";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/directories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight truncate">{dir.platform}</h1>
            <Select
              value={dir.status}
              onValueChange={(value) => updateMutation.mutate({ status: value })}
            >
              <SelectTrigger className={cn("h-7 text-xs w-[170px]", getStatusColor(dir.status))}>
                <SelectValue>{translateStatus(dir.status)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{translateStatus(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dir.automationMode && (
              <Badge variant="outline" className="text-xs text-zinc-500">
                {AUTOMATION_LABELS[dir.automationMode] || dir.automationMode}
              </Badge>
            )}
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
        <div className="flex items-center gap-2 shrink-0">
          {dir.url && (
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={dir.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Открыть сайт
              </a>
            </Button>
          )}
          {isReady && (
            <Button size="sm" className="gap-2" onClick={handleStartSubmission}>
              <Play className="h-4 w-4" />
              Start Submission
            </Button>
          )}
          {isInProgress && dir.automationMode === "AI_ASSISTED" && (
            <div className="flex items-center gap-2">
              <Select value={aiMode} onValueChange={(v) => setAiMode(v as "PREVIEW" | "SUBMIT")}>
                <SelectTrigger className="h-7 text-xs w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PREVIEW">○ Preview</SelectItem>
                  <SelectItem value="SUBMIT">● Submit</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" size="sm" className="gap-2" onClick={() => handleStartAiSubmission()} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                {submitting ? "Запуск..." : "Run AI Submission"}
              </Button>
            </div>
          )}
          {!isCompleted && !isReady && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => updateMutation.mutate({ status: "COMPLETED" })}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Завершить
            </Button>
          )}
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
              <CardContent className="space-y-6">
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

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <List className="h-4 w-4 text-zinc-400" />
                    <p className="text-xs font-medium text-zinc-500">Список услуг</p>
                  </div>
                  {serviceItems.length > 0 ? (
                    <ul className="space-y-1.5">
                      {serviceItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-400">Нет данных</p>
                  )}
                </div>

                {dir.generatedContent.serviceDescription && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-zinc-500">Описание услуг</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.serviceDescription!, "servdesc")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 ml-auto"
                      >
                        {copied === "servdesc" ? "Скопировано!" : "Копировать"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm">{dir.generatedContent.serviceDescription}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="h-4 w-4 text-zinc-400" />
                    <p className="text-xs font-medium text-zinc-500">Основные ключевые слова</p>
                  </div>
                  {primaryKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {primaryKeywords.map((kw, i) => (
                        <Badge key={i} variant="info" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">Нет данных</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tags className="h-4 w-4 text-zinc-400" />
                    <p className="text-xs font-medium text-zinc-500">Вторичные ключевые слова</p>
                  </div>
                  {secondaryKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {secondaryKeywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs text-zinc-600">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">Нет данных</p>
                  )}
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FolderTree className="h-4 w-4 text-zinc-400" />
                    <p className="text-xs font-medium text-zinc-500">Рекомендуемые категории</p>
                  </div>
                  {categories ? (
                    <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">Основная категория</p>
                        <Badge variant="info" className="text-xs">
                          {categories.primary}
                        </Badge>
                      </div>
                      {categories.secondary.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-zinc-500 mb-1">Дополнительные категории</p>
                          <div className="flex flex-wrap gap-2">
                            {categories.secondary.map((cat, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">Нет данных</p>
                  )}
                </div>

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
          {isReady && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <Play className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Готов к размещению</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    AI контент подготовлен. Начните процесс подачи заявки на этой платформе.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <Button size="lg" className="gap-3 w-full" onClick={handleStartSubmission}>
                    <Play className="h-5 w-5" />
                    Start Submission
                  </Button>
                  {dir.automationMode === "AI_ASSISTED" && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Select value={aiMode} onValueChange={(v) => setAiMode(v as "PREVIEW" | "SUBMIT")}>
                          <SelectTrigger className="h-7 text-xs flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PREVIEW">○ Preview</SelectItem>
                            <SelectItem value="SUBMIT">● Submit</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="secondary" size="sm" className="gap-2 flex-1" onClick={() => handleStartAiSubmission()} disabled={submitting}>
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                          {submitting ? "Запуск..." : "Run AI Submission"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                {dir.startedAt && (
                  <p className="text-xs text-zinc-400">
                    Начато: {formatDate(dir.startedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {isInProgress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Submission Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">{completedCount} / {totalCount} завершено</span>
                  <span className="font-semibold">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />

                <div className="space-y-2">
                  {activeChecklist.map((item, i) => (
                    <div
                      key={item.task}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors cursor-pointer",
                        item.completed
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-zinc-200 hover:bg-zinc-50"
                      )}
                      onClick={() => handleToggleChecklist(i)}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                          item.completed
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-zinc-300"
                        )}
                      >
                        {item.completed && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm",
                          item.completed ? "text-zinc-400 line-through" : "text-zinc-700"
                        )}
                      >
                        {item.task}
                      </span>
                    </div>
                  ))}
                </div>

                {allDone && !isCompleted && (
                  <Button
                    className="w-full gap-2 mt-2"
                    size="lg"
                    onClick={handleCompleteSubmission}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Complete Submission
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {isCompleted && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="font-medium">Размещение завершено</p>
                {dir.completedAt && (
                  <p className="text-xs text-zinc-400">
                    Завершено: {formatDate(dir.completedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {dir.status === "REJECTED" && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                  <Square className="h-6 w-6 text-red-600" />
                </div>
                <p className="font-medium">Отклонено</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateMutation.mutate({ status: "IN_PROGRESS" })}
                >
                  Возобновить
                </Button>
              </CardContent>
            </Card>
          )}

          {dir.status === "PAYMENT_REQUIRED" && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <p className="font-medium">Требуется оплата</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Данные для подачи</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="login">Account Login</Label>
                <Input
                  id="login"
                  value={dir.submission?.login || ""}
                  onChange={(e) =>
                    updateMutation.mutate({
                      submission: { ...dir.submission, login: e.target.value },
                    })
                  }
                  placeholder="username@example.com"
                  readOnly={isReadonly}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={dir.submission?.password || ""}
                  onChange={(e) =>
                    updateMutation.mutate({
                      submission: { ...dir.submission, password: e.target.value },
                    })
                  }
                  readOnly={isReadonly}
                />
              </div>
              <div>
                <Label htmlFor="listingUrl">Listing URL</Label>
                <Input
                  id="listingUrl"
                  value={dir.submission?.listingUrl || ""}
                  onChange={(e) =>
                    updateMutation.mutate({
                      submission: { ...dir.submission, listingUrl: e.target.value },
                    })
                  }
                  placeholder="https://platform.com/company/itllect"
                  readOnly={isReadonly}
                />
              </div>
              <div>
                <Label htmlFor="verificationStatus">Verification Status</Label>
                <Select
                  value={dir.submission?.verificationStatus || "PENDING"}
                  onValueChange={(value) =>
                    updateMutation.mutate({
                      submission: { ...dir.submission, verificationStatus: value },
                    })
                  }
                  disabled={isReadonly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUSES.map((vs) => (
                      <SelectItem key={vs} value={vs}>
                        {vs === "PENDING" ? "Pending" : vs === "VERIFIED" ? "Verified" : "Failed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="mt-1 flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  value={dir.submission?.notes || ""}
                  onChange={(e) =>
                    updateMutation.mutate({
                      submission: { ...dir.submission, notes: e.target.value },
                    })
                  }
                  readOnly={isReadonly}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Submission Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dir.submissionTemplate ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-sm font-medium text-emerald-700">Template exists</span>
                    <span className="text-[10px] uppercase text-zinc-400 font-mono px-1.5 py-0.5 rounded bg-zinc-100 ml-auto">
                      v{dir.submissionTemplate.version}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 space-y-1">
                    <p>Поля: {Object.keys(dir.submissionTemplate.fieldMapping as Record<string, string> || {}).filter(k => (dir.submissionTemplate.fieldMapping as Record<string, string>)[k]).length} заполнено</p>
                    <p>Submit: {dir.submissionTemplate.submitSelector || "не указан"}</p>
                    <p>Создан: {formatDate(dir.submissionTemplate.createdAt)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                    <Copy className="h-5 w-5 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-500">No template</p>
                  <p className="text-xs text-zinc-400 text-center">
                    Шаблон будет сохранён после первого Preview.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {isInProgress && dir.automationMode === "AI_ASSISTED" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  AI Submission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-zinc-500">
                  Подготовленные данные для автоматической подачи.
                </p>
                {dir.generatedContent?.shortDescription && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Description</p>
                    <p className="text-sm">{dir.generatedContent.shortDescription}</p>
                  </div>
                )}
                {serviceItems.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Services</p>
                    <ul className="list-disc list-inside text-sm">
                      {serviceItems.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Select value={aiMode} onValueChange={(v) => setAiMode(v as "PREVIEW" | "SUBMIT")}>
                    <SelectTrigger className="h-7 text-xs w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PREVIEW">○ Preview</SelectItem>
                      <SelectItem value="SUBMIT">● Submit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="secondary" size="sm" className="gap-2 flex-1" onClick={() => handleStartAiSubmission()} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                    {submitting ? "Запуск..." : "Run AI Submission"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {dir.automationJobs && dir.automationJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  История AI подач
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  {dir.automationJobs.map((job) => {
                    const isManual = job.status === "NEEDS_MANUAL";
                    return (
                  <div key={job.id} className={cn("rounded-lg border p-3 space-y-2", isManual ? "border-amber-200 bg-amber-50/30" : "border-zinc-200")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isManual ? (
                          <span className="text-amber-500 text-sm">⚠</span>
                        ) : (
                          <span className={
                            job.status === "SUCCESS" ? "h-2 w-2 rounded-full bg-emerald-500 inline-block" :
                            job.status === "FAILED" ? "h-2 w-2 rounded-full bg-red-500 inline-block" :
                            job.status === "RUNNING" ? "h-2 w-2 rounded-full bg-amber-500 inline-block" :
                            "h-2 w-2 rounded-full bg-zinc-300 inline-block"
                          } />
                        )}
                        <span className={cn("text-sm font-medium", isManual && "text-amber-700")}>
                          {isManual ? "⚠ Требуется ручное действие" :
                           job.status === "PENDING" ? "Ожидает" :
                           job.status === "RUNNING" ? "Выполняется" :
                           job.status === "SUCCESS" ? "Успешно" :
                           job.status === "FAILED" ? "Ошибка" :
                           "Требуется вручную"}
                        </span>
                        <span className="text-[10px] uppercase text-zinc-400 font-mono px-1.5 py-0.5 rounded bg-zinc-100">
                          {job.mode || "PREVIEW"}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {job.createdAt ? formatDate(job.createdAt) : ""}
                      </span>
                    </div>
                    {isManual && (
                      <p className="text-xs text-amber-700 bg-amber-100/50 rounded p-2 flex items-center gap-1">
                        ⚠ Требуется ручное действие: AI не смог завершить автоматическую подачу.
                        Проверьте статус и заполните форму вручную.
                      </p>
                    )}
                    {job.error && (
                      <p className="text-xs text-red-600 bg-red-50 rounded p-2">{job.error}</p>
                    )}
                    {job.logs && (
                      <details className="text-xs text-zinc-500">
                        <summary className="cursor-pointer hover:text-zinc-700">Логи</summary>
                        <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap bg-zinc-50 rounded p-2">
                          {(() => {
                            try { return JSON.parse(job.logs).join("\n"); }
                            catch { return job.logs; }
                          })()}
                        </pre>
                      </details>
                    )}
                    {job.screenshot && (
                      <details className="text-xs text-zinc-500">
                        <summary className="cursor-pointer hover:text-zinc-700">Скриншот</summary>
                        <img
                          src={`data:image/png;base64,${job.screenshot}`}
                          alt="Submission screenshot"
                          className="mt-1 rounded border max-w-full"
                        />
                      </details>
                    )}
                    {(job.status === "FAILED" || job.status === "NEEDS_MANUAL") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 w-full mt-1"
                        onClick={() => handleStartAiSubmission(job.mode as "PREVIEW" | "SUBMIT")}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Retry Submission
                      </Button>
                    )}
                  </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
