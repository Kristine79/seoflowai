"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  Copy,
  CheckCircle2,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
    socialBio: string | null;
    keywords: string | null;
  } | null;
  seoAudit: {
    seoScore: number | null;
    platformType: string | null;
  } | null;
};

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Content Generator</h1>
        <p className="mt-1 text-sm text-zinc-500">
          AI-powered content generation for directory listings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Select Platform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedDir} onValueChange={setSelectedDir}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a platform..." />
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
                  <span className="text-zinc-500">Status</span>
                  <Badge variant={dir.status === "READY" ? "success" : "secondary"}>
                    {dir.status.replace("_", " ")}
                  </Badge>
                </div>
                {dir.seoAudit?.seoScore && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">SEO Score</span>
                    <span className={cn("font-semibold", dir.seoAudit.seoScore >= 80 ? "text-emerald-600" : dir.seoAudit.seoScore >= 60 ? "text-amber-600" : "text-zinc-400")}>
                      {dir.seoAudit.seoScore}/100
                    </span>
                  </div>
                )}
                {dir.seoAudit?.platformType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Type</span>
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
                  {dir.generatedContent ? "Regenerate" : "Generate Content"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generated Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!dir ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <FileText className="h-10 w-10 text-zinc-300" />
                <p className="text-sm text-zinc-500">Select a platform to generate content</p>
              </div>
            ) : !dir.generatedContent ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Sparkles className="h-10 w-10 text-zinc-300" />
                <p className="text-sm text-zinc-500">
                  No content generated yet for {dir.platform}
                </p>
                <Button onClick={generateContent} disabled={generating} variant="outline" className="gap-2">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate with AI
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {dir.generatedContent.shortDescription && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">Short Description</p>
                        <p className="text-xs text-zinc-400">~50 words</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(dir.generatedContent!.shortDescription!, "short")}
                        className="gap-1"
                      >
                        {copied === "short" ? "Copied!" : "Copy"} <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <p className="text-sm leading-relaxed">{dir.generatedContent.shortDescription}</p>
                    </div>
                  </div>
                )}

                {dir.generatedContent.mediumDescription && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">Medium Description</p>
                        <p className="text-xs text-zinc-400">~100 words</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(dir.generatedContent!.mediumDescription!, "medium")}
                        className="gap-1"
                      >
                        {copied === "medium" ? "Copied!" : "Copy"} <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <p className="text-sm leading-relaxed">{dir.generatedContent.mediumDescription}</p>
                    </div>
                  </div>
                )}

                {dir.generatedContent.longDescription && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">Long Description</p>
                        <p className="text-xs text-zinc-400">~300 words</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(dir.generatedContent!.longDescription!, "long")}
                        className="gap-1"
                      >
                        {copied === "long" ? "Copied!" : "Copy"} <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <p className="text-sm leading-relaxed">{dir.generatedContent.longDescription}</p>
                    </div>
                  </div>
                )}

                {dir.generatedContent.serviceDescription && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Services Description</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(dir.generatedContent!.serviceDescription!, "services")}
                        className="gap-1"
                      >
                        {copied === "services" ? "Copied!" : "Copy"} <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <p className="text-sm leading-relaxed">{dir.generatedContent.serviceDescription}</p>
                    </div>
                  </div>
                )}

                {dir.generatedContent.socialBio && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Social Bio</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(dir.generatedContent!.socialBio!, "bio")}
                        className="gap-1"
                      >
                        {copied === "bio" ? "Copied!" : "Copy"} <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <p className="text-sm leading-relaxed">{dir.generatedContent.socialBio}</p>
                    </div>
                  </div>
                )}

                {dir.generatedContent.keywords && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Keywords</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(dir.generatedContent!.keywords!, "keywords")}
                        className="gap-1"
                      >
                        {copied === "keywords" ? "Copied!" : "Copy"} <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <p className="text-sm text-zinc-600">{dir.generatedContent.keywords}</p>
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
