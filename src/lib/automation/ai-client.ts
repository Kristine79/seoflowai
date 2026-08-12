import OpenAI from "openai";

export interface AiProvider {
  name: string;
  model: string;
  client: OpenAI;
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
    });
  };
  add("primary", "OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_MODEL");
  add("fallback-2", "OPENAI_API_KEY_2", "OPENAI_BASE_URL_2", "OPENAI_MODEL_2");
  add("fallback-3", "OPENAI_API_KEY_3", "OPENAI_BASE_URL_3", "OPENAI_MODEL_3");
  return providers;
}

export interface AiChatResult {
  content: string;
  provider: string;
  model: string;
}

/**
 * Try each configured provider in order until one returns a valid response.
 * Throws the last error if all providers fail.
 */
export async function aiChatCompletion(
  messages: { role: string; content: string }[],
  opts: { response_format?: { type: "json_object" | "text" | "json_schema" } } = {}
): Promise<AiChatResult> {
  const providers = loadAiProviders();
  if (providers.length === 0) throw new Error("No AI providers configured (OPENAI_API_KEY)");
  let lastErr: unknown;
  for (const p of providers) {
    try {
      const response = await p.client.chat.completions.create({
        model: p.model,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        ...(opts.response_format
          ? { response_format: opts.response_format as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming["response_format"] }
          : {}),
      });
      const content = response.choices[0]?.message?.content;
      if (content) return { content, provider: p.name, model: p.model };
      lastErr = new Error("empty response");
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
