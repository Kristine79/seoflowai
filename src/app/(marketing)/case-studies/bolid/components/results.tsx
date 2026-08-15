import { SectionHeading, ScopeTag, StatCard, Screenshot, NoteCard } from "./ui";
import { CORE_METRICS } from "../data";

export function Results() {
  return (
    <section id="results" className="mx-auto max-w-5xl scroll-mt-32 px-8 py-16 sm:py-20">
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Key results"
          title="Ключевые метрики"
          lead="Базовая картина: бренд уверенно присутствует в ответах про бренд, продукты и сравнения, и заметно реже — в «практических» интент-категориях."
          scope="Latest Run · #3 · 34 responses"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard value="34/34" label="Успешных ответов" hint="из 34 промптов · web_search" />
          <StatCard value="70.6%" label="Mention Rate" hint="бренд упомянут в ответе" />
          <StatCard value="17.6%" label="Recommendation Rate" hint="бренд рекомендован" />
          <StatCard value="100%" label="Citation Rate" hint="ответы со ссылками на источники" />
        </div>

        <Screenshot
          src="/case-bolid/overview-metrics.png"
          alt="Метрики latest run: mention, recommendation, top-3, citations"
          caption="Карточка метрик в live audit — Latest Run · #3 · 34 responses"
        />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900">Метрики по запускам</h3>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-400">
                  <th className="px-5 py-3 font-medium">Metric</th>
                  <th className="px-5 py-3 font-medium">Run #1 · chat</th>
                  <th className="px-5 py-3 font-medium">Run #2 · web_search</th>
                  <th className="px-5 py-3 font-medium">Run #3 · web_search</th>
                </tr>
              </thead>
              <tbody>
                {CORE_METRICS.map((m) => (
                  <tr key={m.metric} className="border-b border-zinc-100 last:border-b-0">
                    <td className="px-5 py-3 font-medium text-zinc-800">{m.metric}</td>
                    <td className="px-5 py-3 text-zinc-500">{m.run1}</td>
                    <td className="px-5 py-3 tabular-nums text-zinc-700">{m.run2}</td>
                    <td className="px-5 py-3 font-semibold tabular-nums text-zinc-900">{m.run3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <NoteCard>
            Запуски выполнялись в один день (2026-08-14) с одним промпт-сетом. Run #1 отличается
            режимом и провайдером — сравнивайте его с осторожностью; Run #2 и Run #3 сопоставимы напрямую.
          </NoteCard>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-zinc-900">Observed intent-level finding</h3>
            <ScopeTag>All Runs · 3 runs · 102 responses</ScopeTag>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Бренд стабильно присутствует в ответах на Brand (2/2), Product (4/4), Category (2/2),
            Comparison (6/6) и Competitor (5/5) промпты. В категориях{" "}
            <strong className="text-zinc-800">Use Case (0/3)</strong>,{" "}
            <strong className="text-zinc-800">Problem / Solution (0/3)</strong> и{" "}
            <strong className="text-zinc-800">Expert / Technical (0/2)</strong> гэп наблюдался во
            всех трёх запусках, хотя повторные измерения AI естественно варьируются.
          </p>
        </div>
      </div>
    </section>
  );
}