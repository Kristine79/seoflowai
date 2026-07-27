"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Globe,
  Target,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";

type DashboardData = {
  totalDirectories: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  completed: number;
  pending: number;
  inProgress: number;
  aiPrepared: number;
  averageSeoScore: number;
  automationEasy: number;
  automationMedium: number;
  automationHard: number;
  automationManual: number;
  byCategory: Record<string, number>;
  recentDirectories: {
    id: string;
    platform: string;
    status: string;
    seoScore: number | null;
  }[];
};

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  const stats = data || {
    totalDirectories: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    aiPrepared: 0,
    averageSeoScore: 0,
    automationEasy: 0,
    automationMedium: 0,
    automationHard: 0,
    automationManual: 0,
    byCategory: {},
    recentDirectories: [],
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Overview of your SEO directory campaigns
          </p>
        </div>
        <Link href="/campaigns">
          <Button className="gap-2">
            <Zap className="h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Platforms</CardTitle>
            <Globe className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalDirectories}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-500">
              <ArrowUpRight className="h-3 w-3" />
              <span>SEO Campaign Active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">SEO Opportunity Score</CardTitle>
            <Target className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.averageSeoScore}/100</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
              <TrendingUp className="h-3 w-3" />
              <span>{stats.highPriority} high-value platforms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">High Priority</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{stats.highPriority}</div>
            <div className="mt-1 text-xs text-zinc-500">
              Ready for submission
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">AI Prepared</CardTitle>
            <Layers className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{stats.aiPrepared}</div>
            <div className="mt-1 text-xs text-zinc-500">
              Content ready for {stats.automationEasy + stats.automationMedium} auto-ready platforms
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>High Priority</span>
                  <span className="font-medium">{stats.highPriority}</span>
                </div>
                <Progress
                  value={stats.totalDirectories ? (stats.highPriority / stats.totalDirectories) * 100 : 0}
                  className="mt-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Medium Priority</span>
                  <span className="font-medium">{stats.mediumPriority}</span>
                </div>
                <Progress
                  value={stats.totalDirectories ? (stats.mediumPriority / stats.totalDirectories) * 100 : 0}
                  className="mt-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Low Priority</span>
                  <span className="font-medium">{stats.lowPriority}</span>
                </div>
                <Progress
                  value={stats.totalDirectories ? (stats.lowPriority / stats.totalDirectories) * 100 : 0}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Pending</span>
                <span className="font-medium">{stats.pending}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">AI Prepared</span>
                <span className="font-medium text-blue-600">{stats.aiPrepared}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">In Progress</span>
                <span className="font-medium text-amber-600">{stats.inProgress}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Completed</span>
                <span className="font-medium text-emerald-600">{stats.completed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Directories</CardTitle>
          <Link href="/directories">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View all <ArrowUpRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-zinc-100">
            {stats.recentDirectories.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <FileSpreadsheet className="h-8 w-8 text-zinc-300" />
                <p className="text-sm text-zinc-500">No directories yet. Import an Excel file to get started.</p>
                <Link href="/campaigns">
                  <Button variant="outline" size="sm" className="mt-2">
                    Create Campaign
                  </Button>
                </Link>
              </div>
            ) : (
              stats.recentDirectories.map((dir) => (
                <div key={dir.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link
                      href={`/directories/${dir.id}`}
                      className="text-sm font-medium hover:text-blue-600"
                    >
                      {dir.platform}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    {dir.seoScore && (
                      <span className="text-sm text-zinc-500">{dir.seoScore}/100</span>
                    )}
                    <Badge
                      variant={
                        dir.status === "COMPLETED"
                          ? "success"
                          : dir.status === "IN_PROGRESS"
                          ? "warning"
                          : dir.status === "AI_PREPARED"
                          ? "info"
                          : "secondary"
                      }
                    >
                      {dir.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
