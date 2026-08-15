import { SectionHeading, ScopeTag, Screenshot, NoteCard } from "./ui";
import { VERIFICATION_RUN2_RUN3, VERIFICATION_SOURCES } from "../data";

export function Verification() {
  return (
    <section className="mx-auto max-w-5xl px-8 py-16 sm:py-20">
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Verification loop"
          title="Верификационный запуск"
          lead="Run #2 → Run #3 — один провайдер, один режим, один промпт-сет (хэш 9db15516). Между запусками не выполнялось никаких контентных действий: наблюдаемое изменение отражает вариативность ответов AI."
          scope="Run A: Run #2 → Run B: Run #3"
        />

        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-400">
                <th className="px-5 py-3 font-medium">Metric</th>
                <th className="px-5 py-3 font-medium">Before · Run #2</th>
                <th className="px-5 py-3 font-medium">After · Run #3</th>
                <th className="px-5 py-3 font-medium">Observed change</th>
              </tr>
            </thead>
            <tbody>
              {VERIFICATION_RUN2_RUN3.map((m) => (
                <tr key={m.metric} className="border-b border-zinc-100 last:border-b-0">
                  <td className="px-5 py-3 font-medium text-zinc-800">{m.metric}</td>
                  <td className="px-5 py-3 tabular-nums text-zinc-700">{m.before}</td>
                  <td className="px-5 py-3 tabular-nums text-zinc-700">{m.after}</td>
                  <td className={`px-5 py-3 font-semibold tabular-nums ${m.change.startsWith("+") ? "text-emerald-600" : m.change.startsWith("−") ? "text-amber-600" : "text-zinc-400"}`}>
                    {m.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Screenshot
          src="/case-bolid/runs-compare-metrics.png"
          alt="Сравнение метрик Run #2 и Run #3"
          caption="Сравнение запусков в live audit — Run A: #2 → Run B: #3, Scope: 34 responses"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-zinc-900">Источники и позиционирование</h3>
              <ScopeTag>Run #2 → Run #3</ScopeTag>
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-600">
              <li className="rounded-md bg-zinc-50 px-3 py-2.5">
                Уникальные домены: <strong className="text-zinc-800">{VERIFICATION_SOURCES.domains}</strong>
              </li>
              <li className="rounded-md bg-zinc-50 px-3 py-2.5">
                Формулировки позиционирования (топ-списки):{VERIFICATION_SOURCES.positioning}
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-zinc-900">Вывод верификации</h3>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              Run #3 показывает, что наблюдаемые интент-гэпы сохраняются при повторных измерениях,
              тогда как остальные метрики варьируются: Recommendation и Top-3 сдвинулись на ±3 п.п.
              между повторными запусками. Повторный запуск через 2–4 недели даст сопоставимый бенчмарк
              после контентных действий.
            </p>
          </div>
        </div>

        <NoteCard>
          AI Search visibility — это не одно число, а комбинация интент-покрытия, рекомендаций,
          источников, позиционирования, конкурентов и повторных измерений.
        </NoteCard>
      </div>
    </section>
  );
}