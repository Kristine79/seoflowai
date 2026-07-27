"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { cn, getStatusColor, getAutomationColor } from "@/lib/utils";

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
    return <div className="py-16 text-center text-zinc-500">Directory not found</div>;
  }

  const checklist = [
    { label: "Create account", done: dir.status !== "PENDING" },
    { label: "Add business name", done: dir.status !== "PENDING" },
    { label: "Add description", done: !!dir.generatedContent?.shortDescription },
    { label: "Add services", done: !!dir.generatedContent?.serviceDescription },
    { label: "Add website", done: true },
    { label: "Verify email", done: dir.status === "COMPLETED" },
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
            <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", getStatusColor(dir.status))}>
              {dir.status.replace("_", " ")}
            </span>
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
                Open Website
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
            Complete Task
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
                  SEO Audit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500">SEO Value Score</p>
                    <p className={cn("text-2xl font-bold", (dir.seoAudit.seoScore || 0) >= 80 ? "text-emerald-500" : (dir.seoAudit.seoScore || 0) >= 60 ? "text-amber-500" : "text-zinc-400")}>
                      {dir.seoAudit.seoScore || "—"}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Platform Type</p>
                    <p className="text-sm font-medium">
                      {dir.seoAudit.platformType?.replace(/_/g, " ") || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Automation</p>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1", getAutomationColor(dir.seoAudit.automationLevel || ""))}>
                      {dir.seoAudit.automationLevel || "—"}
                    </span>
                    {dir.seoAudit.automationReason && (
                      <p className="mt-1 text-xs text-zinc-400">{dir.seoAudit.automationReason}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Priority</p>
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
                      {dir.seoAudit.priority}
                    </Badge>
                  </div>
                </div>

                {dir.seoAudit.valueReason && (
                  <div>
                    <p className="text-xs text-zinc-500">Value Assessment</p>
                    <p className="mt-1 text-sm">{dir.seoAudit.valueReason}</p>
                  </div>
                )}

                {dir.seoAudit.recommendation && (
                  <div>
                    <p className="text-xs text-zinc-500">Recommendation</p>
                    <p className="mt-1 text-sm text-blue-700 bg-blue-50 rounded-lg p-3">
                      {dir.seoAudit.recommendation}
                    </p>
                  </div>
                )}

                {dir.seoAudit.duplicateWarning && (
                  <div>
                    <p className="text-xs text-zinc-500">Duplicate Warning</p>
                    <p className="mt-1 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                      {dir.seoAudit.duplicateWarning}
                    </p>
                  </div>
                )}

                {dir.seoAudit.requiredAssets && (
                  <div>
                    <p className="text-xs text-zinc-500">Required Assets</p>
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
                  AI Generated Content
                </CardTitle>
                {!dir.generatedContent && (
                  <Button onClick={generateContent} disabled={generating} size="sm" className="gap-2">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {dir.generatedContent.shortDescription && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Short Description (50 words)</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.shortDescription!, "short")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copied === "short" ? "Copied!" : "Copy"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm">{dir.generatedContent.shortDescription}</p>
                  </div>
                )}
                {dir.generatedContent.mediumDescription && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Medium Description (100 words)</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.mediumDescription!, "medium")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copied === "medium" ? "Copied!" : "Copy"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm">{dir.generatedContent.mediumDescription}</p>
                  </div>
                )}
                {dir.generatedContent.longDescription && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Long Description (300 words)</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.longDescription!, "long")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copied === "long" ? "Copied!" : "Copy"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm">{dir.generatedContent.longDescription}</p>
                  </div>
                )}
                {dir.generatedContent.serviceDescription && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Services</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.serviceDescription!, "services")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copied === "services" ? "Copied!" : "Copy"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm">{dir.generatedContent.serviceDescription}</p>
                  </div>
                )}
                {dir.generatedContent.socialBio && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Social Bio</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.socialBio!, "bio")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copied === "bio" ? "Copied!" : "Copy"} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm">{dir.generatedContent.socialBio}</p>
                  </div>
                )}
                {dir.generatedContent.keywords && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Keywords</p>
                      <button
                        onClick={() => copyToClipboard(dir.generatedContent!.keywords!, "keywords")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copied === "keywords" ? "Copied!" : "Copy"} <Copy className="h-3 w-3" />
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
                  <p className="font-medium">AI content not generated yet</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Generate optimized descriptions and keywords for this platform.
                  </p>
                </div>
                <Button onClick={generateContent} disabled={generating} className="gap-2">
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {generating ? "Generating..." : "Generate Content with AI"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submission Checklist</CardTitle>
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
              <CardTitle className="text-base">Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="login">Login</Label>
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
                <Label htmlFor="password">Password</Label>
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
                <Label htmlFor="listingUrl">Listing URL</Label>
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
                <Label htmlFor="notes">Notes</Label>
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
