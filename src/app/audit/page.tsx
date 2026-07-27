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
  Clock,
  Sparkles,
  Gauge,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts";

type AuditSummary = {
  total: number;
  highValue: number;
  mediumValue: number;
  lowValue: number;
  opportunityScore: number;
  automationReady: number;
  needManualWork: number;
  byCategory: Record<string, number>;
  topPlatforms: {
    platform: string;
    score: number | null;
    reason: string | null;
    time: number | null;
    automation: string | null;
    breakdown: string | null;
  }[];
  quickWins: {
    platform: string;
    score: number | null;
    time: number | null;
    reason: string | null;
  }[];
  byScoreRange: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  impactEffortMatrix: {
    highImpactLowEffort: number;
    highImpactHighEffort: number;
    lowImpactLowEffort: number;
    lowImpactHighEffort: number;
  };
  recommendations: string[];
  actionPlan: string[];
};

const COLORS = {
  excellent: "#22c55e",
  good: "#3b82f6",
  average: "#f59e0b",
  poor: "#ef4444",
};

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6", "#f97316"];

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

  const s = data || {
    total: 0,
    highValue: 0,
    mediumValue: 0,
    lowValue: 0,
    opportunityScore: 0,
    automationReady: 0,
    needManualWork: 0,
    byCategory: {},
    topPlatforms: [],
    quickWins: [],
    byScoreRange: { excellent: 0, good: 0, average: 0, poor: 0 },
    impactEffortMatrix: { highImpactLowEffort: 0, highImpactHighEffort: 0, lowImpactLowEffort: 0, lowImpactHighEffort: 0 },
    recommendations: [],
    actionPlan: [],
  };

  const priorityChart = [
    { name: "High", value: s.highValue, color: "#22c55e" },
    { name: "Medium", value: s.mediumValue, color: "#f59e0b" },
    { name: "Low", value: s.lowValue, color: "#a1a1aa" },
  ];

  const categoryChart = Object.entries(s.byCategory).map(([name, value], i) => ({
    name: name.replace(/_/g, " "),
    value,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const scoreRangeChart = [
    { name: "85-100", value: s.byScoreRange.excellent, color: COLORS.excellent },
    { name: "70-84", value: s.byScoreRange.good, color: COLORS.good },
    { name: "50-69", value: s.byScoreRange.average, color: COLORS.average },
    { name: "0-49", value: s.byScoreRange.poor, color: COLORS.poor },
  ];

  const impactEffortData = [
    { name: "High Impact\nLow Effort", value: s.impactEffortMatrix.highImpactLowEffort, color: "#22c55e" },
    { name: "High Impact\nHigh Effort", value: s.impactEffortMatrix.highImpactHighEffort, color: "#f59e0b" },
    { name: "Low Impact\nLow Effort", value: s.impactEffortMatrix.lowImpactLowEffort, color: "#3b82f6" },
    { name: "Low Impact\nHigh Effort", value: s.impactEffortMatrix.lowImpactHighEffort, color: "#ef4444" },
  ];

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
            <div className="text-3xl font-bold">{s.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">SEO Opportunity Score</CardTitle>
            <Gauge className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold">{s.opportunityScore}/100</div>
            </div>
            <Progress value={s.opportunityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Quick Wins</CardTitle>
            <Zap className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{s.quickWins.length}</div>
            <p className="mt-1 text-xs text-zinc-500">High impact, low effort</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Automation Ready</CardTitle>
            <Activity className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{s.automationReady}</div>
            <p className="mt-1 text-xs text-zinc-500">{s.needManualWork} need manual work</p>
          </CardContent>
        </Card>
      </div>

      {s.total > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SEO Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreRangeChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {scoreRangeChart.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Platform Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryChart.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Priority Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={priorityChart}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {priorityChart.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Impact vs Effort Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={impactEffortData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {impactEffortData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {s.quickWins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-500" />
                  Quick Wins — High Impact, Low Effort
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-zinc-100">
                  {s.quickWins.map((qw, i) => (
                    <div key={i} className="flex items-start gap-4 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{qw.platform}</p>
                          {qw.score && (
                            <Badge variant="success" className="text-xs">{qw.score}/100</Badge>
                          )}
                          {qw.time && (
                            <span className="flex items-center gap-1 text-xs text-zinc-400">
                              <Clock className="h-3 w-3" /> ~{qw.time}min
                            </span>
                          )}
                        </div>
                        {qw.reason && (
                          <p className="mt-1 text-sm text-zinc-600">{qw.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Value Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-zinc-100">
                {s.topPlatforms.map((p, i) => {
                  let breakdown: Record<string, number> | null = null;
                  try {
                    if (p.breakdown) breakdown = JSON.parse(p.breakdown);
                  } catch {}

                  return (
                    <div key={i} className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{p.platform}</p>
                          {p.time && (
                            <span className="flex items-center gap-1 text-xs text-zinc-400">
                              <Clock className="h-3 w-3" /> ~{p.time}min
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {p.automation && (
                            <span className="text-xs text-zinc-500">{p.automation}</span>
                          )}
                          <span
                            className={cn(
                              "text-lg font-bold",
                              (p.score || 0) >= 85
                                ? "text-emerald-500"
                                : (p.score || 0) >= 70
                                ? "text-blue-500"
                                : (p.score || 0) >= 50
                                ? "text-amber-500"
                                : "text-zinc-400"
                            )}
                          >
                            {p.score}/100
                          </span>
                        </div>
                      </div>
                      {p.reason && (
                        <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{p.reason}</p>
                      )}
                      {breakdown && (
                        <div className="mt-2 grid grid-cols-6 gap-2">
                          {Object.entries(breakdown).map(([key, val]) => (
                            <div key={key} className="text-center">
                              <div className="text-[10px] font-medium text-zinc-400 truncate">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </div>
                              <div className={cn(
                                "text-xs font-bold",
                                val >= 80 ? "text-emerald-500" : val >= 60 ? "text-amber-500" : "text-zinc-400"
                              )}>
                                {val}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {s.actionPlan.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  7-Day SEO Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {s.actionPlan.map((step, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {i + 1}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {s.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Strategic Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {s.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
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

      {s.total === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Search className="h-12 w-12 text-zinc-300" />
            <div className="text-center">
              <p className="font-medium">No audit data yet</p>
              <p className="mt-1 text-sm text-zinc-500">
                Import directories and run AI Audit to see the analysis.
              </p>
            </div>
            <Button
              onClick={() => runAuditMutation.mutate()}
              disabled={runAuditMutation.isPending}
              className="gap-2"
            >
              <Rocket className="h-4 w-4" />
              Run AI Audit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
