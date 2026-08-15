import { NextResponse } from "next/server";
import { loadAiProviders, loadSearchProvider } from "@/lib/automation/ai-client";

/**
 * Метаданные для оценки стоимости запуска:
 * - providers: провайдеры chat-режима (baseline);
 * - searchProviders: search-capable провайдеры для web_search-режима;
 * - webSearchAvailable: доступен ли source-aware запуск.
 */
export async function GET() {
  const providers = loadAiProviders().map((p) => ({ name: p.name, model: p.model }));
  const search = loadSearchProvider();
  const searchProviders = [
    ...(search ? [search] : []),
    ...loadAiProviders().filter((p) => p.capabilities.supportsWebSearch),
  ].map((p) => ({ name: p.name, model: p.model }));
  return NextResponse.json({
    providers,
    count: providers.length,
    searchProviders,
    webSearchAvailable: searchProviders.length > 0,
  });
}
