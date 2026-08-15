import { SectionHeading, Screenshot, NoteCard } from "./ui";
import { INTENT_COVERAGE } from "../data";

const CATEGORY_LABELS: Record<string, string> = {
  Marketing: "Как AI понимает бренд",
  Sales: "Как AI отвечает «покупателю»",
  Competitive: "Как AI отвечает про конкурентов",
  Support: "Как AI отвечает эксперту",
};

export function Intent() {
  return (
    <section className="border-y border-zinc-200 bg-white">
      <div className="mx-auto max-w-5xl px-8 py-16 sm:py-20">
        <div className="space-y-10">
          <SectionHeading
            eyebrow="Intent intelligence"
            title="Интент-покрытие: где бренд присутствует, где — нет"
            lead="Промпты сгруппированы по намерению пользователя. «Observed gap» — категория, где бренд упомянут в меньшем числе промптов, чем мог бы быть."
            scope="Run #2 · 34 responses"
          />

          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-400">
                  <th className="px-5 py-3 font-medium">Intent category</th>
                  <th className="px-5 py-3 font-medium">Prompts</th>
                  <th className="px-5 py-3 font-medium">Run #2 · mentioned</th>
                  <th className="px-5 py-3 font-medium">Run #3 · mentioned</th>
                  <th className="px-5 py-3 font-medium">Observed gap</th>
                </tr>
              </thead>
              <tbody>
                {INTENT_COVERAGE.map((row, i) => {
                  const prev = i > 0 ? INTENT_COVERAGE[i - 1] : null;
                  const showCategory = !prev || prev.category !== row.category;
                  const isGap = row.gap !== undefined;
                  return (
                    <tr
                      key={row.label}
                      className={isGap ? "border-b border-zinc-100 bg-amber-50/40 last:border-b-0" : "border-b border-zinc-100 last:border-b-0"}
                    >
                      {showCategory ? (
                        <td rowSpan={INTENT_COVERAGE.filter((r) => r.category === row.category).length} className="px-5 py-3 align-top text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          {CATEGORY_LABELS[row.category]}
                        </td>
                      ) : null}
                      <td className="px-5 py-3 font-medium text-zinc-800">{row.label}</td>
                      <td className="px-5 py-3 text-zinc-500">{row.prompts}</td>
                      <td className={`px-5 py-3 tabular-nums ${row.run2 === row.prompts + "/" + row.prompts ? "text-emerald-600" : "font-semibold text-amber-600"}`}>
                        {row.run2}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-zinc-700">{row.run3}</td>
                      <td className="px-5 py-3 text-xs text-zinc-500">{row.gap ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <NoteCard>
            Наблюдение, а не вердикт: для Use Case, Problem / Solution и Expert / Technical гэп
            наблюдался во всех трёх запусках. Это факт о данном наборе промптов и провайдерах —
            не заявление, что «AI не знает БОЛИД»: интенты Brand / Product / Comparison покрыты полностью.
          </NoteCard>

          <Screenshot
            src="/case-bolid/runs-intent.png"
            alt="Сравнение интент-покрытия между Run #2 и Run #3"
            caption="Сравнение запусков по интент-категориям — Run A: Run #2 → Run B: Run #3"
          />
        </div>
      </div>
    </section>
  );
}