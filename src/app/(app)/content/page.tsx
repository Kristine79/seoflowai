"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  Copy,
  CheckCircle2,
  FileText,
  ChevronRight,
  List,
  Hash,
  FolderTree,
  Tags,
} from "lucide-react";
import { useState } from "react";
import { cn, translateStatus } from "@/lib/utils";

type Directory = {
  id: string;
  platform: string;
  priority: string;
  status: string;
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
  seoAudit: {
    seoScore: number | null;
    platformType: string | null;
  } | null;
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

export default function ContentPage() {
  const queryClient = useQueryClient();
  const [selectedDir, setSelectedDir] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: directories } = useQuery<Directory[]>({
    queryKey: ["directories"],
    queryFn: async () => {
      const res = await fetch("/api/directories");
      return res.json();
    },
  });

  const dir = directories?.find((d) => d.id === selectedDir);

  const generateContent = async () => {
    if (!selectedDir) return;
    setGenerating(true);
    await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ directoryId: selectedDir }),
    });
    setGenerating(false);
    queryClient.invalidateQueries({ queryKey: ["directories"] });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const gc = dir?.generatedContent;
  const categories = parseSuggestedCategories(gc?.suggestedCategories || null);
  const serviceItems = splitLines(gc?.serviceList);
  const primaryKeywords = splitLines(gc?.primaryKeywords);
  const secondaryKeywords = splitLines(gc?.secondaryKeywords);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Генератор контента</h1>
        <p className="mt-1 text-sm text-zinc-500">
          AI-генерация контента для листингов в каталогах
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Выберите платформу</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedDir} onValueChange={setSelectedDir}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите платформу..." />
              </SelectTrigger>
              <SelectContent>
                {directories?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <div className="flex items-center gap-2">
                      <span>{d.platform}</span>
                      {d.generatedContent && (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {dir && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Статус</span>
                  <Badge variant={dir.status === "READY" ? "success" : "secondary"}>
                    {translateStatus(dir.status)}
                  </Badge>
                </div>
                {dir.seoAudit?.seoScore && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">SEO балл</span>
                    <span className={cn("font-semibold", dir.seoAudit.seoScore >= 80 ? "text-emerald-600" : dir.seoAudit.seoScore >= 60 ? "text-amber-600" : "text-zinc-400")}>
                      {dir.seoAudit.seoScore}/100
                    </span>
                  </div>
                )}
                {dir.seoAudit?.platformType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Тип</span>
                    <span>{dir.seoAudit.platformType.replace(/_/g, " ")}</span>
                  </div>
                )}

                <Button
                  onClick={generateContent}
                  disabled={generating}
                  className="w-full gap-2"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {dir.generatedContent ? "Обновить" : "Создать контент"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Сгенерированный контент
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!dir ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50">
                  <Sparkles className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Generate platform-specific company descriptions</p>
                  <p className="mt-1 text-sm text-zinc-500 max-w-md">
                    Select a platform above to generate AI-optimized content tailored for directory submissions.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-md">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center">
                    <p className="text-xs font-medium text-zinc-700">Company description</p>
                    <p className="mt-1 text-[10px] text-zinc-400">~50-300 words</p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center">
                    <p className="text-xs font-medium text-zinc-700">SEO keywords</p>
                    <p className="mt-1 text-[10px] text-zinc-400">Primary + secondary</p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center">
                    <p className="text-xs font-medium text-zinc-700">Categories</p>
                    <p className="mt-1 text-[10px] text-zinc-400">Platform-specific</p>
                  </div>
                </div>
                {(directories?.length || 0) > 0 && (
                  <p className="text-xs text-zinc-400 mt-2">
                    {directories?.filter(d => d.generatedContent).length || 0} of {directories?.length || 0} platforms already have AI content
                  </p>
                )}
              </div>
            ) : !gc ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Sparkles className="h-10 w-10 text-zinc-300" />
                <p className="text-sm text-zinc-500">
                  Контент ещё не создан для {dir.platform}
                </p>
                <Button onClick={generateContent} disabled={generating} variant="outline" className="gap-2">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Создать с AI
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {gc.shortDescription && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">Короткое описание</p>
                        <p className="text-xs text-zinc-400">~50 слов</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(gc.shortDescription!, "short")}
                        className="gap-1"
                      >
                        {copied === "short" ? "Скопировано!" : "Копировать"} <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <p className="text-sm leading-relaxed">{gc.shortDescription}</p>
                    </div>
                  </div>
                )}

                {gc.mediumDescription && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">Среднее описание</p>
                        <p className="text-xs text-zinc-400">~100 слов</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(gc.mediumDescription!, "medium")}
                        className="gap-1"
                      >
                        {copied === "medium" ? "Скопировано!" : "Копировать"} <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <p className="text-sm leading-relaxed">{gc.mediumDescription}</p>
                    </div>
                  </div>
                )}

                {gc.longDescription && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">Полное описание</p>
                        <p className="text-xs text-zinc-400">~300 слов</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(gc.longDescription!, "long")}
                        className="gap-1"
                      >
                        {copied === "long" ? "Скопировано!" : "Копировать"} <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <p className="text-sm leading-relaxed">{gc.longDescription}</p>
                    </div>
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

                {gc.serviceDescription && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-zinc-500">Описание услуг</p>
                      <button
                        onClick={() => copyToClipboard(gc.serviceDescription!, "servdesc")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 ml-auto"
                      >
                        {copied === "servdesc" ? "Скопировано!" : "Копировать"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <p className="text-sm leading-relaxed">{gc.serviceDescription}</p>
                    </div>
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

                {gc.socialBio && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Социальная био</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(gc.socialBio!, "bio")}
                        className="gap-1"
                      >
                        {copied === "bio" ? "Скопировано!" : "Копировать"} <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <p className="text-sm leading-relaxed">{gc.socialBio}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
