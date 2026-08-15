import OpenAI from "openai";

export interface AiProviderCapabilities {
  supportsWebSearch: boolean;
  supportsCitations: boolean;
  supportsStructuredOutput: boolean;
  supportsUsage: boolean;
}

export interface AiProvider {
  name: string;
  model: string;
  client: OpenAI;
  capabilities: AiProviderCapabilities;
}

export interface AiCitation {
  url: string;
  title: string | null;
  startIndex: number | null;
  endIndex: number | null;
}

/**
 * Детерминированная оценка возможностей провайдера.
 * - web_search/citations: модели с префиксом perplexity/ (реальный веб-поиск
 *   с citations в message.annotations) либо модель с суффиксом :online,
 *   либо модель из OPENAI_WEB_SEARCH_MODELS (явный override в env).
 * Никаких предположений для произвольных моделей: неизвестное = не поддерживает.
 */
const WEB_SEARCH_MODEL_PREFIXES = ["perplexity/"];
const WEB_SEARCH_MODEL_SUFFIXES = [":online"];

function detectCapabilities(baseURL: string | undefined, model: string): AiProviderCapabilities {
  const envWebModels = (process.env.OPENAI_WEB_SEARCH_MODELS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const modelLc = model.toLowerCase();
  const webSearch =
    WEB_SEARCH_MODEL_PREFIXES.some((p) => modelLc.startsWith(p)) ||
    WEB_SEARCH_MODEL_SUFFIXES.some((s) => modelLc.endsWith(s)) ||
    envWebModels.includes(modelLc);
  return {
    supportsWebSearch: webSearch,
    supportsCitations: webSearch,
    supportsStructuredOutput: true,
    supportsUsage: true,
  };
}

/**
 * Ordered AI providers from env. First provider that returns a valid response wins.
 *  - primary:  OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL
 *  - fallback: OPENAI_API_KEY_2 / OPENAI_BASE_URL_2 / OPENAI_MODEL_2
 *  - fallback: OPENAI_API_KEY_3 / OPENAI_BASE_URL_3 / OPENAI_MODEL_3
 */
export function loadAiProviders(): AiProvider[] {
  const providers: AiProvider[] = [];
  const add = (name: string, keyVar: string, urlVar: string, modelVar: string) => {
    const apiKey = process.env[keyVar];
    if (!apiKey) return;
    const baseURL = process.env[urlVar] || undefined;
    const model = process.env[modelVar] || process.env.OPENAI_MODEL || "gpt-4o-mini";
    providers.push({
      name,
      model,
      client: new OpenAI({ apiKey, baseURL, timeout: 60000, maxRetries: 1 }),
      capabilities: detectCapabilities(baseURL, model),
    });
  };
  add("primary", "OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_MODEL");
  add("fallback-2", "OPENAI_API_KEY_2", "OPENAI_BASE_URL_2", "OPENAI_MODEL_2");
  add("fallback-3", "OPENAI_API_KEY_3", "OPENAI_BASE_URL_3", "OPENAI_MODEL_3");
  return providers;
}

/**
 * Выделенный search-capable провайдер для source-aware запусков (web_search).
 * Конфигурация: OPENAI_SEARCH_API_KEY / OPENAI_SEARCH_BASE_URL / OPENAI_SEARCH_MODEL.
 * Если не заданы — используются существующие OPENAI_API_KEY / OPENAI_BASE_URL
 * с моделью perplexity/sonar (реальный веб-поиск на OpenRouter).
 * Никаких изменений .env не требуется; model можно переопределить
 * через OPENAI_SEARCH_MODEL.
 */
export function loadSearchProvider(): AiProvider | null {
  const apiKey = process.env.OPENAI_SEARCH_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const baseURL = process.env.OPENAI_SEARCH_BASE_URL || process.env.OPENAI_BASE_URL || undefined;
  const model = process.env.OPENAI_SEARCH_MODEL || "perplexity/sonar";
  const caps = detectCapabilities(baseURL, model);
  if (!caps.supportsWebSearch) return null;
  return {
    name: "search",
    model,
    client: new OpenAI({ apiKey, baseURL, timeout: 60000, maxRetries: 1 }),
    capabilities: caps,
  };
}

export interface AiChatResult {
  content: string;
  provider: string;
  model: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | null;
  /** Реальные citations, возвращённые провайдером (например, message.annotations у perplexity). */
  citations?: AiCitation[] | null;
}

type ChatOptions = {
  response_format?: { type: "json_object" | "text" | "json_schema" };
  /** web_search: использовать только провайдеров с supportsWebSearch */
  webSearch?: boolean;
};

/**
 * Try each configured provider in order until one returns a valid response.
 * In webSearch mode only providers with supportsWebSearch are used.
 * Throws the last error if all providers fail.
 */
export async function aiChatCompletion(
  messages: { role: string; content: string }[],
  opts: ChatOptions = {}
): Promise<AiChatResult> {
  const providers = loadAiProviders();
  if (providers.length === 0 && !opts.webSearch) {
    throw new Error("No AI providers configured (OPENAI_API_KEY)");
  }
  const candidates = opts.webSearch
    ? [loadSearchProvider(), ...providers.filter((p) => p.capabilities.supportsWebSearch)].filter(
        (p): p is AiProvider => p !== null
      )
    : providers;
  if (candidates.length === 0) {
    throw new Error(
      opts.webSearch
        ? "Source data unavailable: no web-search-capable provider is configured (OPENAI_SEARCH_MODEL/perplexity/*)."
        : "No AI providers configured (OPENAI_API_KEY)"
    );
  }
  let lastErr: unknown;
  for (const p of candidates) {
    try {
      const response = await p.client.chat.completions.create({
        model: p.model,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        ...(opts.response_format
          ? { response_format: opts.response_format as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming["response_format"] }
          : {}),
      });
      const content = response.choices[0]?.message?.content;
      if (content) {
        const rawMessage = response.choices[0].message as unknown as Record<string, unknown>;
        const annotations = Array.isArray(rawMessage.annotations) ? rawMessage.annotations : [];
        const citations: AiCitation[] = annotations
          .map((a) => {
            const rec = a && typeof a === "object" ? (a as Record<string, unknown>) : {};
            const cit =
              rec.type === "url_citation" &&
              rec.url_citation &&
              typeof rec.url_citation === "object"
                ? (rec.url_citation as Record<string, unknown>)
                : rec;
            const url = typeof cit.url === "string" ? cit.url : null;
            if (!url) return null;
            return {
              url,
              title: typeof cit.title === "string" && cit.title.trim() ? cit.title.trim() : null,
              startIndex: typeof cit.start_index === "number" ? cit.start_index : null,
              endIndex: typeof cit.end_index === "number" ? cit.end_index : null,
            };
          })
          .filter((c): c is AiCitation => c !== null);
        return {
          content,
          provider: p.name,
          model: p.model,
          usage: {
            promptTokens: response.usage?.prompt_tokens ?? undefined,
            completionTokens: response.usage?.completion_tokens ?? undefined,
            totalTokens: response.usage?.total_tokens ?? undefined,
          },
          citations: citations.length > 0 ? citations : null,
        };
      }
      lastErr = new Error("empty response");
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
