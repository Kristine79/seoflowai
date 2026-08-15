import { aiChatCompletion, loadAiProviders, loadSearchProvider } from "@/lib/automation/ai-client";
import type { AiCitation } from "@/lib/automation/ai-client";

export type ExecutionMode = "chat" | "web_search";

export type ExecutionResult = {
  content: string;
  provider: string;
  model: string;
  latencyMs: number;
  usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | null;
  /** Citations реально возвращённые провайдером; null = провайдер их не вернул. */
  citations: AiCitation[] | null;
  webSearchUsed: boolean;
};

/**
 * Нейтральный системный промпт: моделируем обычный ответ AI-ассистента
 * пользователю. Никаких инструкций про рекомендации — иначе ответы были бы
 * предвзятыми и бесполезными как evidence.
 */
const SYSTEM_PROMPT =
  "You are a helpful assistant. Answer the user's question directly and concisely, in the same language as the question.";

/** Реально доступные search-capable провайдеры (из существующих credentials). */
export function searchCapableProviders() {
  const search = loadSearchProvider();
  const others = loadAiProviders().filter((p) => p.capabilities.supportsWebSearch);
  return search ? [search, ...others] : others;
}
/**
 * Единая точка выполнения AI-промптов для AI Search.
 * - mode "chat": обычные провайдеры (baseline).
 * - mode "web_search": только search-capable провайдеры (например,
 *   perplexity/* на OpenRouter), citations сохраняются если провайдер их вернул.
 * Если search-провайдер не настроен — web_search бросает понятную ошибку
 * («Source data unavailable from this provider»), ничего не симулируется.
 */
export async function executeAiPrompt(text: string, opts: { mode?: ExecutionMode } = {}): Promise<ExecutionResult> {
  const mode: ExecutionMode = opts.mode ?? "chat";
  const started = Date.now();
  const res = await aiChatCompletion(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    { webSearch: mode === "web_search" }
  );
  return {
    content: res.content,
    provider: res.provider,
    model: res.model,
    latencyMs: Date.now() - started,
    usage: res.usage ?? null,
    citations: res.citations ?? null,
    webSearchUsed: mode === "web_search",
  };
}
