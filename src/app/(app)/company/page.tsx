"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Building2, Save, Loader2, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type Company = {
  id: string;
  name: string;
  legalName: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  founded: string | null;
  category: string | null;
  serviceArea: string | null;
  services: string | null;
  keywords: string | null;
  descriptionShort: string | null;
  descriptionMedium: string | null;
  descriptionLong: string | null;
};

export default function CompanyPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<Company>>({});

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["company"],
    queryFn: async () => {
      const res = await fetch("/api/company");
      return res.json();
    },
  });

  useEffect(() => {
    if (company) {
      setForm(company);
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Company>) => {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  const fields: { key: keyof Company; label: string; placeholder?: string }[] = [
    { key: "name", label: "Название компании", placeholder: "Demo Agency" },
    { key: "legalName", label: "Юридическое название", placeholder: "Demo Agency LLC" },
    { key: "website", label: "Веб-сайт", placeholder: "https://example.com" },
    { key: "email", label: "Email", placeholder: "info@example.com" },
    { key: "phone", label: "Телефон", placeholder: "+1 (555) 555-0123" },
    { key: "address", label: "Адрес", placeholder: "1 Demo Way" },
    { key: "city", label: "Город", placeholder: "Springfield" },
    { key: "state", label: "Штат", placeholder: "IL" },
    { key: "country", label: "Страна", placeholder: "USA" },
    { key: "founded", label: "Год основания", placeholder: "2020" },
    { key: "category", label: "Категория", placeholder: "Digital Marketing Agency" },
    { key: "serviceArea", label: "Регион услуг", placeholder: "United States" },
    { key: "services", label: "Услуги", placeholder: "SEO, PPC, Social Media Marketing" },
    { key: "keywords", label: "Ключевые слова", placeholder: "digital marketing agency, SEO" },
  ];

  const allFields: (keyof Company)[] = [
    "name", "legalName", "website", "email", "phone", "address",
    "city", "state", "country", "founded", "category", "serviceArea",
    "services", "keywords", "descriptionShort", "descriptionMedium", "descriptionLong",
  ];

  const filledCount = allFields.filter((k) => form[k] && String(form[k]).trim().length > 0).length;
  const completenessPct = Math.round((filledCount / allFields.length) * 100);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Компания</h1>
            <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  completenessPct >= 80 ? "bg-emerald-500" : completenessPct >= 50 ? "bg-amber-500" : "bg-zinc-400"
                )}
              />
              <span className="text-xs font-medium text-zinc-600">{completenessPct}%</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-zinc-500 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-zinc-400" />
            Master company profile used to generate and personalize directory submissions.
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Сохранить
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Информация о компании
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.slice(0, 10).map((field) => (
                <div key={field.key}>
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    value={form[field.key] || ""}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Классификация</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.slice(10).map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      value={form[field.key] || ""}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Описания</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="descriptionShort">Короткое описание (~50 слов)</Label>
                <textarea
                  id="descriptionShort"
                  className="mt-1 flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
                  value={form.descriptionShort || ""}
                  onChange={(e) => setForm({ ...form, descriptionShort: e.target.value })}
                  placeholder="Full-service digital marketing agency..."
                />
              </div>
              <div>
                <Label htmlFor="descriptionMedium">Среднее описание (~100 слов)</Label>
                <textarea
                  id="descriptionMedium"
                  className="mt-1 flex min-h-[100px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
                  value={form.descriptionMedium || ""}
                  onChange={(e) => setForm({ ...form, descriptionMedium: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="descriptionLong">Полное описание (~200-300 слов)</Label>
                <textarea
                  id="descriptionLong"
                  className="mt-1 flex min-h-[120px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
                  value={form.descriptionLong || ""}
                  onChange={(e) => setForm({ ...form, descriptionLong: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
