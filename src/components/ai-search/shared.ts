import { PROMPT_CATEGORY_LABELS } from "@/lib/ai-search/types";
import { parseAnalysis } from "@/lib/ai-search/metrics";
import type { AiSearchMetrics, AnalysisResult } from "@/lib/ai-search/types";

export { PROMPT_CATEGORY_LABELS, parseAnalysis };
export type { AiSearchMetrics, AnalysisResult };

export type AuditDetail = {
  id: string;
  name: string;
  status: string;
  brand: string;
  website: string | null;
  description: string | null;
  categoryPhrase: string | null;
  products: string | null;
  market: string | null;
  targetAudience: string | null;
  useCases: string | null;
  problems: string | null;
  competitors: string | null;
  promptLanguage: string;
  createdAt: string;
  executedAt: string | null;
  completedAt: string | null;
  promptCount: number;
  promptSetVersion: number;
  promptSetHash: string | null;
  report: string | null;
  reportGeneratedAt: string | null;
  prompts: {
    id: string;
    category: string;
    templateKey: string | null;
    text: string;
    enabled: boolean;
    custom: boolean;
    position: number;
  }[];
  responses: {
    id: string;
    runId: string | null;
    promptId: string;
    promptText: string | null;
    status: string;
    error: string | null;
    provider: string | null;
    model: string | null;
    rawResponse: string | null;
    analysis: unknown;
    positioning: unknown;
    citations: unknown;
    usage: unknown;
    latencyMs: number | null;
    webSearchUsed: boolean;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    prompt: { category: string; text: string };
  }[];
  runs: RunLike[];
  gaps: {
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string | null;
    hypothesis: string | null;
    evidence: unknown;
    status: string;
  }[];
  actions: {
    id: string;
    gapId: string | null;
    priority: string;
    problem: string;
    evidence: unknown;
    recommendation: string;
    target: string | null;
    expectedPurpose: string | null;
    whyThisAction: string | null;
    verificationMethod: string | null;
    status: string;
    note: string | null;
    implementedDate: string | null;
    affectedUrl: string | null;
  }[];
  issues: {
    id: string;
    auditId: string;
    promptId: string | null;
    responseId: string | null;
    claim: string;
    status: string;
    note: string | null;
    createdAt: string;
    reviewedAt: string | null;
  }[];
};

export type RunLike = {
  id: string;
  runNumber: number;
  mode: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  promptSetVersion: number;
  promptSetHash: string | null;
  providers: string[];
  success: number;
  failed: number;
  total: number;
  sourceDetectedResponses: number;
  metrics: AiSearchMetrics;
};

export function fmtRate(v: number | null | undefined, suffix = "%"): string {
  if (v === null || v === undefined) return "Not enough data";
  return `${v}${suffix}`;
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

export function latestResponseOf(responses: AuditDetail["responses"], promptId: string) {
  return responses.filter((r) => r.promptId === promptId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

export function listValues(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function analyzeOf(r: AuditDetail["responses"][number]): AnalysisResult | null {
  return parseAnalysis(r.analysis);
}
