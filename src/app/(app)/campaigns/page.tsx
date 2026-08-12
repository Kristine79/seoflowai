"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Upload,
  Rocket,
  FileSpreadsheet,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
  Search,
  Sparkles,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatDate, translateStatus, cn } from "@/lib/utils";

type Campaign = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  _count: { directories: number };
  statusCounts: Record<string, number>;
};

type UploadResult = {
  total: number;
  imported: number;
  failed: number;
  errors?: string[];
  columns?: string[];
  headerFound?: string[];
  sample?: { first5: string[]; last5: string[] };
  filename?: string;
  rowsDetected?: number;
  error?: string;
};

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: desc }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setShowNew(false);
      setName("");
      setDesc("");
    },
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);
    if (selectedCampaign) formData.append("campaignId", selectedCampaign);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result: UploadResult = await res.json();

      if (!res.ok) {
        setUploadResult({ total: 0, imported: 0, failed: 0, error: result.error || "Ошибка загрузки" });
      } else {
        setUploadResult(result);
      }
    } catch (err) {
      setUploadResult({
        total: 0,
        imported: 0,
        failed: 0,
        error: err instanceof Error ? err.message : "Сетевая ошибка",
      });
    }

    setFile(null);
    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["directories"] });
  };

  const runAudit = async () => {
    await fetch("/api/audit", { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["directories"] });
    queryClient.invalidateQueries({ queryKey: ["audit-summary"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Кампании</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Управляйте кампаниями по подаче заявок в SEO-каталоги
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={runAudit} className="gap-2">
            <Rocket className="h-4 w-4" />
            Запустить AI аудит
          </Button>
          <Button onClick={() => setShowNew(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Новая кампания
          </Button>
        </div>
      </div>

      {showNew && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Создать кампанию</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Название кампании</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Q3 2026 Подача в каталоги"
                />
              </div>
              <div>
                <Label htmlFor="desc">Описание</Label>
                <Input
                  id="desc"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Основная кампания по каталогам"
                />
              </div>
              <Button onClick={() => createMutation.mutate()} className="gap-2">
                <Plus className="h-4 w-4" />
                Создать кампанию
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadResult && (
        <Card
          className={cn(
            uploadResult.error
              ? "border-red-200 bg-red-50"
              : uploadResult.failed > 0
              ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50"
          )}
        >
          <CardContent className="py-4">
            {uploadResult.error ? (
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Ошибка загрузки</p>
                  <p className="text-sm text-red-600">{uploadResult.error}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  {uploadResult.failed === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-emerald-800">
                      {uploadResult.imported} каталогов импортировано
                    </p>
                    {uploadResult.filename && (
                      <p className="text-sm text-zinc-600">Файл: {uploadResult.filename}</p>
                    )}
                    {uploadResult.rowsDetected && (
                      <p className="text-sm text-zinc-600">Строк обнаружено: {uploadResult.rowsDetected}</p>
                    )}
                  {uploadResult.headerFound && uploadResult.headerFound.length > 0 && (
                    <p className="text-sm text-zinc-600">
                      Заголовки: {uploadResult.headerFound.join(" | ")}
                    </p>
                  )}
                  {uploadResult.sample && (
                    <div className="mt-1 text-sm text-zinc-600">
                      <p>Первые: {uploadResult.sample.first5.join(", ")}</p>
                      <p>Последние: {uploadResult.sample.last5.join(", ")}</p>
                    </div>
                  )}
                    {uploadResult.failed > 0 && (
                      <p className="mt-1 text-sm font-medium text-amber-700">
                        Ошибок: {uploadResult.failed}
                      </p>
                    )}
                  </div>
                </div>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-auto rounded bg-white/50 p-2 text-xs text-zinc-600">
                    {uploadResult.errors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {!campaigns || campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <FileSpreadsheet className="h-12 w-12 text-zinc-300" />
              <div className="text-center">
                <p className="font-medium">Ещё нет кампаний</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Создайте первую кампанию для начала работы с каталогами.
                </p>
              </div>
              <Button onClick={() => setShowNew(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Создать кампанию
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => {
            const sc = campaign.statusCounts || {};
            const completed = sc["COMPLETED"] || 0;
            const inProgress = sc["IN_PROGRESS"] || 0;
            const readyToSubmit = (sc["READY"] || 0) + (sc["AI_PREPARED"] || 0);
            const pending = sc["PENDING"] || 0;
            const waitingVerification = (sc["WAITING_VERIFICATION"] || 0) + (sc["VERIFICATION_REQUIRED"] || 0);
            const needsAction = (sc["REJECTED"] || 0) + (sc["PAYMENT_REQUIRED"] || 0);
            const total = campaign._count.directories;
            const processed = completed + inProgress;
            const progressPct = total > 0 ? Math.round((processed / total) * 100) : 0;

            const workflowSteps = [
              { id: 1, label: "Audit", icon: Search, key: "audit" },
              { id: 2, label: "Select", icon: BarChart3, key: "select" },
              { id: 3, label: "Prepare", icon: Sparkles, key: "prepare" },
              { id: 4, label: "Submit", icon: ArrowUpRight, key: "submit" },
              { id: 5, label: "Verify", icon: CheckSquare, key: "verify" },
              { id: 6, label: "Report", icon: Sparkles, key: "report" },
            ];

            let currentStep = 0;
            if (total === 0) currentStep = 0;
            else if (completed > 0 && completed >= total) currentStep = 6;
            else if (waitingVerification > 0 || needsAction > 0) currentStep = 5;
            else if (inProgress > 0) currentStep = 4;
            else if (readyToSubmit > 0) currentStep = 4;
            else if (sc["AI_PREPARED"] > 0) currentStep = 3;
            else if (sc["PENDING"] === total) currentStep = 2;
            else if (total > 0) currentStep = 3;

            return (
            <Card key={campaign.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{campaign.name}</h3>
                      <Badge variant={campaign.status === "ACTIVE" ? "success" : "secondary"}>
                        {campaign.status === "ACTIVE" ? "Активна" : campaign.status}
                      </Badge>
                    </div>
                    {campaign.description && (
                      <p className="mt-1 text-sm text-zinc-500">{campaign.description}</p>
                    )}
                    <p className="mt-2 text-xs text-zinc-400">
                      Создана {formatDate(campaign.createdAt)} • {total} каталогов
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setFile(f);
                          setSelectedCampaign(campaign.id);
                          setUploadResult(null);
                          if (f) {
                            console.log(`[Upload] Файл выбран: ${f.name}, размер: ${f.size}, тип: ${f.type}`);
                          }
                        }}
                      />
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <span>
                          <Upload className="h-4 w-4" />
                          Загрузить Excel
                        </span>
                      </Button>
                    </label>
                    <Link href={`/directories?campaignId=${campaign.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        Смотреть <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {total > 0 && (
                  <>
                    <div className="flex items-center gap-1 mb-4">
                      {workflowSteps.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-1">
                          <div
                            className={cn(
                              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                              currentStep >= step.id
                                ? "bg-blue-50 text-blue-700"
                                : "text-zinc-400"
                            )}
                          >
                            <step.icon className="h-3 w-3" />
                            <span className="hidden sm:inline">{step.label}</span>
                          </div>
                          {i < workflowSteps.length - 1 && (
                            <div
                              className={cn(
                                "h-px w-3",
                                currentStep > step.id ? "bg-blue-300" : "bg-zinc-200"
                              )}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-5 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-emerald-600">{completed}</div>
                        <div className="text-[10px] text-zinc-400">Завершено</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-amber-600">{inProgress}</div>
                        <div className="text-[10px] text-zinc-400">В процессе</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-blue-600">{readyToSubmit}</div>
                        <div className="text-[10px] text-zinc-400">К подаче</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-orange-600">{waitingVerification}</div>
                        <div className="text-[10px] text-zinc-400">На проверке</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-red-600">{needsAction}</div>
                        <div className="text-[10px] text-zinc-400">Требуют действия</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1">
                        <Progress value={progressPct} className="h-2" />
                      </div>
                      <span className="text-xs text-zinc-500 min-w-[3rem] text-right">{progressPct}%</span>
                    </div>

                    {readyToSubmit > 0 && (
                      <Link href={`/directories?status=READY&campaignId=${campaign.id}`}>
                        <Button className="gap-2 w-full">
                          <ArrowUpRight className="h-4 w-4" />
                          Продолжить кампанию — {readyToSubmit} к подаче
                        </Button>
                      </Link>
                    )}
                    {inProgress > 0 && readyToSubmit === 0 && (
                      <Link href={`/directories?status=IN_PROGRESS&campaignId=${campaign.id}`}>
                        <Button className="gap-2 w-full">
                          <CheckCircle2 className="h-4 w-4" />
                          Продолжить — {inProgress} в процессе
                        </Button>
                      </Link>
                    )}
                    {total > 0 && readyToSubmit === 0 && inProgress === 0 && waitingVerification === 0 && needsAction === 0 && completed < total && (
                      <Link href={`/directories?campaignId=${campaign.id}`}>
                        <Button variant="outline" className="gap-2 w-full">
                          <Rocket className="h-4 w-4" />
                          Запустить AI аудит
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            );
          })
        )}
      </div>

      {file && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Загрузка {file.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-zinc-50 p-4 text-sm">
              <p><span className="font-medium text-zinc-500">Имя:</span> {file.name}</p>
              <p><span className="font-medium text-zinc-500">Размер:</span> {(file.size / 1024).toFixed(1)} KB</p>
              <p><span className="font-medium text-zinc-500">Тип:</span> {file.type || "Неизвестно"}</p>
            </div>
            <Button onClick={handleUpload} disabled={uploading} className="gap-2">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Загрузка..." : "Загрузить и обработать"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
