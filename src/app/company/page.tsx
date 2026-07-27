"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

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
    { key: "name", label: "Business Name", placeholder: "ITllect" },
    { key: "legalName", label: "Legal Name", placeholder: "ITllect LLC" },
    { key: "website", label: "Website", placeholder: "https://itllect.com" },
    { key: "email", label: "Email", placeholder: "info@itllect.com" },
    { key: "phone", label: "Phone", placeholder: "+1 (954) 555-0123" },
    { key: "address", label: "Address", placeholder: "100 N University Dr" },
    { key: "city", label: "City", placeholder: "Plantation" },
    { key: "state", label: "State", placeholder: "Florida" },
    { key: "country", label: "Country", placeholder: "USA" },
    { key: "founded", label: "Founded", placeholder: "2015" },
    { key: "category", label: "Category", placeholder: "Digital Marketing Agency" },
    { key: "serviceArea", label: "Service Area", placeholder: "United States, Global" },
    { key: "services", label: "Services", placeholder: "SEO, PPC, Social Media Marketing" },
    { key: "keywords", label: "Keywords", placeholder: "digital marketing agency, SEO" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Company Profile</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your business information used for directory submissions
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
          Save Profile
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business Information
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
              <CardTitle className="text-base">Classification</CardTitle>
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
              <CardTitle className="text-base">Descriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="descriptionShort">Short Description (50 words)</Label>
                <textarea
                  id="descriptionShort"
                  className="mt-1 flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
                  value={form.descriptionShort || ""}
                  onChange={(e) => setForm({ ...form, descriptionShort: e.target.value })}
                  placeholder="Full-service digital marketing agency..."
                />
              </div>
              <div>
                <Label htmlFor="descriptionMedium">Medium Description (100 words)</Label>
                <textarea
                  id="descriptionMedium"
                  className="mt-1 flex min-h-[100px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
                  value={form.descriptionMedium || ""}
                  onChange={(e) => setForm({ ...form, descriptionMedium: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="descriptionLong">Long Description (200-300 words)</Label>
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
