"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ListTree,
  Search,
  ArrowUpRight,
  Filter,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn, getStatusColor, formatDate } from "@/lib/utils";

type Directory = {
  id: string;
  platform: string;
  url: string | null;
  priority: string;
  category: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  seoAudit: {
    seoScore: number | null;
    automationLevel: string | null;
    platformType: string | null;
  } | null;
  generatedContent: Record<string, unknown> | null;
};

export default function DirectoriesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("ALL");

  const { data: directories, isLoading } = useQuery<Directory[]>({
    queryKey: ["directories"],
    queryFn: async () => {
      const res = await fetch("/api/directories");
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

  const filtered = (directories || []).filter((d) => {
    const matchSearch = d.platform.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || d.status === filter;
    return matchSearch && matchFilter;
  });

  const statusCounts: Record<string, number> = {};
  (directories || []).forEach((d) => {
    statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Directories</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {directories?.length || 0} total platforms
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search platforms..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {["ALL", "PENDING", "AI_PREPARED", "READY", "IN_PROGRESS", "COMPLETED"].map(
            (s) => (
              <Button
                key={s}
                variant={filter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(s)}
                className="text-xs"
              >
                {s === "ALL" ? "All" : s.replace("_", " ")}
                {statusCounts[s] > 0 && (
                  <span className="ml-1.5 rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px]">
                    {statusCounts[s]}
                  </span>
                )}
              </Button>
            )
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <ListTree className="h-10 w-10 text-zinc-300" />
              <p className="text-sm text-zinc-500">No directories found</p>
              <Link href="/campaigns">
                <Button variant="outline" size="sm">
                  Import from Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              <div className="grid grid-cols-7 gap-4 px-6 py-3 text-xs font-medium text-zinc-500">
                <span className="col-span-2">Platform</span>
                <span>Priority</span>
                <span>SEO Score</span>
                <span>Automation</span>
                <span>Status</span>
                <span></span>
              </div>
              {filtered.map((dir) => (
                <Link
                  key={dir.id}
                  href={`/directories/${dir.id}`}
                  className="grid grid-cols-7 gap-4 px-6 py-4 text-sm hover:bg-zinc-50 transition-colors items-center"
                >
                  <div className="col-span-2">
                    <span className="font-medium">{dir.platform}</span>
                    {dir.category && (
                      <p className="text-xs text-zinc-400">{dir.category}</p>
                    )}
                  </div>
                  <div>
                    <Badge
                      variant={
                        dir.priority === "HIGH"
                          ? "success"
                          : dir.priority === "MEDIUM"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {dir.priority}
                    </Badge>
                  </div>
                  <div>
                    {dir.seoAudit?.seoScore ? (
                      <span
                        className={cn(
                          "font-semibold",
                          dir.seoAudit.seoScore >= 80
                            ? "text-emerald-600"
                            : dir.seoAudit.seoScore >= 60
                            ? "text-amber-600"
                            : "text-zinc-400"
                        )}
                      >
                        {dir.seoAudit.seoScore}/100
                      </span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </div>
                  <div>
                    {dir.seoAudit?.automationLevel ? (
                      <span className="text-xs text-zinc-500">
                        {dir.seoAudit.automationLevel}
                      </span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </div>
                  <div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                        getStatusColor(dir.status)
                      )}
                    >
                      {dir.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <ArrowUpRight className="h-4 w-4 text-zinc-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
