import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
  const map: Record<string, string> = {
    PENDING: "Ожидает",
    AI_PREPARED: "AI подготовлен",
    READY: "Готов",
    IN_PROGRESS: "В процессе",
    COMPLETED: "Завершён",
    VERIFICATION_REQUIRED: "Требуется проверка",
    REJECTED: "Отклонён",
    PAYMENT_REQUIRED: "Требуется оплата",
  };
  return map[status] || status;
}

export function translatePriority(priority: string): string {
  const map: Record<string, string> = {
    HIGH: "Высокий",
    MEDIUM: "Средний",
    LOW: "Низкий",
  };
  return map[priority] || priority;
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case "HIGH":
      return "text-emerald-500";
    case "MEDIUM":
      return "text-amber-500";
    case "LOW":
      return "text-slate-400";
    default:
      return "text-slate-400";
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "AI_PREPARED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "READY":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "VERIFICATION_REQUIRED":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "COMPLETED":
      return "bg-green-50 text-green-700 border-green-200";
    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";
    case "PAYMENT_REQUIRED":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function getAutomationColor(level: string) {
  switch (level) {
    case "EASY":
      return "bg-green-100 text-green-800";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";
    case "HARD":
      return "bg-orange-100 text-orange-800";
    case "MANUAL":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getSeoScoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-slate-400";
}
