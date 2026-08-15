export type StatusTone = "blue" | "amber" | "emerald" | "rose" | "zinc";

export type StatusMeta = {
  label: string;
  tone: StatusTone;
  nextAction?: string;
};

/**
 * Единый источник истины для всех статусов продукта.
 * Семантика тонов:
 * - blue:    система / автоматизация
 * - amber:   человек / ручное действие
 * - emerald: успех / подтверждено
 * - rose:    блок / отклонение
 * - zinc:    нейтрально / вне процесса
 */
export const STATUS_META: Record<string, StatusMeta> = {
  // Статусы площадок (Directory)
  PENDING: { label: "Ожидает", tone: "blue", nextAction: "Запустить аудит" },
  AI_PREPARED: { label: "AI подготовлен", tone: "blue", nextAction: "Проверить контент" },
  READY: { label: "Готов к подаче", tone: "blue", nextAction: "Отправить заявку" },
  IN_PROGRESS: { label: "В процессе", tone: "blue", nextAction: "Продолжить подачу" },
  WAITING_VERIFICATION: { label: "Ожидает модерации", tone: "blue", nextAction: "Проверить статус" },
  VERIFICATION_REQUIRED: { label: "Требуется проверка", tone: "amber", nextAction: "Проверить размещение" },
  COMPLETED: { label: "Завершено", tone: "emerald" },
  REJECTED: { label: "Отклонено", tone: "rose", nextAction: "Подать повторно" },
  PAYMENT_REQUIRED: { label: "Требуется оплата", tone: "amber", nextAction: "Оплатить" },
  EXTERNAL_BLOCK: { label: "Внешняя блокировка", tone: "rose", nextAction: "Посмотреть причины" },

  // Статусы задач автоматизации (AutomationJob)
  JOB_PENDING: { label: "Ожидает", tone: "blue" },
  JOB_RUNNING: { label: "Выполняется", tone: "blue" },
  JOB_SUCCESS: { label: "Успешно", tone: "emerald" },
  JOB_FAILED: { label: "Ошибка", tone: "rose" },
  JOB_NEEDS_MANUAL: { label: "Требуется человек", tone: "amber", nextAction: "Открыть платформу" },

  // Итоги кампании (отчёт / кейс)
  VERIFIED_SUCCESS: { label: "Подтверждено", tone: "emerald" },
  SUBMITTED: { label: "Отправлено", tone: "blue" },
  NEEDS_MANUAL: { label: "Требуется человек", tone: "amber", nextAction: "Открыть платформу" },
  NOT_RELEVANT: { label: "Не релевантно", tone: "zinc" },
  NOT_SUPPORTED: { label: "Не поддерживается", tone: "zinc" },

  // AI Search Intelligence (аудиты)
  AI_AUDIT_DRAFT: { label: "Черновик", tone: "zinc", nextAction: "Заполнить конфигурацию" },
  AI_AUDIT_READY: { label: "Готов к запуску", tone: "blue", nextAction: "Запустить аудит" },
  AI_AUDIT_RUNNING: { label: "Выполняется", tone: "blue", nextAction: "Следить за прогрессом" },
  AI_AUDIT_COMPLETED: { label: "Завершён", tone: "emerald", nextAction: "Изучить результаты" },
  AI_AUDIT_PARTIAL: { label: "Частично выполнен", tone: "amber", nextAction: "Повторить упавшие промпты" },
  AI_AUDIT_FAILED: { label: "Ошибка", tone: "rose", nextAction: "Повторить запуск" },

  // Ответы AI Search
  AI_RESPONSE_PENDING: { label: "Ожидает", tone: "blue" },
  AI_RESPONSE_SUCCESS: { label: "Получен", tone: "emerald" },
  AI_RESPONSE_FAILED: { label: "Ошибка", tone: "rose" },

  // Гэпы и действия AI Search
  AI_GAP_OPEN: { label: "Открыт", tone: "amber" },
  AI_ACTION_SUGGESTED: { label: "Предложено", tone: "blue" },
  AI_ACTION_PLANNED: { label: "Запланировано", tone: "blue" },
  AI_ACTION_DONE: { label: "Выполнено", tone: "emerald" },
};

export const TONE_CLASSES: Record<StatusTone, { badge: string; dot: string; text: string; surface: string; tileBorder: string }> = {
  blue: {
    badge: "border border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
    text: "text-blue-600",
    surface: "bg-blue-50",
    tileBorder: "border-blue-200/70",
  },
  amber: {
    badge: "border border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    text: "text-amber-600",
    surface: "bg-amber-50",
    tileBorder: "border-amber-200/70",
  },
  emerald: {
    badge: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    surface: "bg-emerald-50",
    tileBorder: "border-emerald-200/70",
  },
  rose: {
    badge: "border border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    text: "text-rose-600",
    surface: "bg-rose-50",
    tileBorder: "border-rose-200/70",
  },
  zinc: {
    badge: "border border-zinc-200 bg-zinc-100 text-zinc-600",
    dot: "bg-zinc-400",
    text: "text-zinc-500",
    surface: "bg-zinc-100",
    tileBorder: "border-zinc-200",
  },
};

export function getStatusMeta(status: string | null | undefined): StatusMeta {
  if (!status) return { label: "—", tone: "zinc" };
  return STATUS_META[status] ?? { label: status, tone: "zinc" };
}

export function getTone(status: string | null | undefined): StatusTone {
  return getStatusMeta(status).tone;
}

export function getToneClasses(tone: StatusTone) {
  return TONE_CLASSES[tone];
}

export function getToneClassesForStatus(status: string | null | undefined) {
  return TONE_CLASSES[getTone(status)];
}
