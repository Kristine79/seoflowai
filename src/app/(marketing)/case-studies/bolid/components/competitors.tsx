import { SectionHeading, ScopeTag, NoteCard } from "./ui";
import { COMPETITORS, COMPETITOR_CASES } from "../data";

export function Competitors() {
  return (
    <section className="border-y border-zinc-200 bg-white">
      <div className="mx-auto max-w-5xl px-8 py-16 sm:py-20">
        <div className="space-y-10">
          <SectionHeading
            eyebrow="Competitor intelligence"
            title="Присутствие конкурентов в AI-ответах"
            lead="Бренды, упомянутые в конкурентных позициях ответов — на уровне анализа, Run #2."
            scope="Run #2 · 34 responses"
          />

          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-400">
                  <th className="px-5 py-3 font-medium">Competitor</th>
                  <th className="px-5 py-3 font-medium">Mentions · Run #2</th>
                  <th className="px-5 py-3 font-medium">Mentions · Run #3</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((c) => (
                  <tr key={c.name} className="border-b border-zinc-100 last:border-b-0">
                    <td className="px-5 py-3 font-semibold text-zinc-900">{c.name}</td>
                    <td className="px-5 py-3 tabular-nums text-zinc-700">{c.run2}</td>
                    <td className="px-5 py-3 tabular-nums text-zinc-500">{c.run3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                Кейсы: конкурент упомянут — БОЛИД отсутствует
              </h3>
              <ScopeTag>Run #2 · 34 responses</ScopeTag>
            </div>
            {COMPETITOR_CASES.map((c) => (
              <div key={c.title} className="rounded-lg border border-zinc-200 bg-white p-5">
                <p className="text-sm font-semibold text-zinc-900">{c.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{c.detail}</p>
              </div>
            ))}
            <NoteCard>
              «Observed competitor presence» — как AI упоминает конкурентов в рамках данного
              набора промптов. Это не официальное позиционирование и не заявление о «главном конкуренте».
            </NoteCard>
          </div>
        </div>
      </div>
    </section>
  );
}