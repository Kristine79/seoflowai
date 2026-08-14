import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getStatusMeta, getToneClassesForStatus, type StatusTone } from "@/lib/status";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function translateStatus(status: string): string {
  return getStatusMeta(status).label;
}

export function deriveNextAction(status: string): string {
  return getStatusMeta(status).nextAction ?? status;
}

export function translatePriority(priority: string): string {
  const map: Record<string, string> = {
    HIGH: "Высокий",
    MEDIUM: "Средний",
    LOW: "Низкий",
  };
  return map[priority] || priority;
}

const PRIORITY_TONES: Record<string, StatusTone> = {
  HIGH: "amber",
  MEDIUM: "blue",
  LOW: "zinc",
};

export function getPriorityColor(priority: string) {
  const tone = PRIORITY_TONES[priority] ?? "zinc";
  return TONE_TEXT[tone];
}

const TONE_TEXT: Record<StatusTone, string> = {
  blue: "text-blue-600",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
  rose: "text-rose-600",
  zinc: "text-zinc-400",
};

export function getStatusColor(status: string) {
  return getToneClassesForStatus(status).badge;
}

const AUTOMATION_TONES: Record<string, StatusTone> = {
  EASY: "blue",
  MEDIUM: "blue",
  HARD: "amber",
  MANUAL: "amber",
};

export function getAutomationColor(level: string) {
  const tone = AUTOMATION_TONES[level] ?? "zinc";
  return `${TONE_BG[tone]} ${TONE_TEXT[tone]}`;
}

const TONE_BG: Record<StatusTone, string> = {
  blue: "bg-blue-50",
  amber: "bg-amber-50",
  emerald: "bg-emerald-50",
  rose: "bg-rose-50",
  zinc: "bg-zinc-100",
};

export function getSeoScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  return "text-zinc-400";
}
