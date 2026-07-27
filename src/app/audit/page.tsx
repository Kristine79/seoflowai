"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Zap,
  Target,
  BarChart3,
  Layers,
  Rocket,
  Loader2,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AuditSummary = {
  total: number;
  highValue: number;
  mediumValue: number;
  lowValue: number;
  opportunityScore: number;
  automationReady: number;
  needManualWork: number;
  byCategory: Record<string, number>;
  topPlatforms: { platform: string; score: number | null; reason: string | null }[];
  recommendations: string[];
};

export default function AuditPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AuditSummary>({
    queryKey: ["audit-summary"],
    queryFn: async () => {
      const res = await fetch("/api/audit/summary");
      return res.json();
    },
  });

  const runAuditMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/audit", { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-summary"] });
      queryClient.invalidateQueries({ queryKey: ["directories"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  const summary = data || {
    total: 0,
    highValue: 0,
    mediumValue: 0,
    lowValue: 0,
    opportunityScore: 0,
    automationReady: 0,
    needManualWork: 0,
    byCategory: {},
    topPlatforms: [],
    recommendations: [],
  };

  const categoryColors: Record<string, string> = {
    BUSINESS_DIRECTORY: "bg-blue-100 text-blue-700",
    AGENCY_DIRECTORY: "bg-purple-100 text-purple-700",
    REVIEW_PLATFORM: "bg-amber-100 text-amber-700",
    PORTFOLIO_PLATFORM: "bg-pink-100 text-pink-700",
    SOCIAL_PROFILE: "bg-sky-100 text-sky-700",
    CONTENT_PLATFORM: "bg-green-100 text-green-700",
    GOVERNMENT_RESOURCE: "bg-red-100 text-red-700",
    PARTNER_DIRECTORY: "bg-indigo-100 text-indigo-700",
    CITATION_AGGREGATOR: "bg-teal-100 text-teal-700",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI SEO Audit</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Comprehensive analysis of your directory submission opportunities
          </p>
        </div>
        <Button
          onClick={() => runAuditMutation.mutate()}
          disabled={runAuditMutation.isPending}
          className="gap-2"
        >
          {runAuditMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
          {runAuditMutation.isPending ? "Auditing..." : "Run AI Audit"}
        </Button>
      </div>

      {runAuditMutation.data && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-3 py-4">
            <Zap className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Audit complete! {runAuditMutation.data.audited} platforms analyzed.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Platforms</CardTitle>
            <Search className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">SEO Opportunity Score</CardTitle>
            <Target className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold">{summary.opportunityScore}/100</div>
            </div>
            <Progress value={summary.opportunityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">High Priority</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{summary.highValue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Automation Ready</CardTitle>
            <Zap className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{summary.automationReady}</div>
            <p className="mt-1 text-xs text-zinc-500">{summary.needManualWork} need manual work</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-600 font-medium">High Value</span>
                  <span>{summary.highValue}</span>
                </div>
                <Progress
                  value={summary.total ? (summary.highValue / summary.total) * 100 : 0}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-600 font-medium">Medium Value</span>
                  <span>{summary.mediumValue}</span>
                </div>
                <Progress
                  value={summary.total ? (summary.mediumValue / summary.total) * 100 : 0}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400 font-medium">Low Value</span>
                  <span>{summary.lowValue}</span>
                </div>
                <Progress
                  value={summary.total ? (summary.lowValue / summary.total) * 100 : 0}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byCategory).length === 0 ? (
                <p className="text-sm text-zinc-400 py-4">Run AI audit to see categories</p>
              ) : (
                Object.entries(summary.byCategory).map(([category, count]) => (
                  <div
                    key={category}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
                      categoryColors[category] || "bg-zinc-100 text-zinc-700"
                    )}
                  >
                    <span>{category.replace(/_/g, " ")}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {summary.total > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Value Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-zinc-100">
                {summary.topPlatforms.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{p.platform}</p>
                      {p.reason && (
                        <p className="text-xs text-zinc-500">{p.reason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "text-lg font-bold",
                          (p.score || 0) >= 80
                            ? "text-emerald-500"
                            : (p.score || 0) >= 60
                            ? "text-amber-500"
                            : "text-zinc-400"
                        )}
                      >
                        {p.score}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {summary.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Campaign Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {i + 1}
                      </div>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
