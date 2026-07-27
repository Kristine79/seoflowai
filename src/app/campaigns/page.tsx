"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Campaign = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  _count: { directories: number };
};

type UploadResult = {
  total: number;
  imported: number;
  failed: number;
  errors?: string[];
  columns?: string[];
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
        setUploadResult({ total: 0, imported: 0, failed: 0, error: result.error || "Upload failed" });
      } else {
        setUploadResult(result);
      }
    } catch (err) {
      setUploadResult({
        total: 0,
        imported: 0,
        failed: 0,
        error: err instanceof Error ? err.message : "Network error",
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
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your SEO directory submission campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={runAudit} className="gap-2">
            <Rocket className="h-4 w-4" />
            Run AI Audit
          </Button>
          <Button onClick={() => setShowNew(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {showNew && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Q3 2026 Directory Submission"
                />
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Input
                  id="desc"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Main directory listing campaign"
                />
              </div>
              <Button onClick={() => createMutation.mutate()} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Campaign
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
                  <p className="font-medium text-red-800">Upload failed</p>
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
                      {uploadResult.imported} directories imported successfully
                    </p>
                    {uploadResult.filename && (
                      <p className="text-sm text-zinc-600">File: {uploadResult.filename}</p>
                    )}
                    {uploadResult.rowsDetected && (
                      <p className="text-sm text-zinc-600">Rows detected: {uploadResult.rowsDetected}</p>
                    )}
                    {uploadResult.columns && uploadResult.columns.length > 0 && (
                      <p className="text-sm text-zinc-600">
                        Columns: {uploadResult.columns.join(", ")}
                      </p>
                    )}
                    {uploadResult.failed > 0 && (
                      <p className="mt-1 text-sm font-medium text-amber-700">
                        Failed: {uploadResult.failed}
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
                <p className="font-medium">No campaigns yet</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Create your first campaign to get started with directory submissions.
                </p>
              </div>
              <Button onClick={() => setShowNew(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{campaign.name}</h3>
                    <Badge variant={campaign.status === "ACTIVE" ? "success" : "secondary"}>
                      {campaign.status}
                    </Badge>
                  </div>
                  {campaign.description && (
                    <p className="mt-1 text-sm text-zinc-500">{campaign.description}</p>
                  )}
                  <p className="mt-2 text-xs text-zinc-400">
                    Created {formatDate(campaign.createdAt)} • {campaign._count.directories} directories
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
                          console.log(`[Upload] File selected: ${f.name}, size: ${f.size}, type: ${f.type}`);
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        Upload Excel
                      </span>
                    </Button>
                  </label>
                  <Link href={`/directories?campaignId=${campaign.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {file && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Upload {file.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-zinc-50 p-4 text-sm">
              <p><span className="font-medium text-zinc-500">Filename:</span> {file.name}</p>
              <p><span className="font-medium text-zinc-500">Size:</span> {(file.size / 1024).toFixed(1)} KB</p>
              <p><span className="font-medium text-zinc-500">Type:</span> {file.type || "Unknown"}</p>
            </div>
            <Button onClick={handleUpload} disabled={uploading} className="gap-2">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Upload & Parse"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
