import { SectionHeading, Screenshot } from "./ui";
import { GAPS } from "../data";

export function Gaps() {
  return (
    <section id="actions" className="scroll-mt-32 border-y border-zinc-200 bg-white">
      <div className="mx-auto max-w-5xl px-8 py-16 sm:py-20">
        <div className="space-y-10">
          <SectionHeading
            eyebrow="From gap to action"
            title="Гэпы → действия"
            lead="Для каждого наблюдаемого интент-гэпа — evidence (доказательство), гипотеза, действие и способ проверки. Все действия — гипотезы, требующие проверки, а не установленные причины."
            scope="All Runs · 3 runs · 102 responses"
          />

          <div className="space-y-6">
            {GAPS.map((g) => (
              <article key={g.id} className="rounded-lg border border-zinc-200 bg-white">
                <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 px-6 py-4">
                  <span className="font-mono text-xs font-semibold text-blue-600">{g.id}</span>
                  <h3 className="text-base font-semibold text-zinc-900">{g.title}</h3>
                  <span className="ml-auto inline-flex items-center rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-medium text-amber-700">
                    {g.coverage}
                  </span>
                </header>
                <div className="grid gap-x-8 gap-y-5 px-6 py-5 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Evidence</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">{g.evidence}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Hypothesis</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">{g.hypothesis}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Action</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">{g.action}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Verification</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">{g.verification}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Screenshot
            src="/case-bolid/gaps.png"
            alt="Вкладка «Гэпы»: гэп-анализ по интент-категориям"
            caption="Вкладка «Гэпы» в live audit — Scope: Run #2 · 34 responses"
          />
        </div>
      </div>
    </section>
  );
}