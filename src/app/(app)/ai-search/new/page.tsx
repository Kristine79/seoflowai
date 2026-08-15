"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, FlaskConical } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Company = {
  name: string;
  website: string | null;
  category: string | null;
  serviceArea: string | null;
  services: string | null;
  descriptionMedium: string | null;
  descriptionShort: string | null;
};

const BOLID_PRESET: Form = {
  name: "Болид — AI Search Audit (валидация)",
  brand: "АО НВП «Болид»",
  website: "https://bolid.ru",
  description:
    "АО НВП «Болид» — российский разработчик и производитель систем безопасности: охранно-пожарной сигнализации, систем контроля и управления доступом, видеонаблюдения и противопожарной автоматики.",
  categoryPhrase: "систем охранно-пожарной сигнализации и безопасности",
  products: "Орион\nС2000\nСтрелец-Интеграл\nС2000-КДЛ",
  market: "Россия, страны СНГ",
  targetAudience:
    "интеграторы систем безопасности, инженеры по безопасности, объекты промышленности, ритейл и ЖКХ",
  useCases: "охрана промышленных объектов\nпожарная безопасность торговых центров\nконтроль доступа на предприятие",
  problems:
    "противопожарная защита объектов\nорганизация контроля доступа\nобъединение охранной и пожарной сигнализации",
  competitors: "PERCo\nSigur\nRusGuard\nParsec\nRUBEZH",
  promptLanguage: "ru",
};

type Form = {
  name: string;
  brand: string;
  website: string;
  description: string;
  categoryPhrase: string;
  products: string;
  market: string;
  targetAudience: string;
  useCases: string;
  problems: string;
  competitors: string;
  promptLanguage: "ru" | "en";
};

export default function NewAiSearchAudit() {
  const router = useRouter();

  const { data: company, isLoading: companyLoading } = useQuery<Company>({
    queryKey: ["company"],
    queryFn: async () => {
      const res = await fetch("/api/company");
      return res.json();
    },
  });

  const [form, setForm] = useState<Form | null>(null);
  const initialized = form !== null;

  const applyCompany = () => {
    if (!company) return;
    setForm({
      name: "",
      brand: company.name,
      website: company.website || "",
      description: company.descriptionMedium || company.descriptionShort || "",
      categoryPhrase: company.category || "",
      products: company.services || "",
      market: company.serviceArea || "",
      targetAudience: "",
      useCases: "",
      problems: "",
      competitors: "",
      promptLanguage: "en",
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: Form) => {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка создания аудита");
      }
      return res.json();
    },
    onSuccess: (data) => {
      router.push(`/ai-search/${data.audit.id}?tab=prompts`);
    },
  });

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Новый AI Search Audit</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Что исследуем: бренд, продукты, рынок, конкурентов
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-14">
            <Sparkles className="h-10 w-10 text-blue-600" />
            <div className="max-w-lg text-center">
              <p className="text-base font-semibold">Начните с данных компании</p>
              <p className="mt-1 text-sm text-zinc-500">
                Аудит предзаполнится из Company Profile (название, сайт, услуги, описания).
                Останется указать конкурентов и при необходимости поправить остальное.
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={applyCompany} className="gap-2">
                Заполнить из Company Profile
              </Button>
              <Button variant="outline" onClick={() => setForm({ ...BOLID_PRESET, name: "" })} className="gap-2">
                <FlaskConical className="h-4 w-4" />
                Кейс: Болид (валидация)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const set = (key: keyof Form, value: string) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const textareaCls =
    "mt-1 flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2";

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Новый AI Search Audit</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Бренд, продукты и конкуренты → набор AI-запросов для исследования
          </p>
        </div>
        <Button
          onClick={() => createMutation.mutate(form)}
          disabled={createMutation.isPending || !form.brand.trim()}
          className="gap-2"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Создать и сгенерировать промпты
        </Button>
      </div>

      {createMutation.isError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {(createMutation.error as Error).message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Компания и бренд</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Название аудита</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Q3 2026 — AI Search Audit" />
            </div>
            <div>
              <Label htmlFor="brand">Бренд</Label>
              <Input id="brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="website">Веб-сайт</Label>
              <Input id="website" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://example.com" />
            </div>
            <div>
              <Label htmlFor="description">Описание компании</Label>
              <textarea id="description" className={textareaCls} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="categoryPhrase">Категория / рынок запросов</Label>
              <Input id="categoryPhrase" value={form.categoryPhrase} onChange={(e) => set("categoryPhrase", e.target.value)} placeholder="например: систем безопасности" />
            </div>
            <div>
              <Label htmlFor="market">Рынок</Label>
              <Input id="market" value={form.market} onChange={(e) => set("market", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="promptLanguage">Язык промптов</Label>
              <Select value={form.promptLanguage} onValueChange={(v) => set("promptLanguage", v as "ru" | "en")}>
                <SelectTrigger id="promptLanguage" className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Продукты и сценарии</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="products">Продукты / решения (по одному в строке)</Label>
                <textarea id="products" className={textareaCls} value={form.products} onChange={(e) => set("products", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="useCases">Use cases (по одному в строке)</Label>
                <textarea id="useCases" className={textareaCls} value={form.useCases} onChange={(e) => set("useCases", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="problems">Типовые проблемы покупателя (по одной в строке)</Label>
                <textarea id="problems" className={textareaCls} value={form.problems} onChange={(e) => set("problems", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Конкуренты и аудитория</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="competitors">Конкуренты (по одному в строке)</Label>
                <textarea id="competitors" className={textareaCls} value={form.competitors} onChange={(e) => set("competitors", e.target.value)} />
                <p className="mt-1 text-xs text-zinc-400">Используются в comparison / alternatives / competitor промптах</p>
              </div>
              <div>
                <Label htmlFor="targetAudience">Целевая аудитория</Label>
                <Input id="targetAudience" value={form.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}