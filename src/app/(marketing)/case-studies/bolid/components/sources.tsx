import { SectionHeading, ScopeTag, Screenshot, NoteCard, StatCard } from "./ui";
import { OFFICIAL_DOMAINS, SOURCE_TYPES, TOP_DOMAINS } from "../data";

export function Sources() {
  return (
    <section id="sources" className="mx-auto max-w-5xl scroll-mt-32 px-8 py-16 sm:py-20">
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Source intelligence"
          title="Какие источники AI использует, описывая БОЛИД"
          lead="Сводка по упоминаниям источников в ответах web_search запуска."
          scope="Run #2 · 34 responses"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard value="277" label="Упоминаний источников" hint="в 34 ответах" />
          <StatCard value="157" label="Уникальных доменов" />
          <StatCard value="7.9%" label="Official Source Rate" hint="22 упоминания официальных доменов" />
          <StatCard value="19" label="bolid.ru" hint="упоминаний в источниках" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900">Официальные домены</h3>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs text-zinc-400">
                    <th className="px-5 py-3 font-medium">Domain</th>
                    <th className="px-5 py-3 font-medium">Mentions</th>
                  </tr>
                </thead>
                <tbody>
                  {OFFICIAL_DOMAINS.map((d) => (
                    <tr key={d.domain} className="border-b border-zinc-100 last:border-b-0">
                      <td className="px-5 py-3 font-mono text-xs text-zinc-800">{d.domain}</td>
                      <td className="px-5 py-3 text-zinc-600">{d.mentions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <NoteCard>
              По классификации типов «official» получилось 21 упоминание (7.6%): один официальный
              домен попал под другой тип — флаг по домену = 22. Оба значения выводятся в аудите.
            </NoteCard>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900">Источники по типам</h3>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs text-zinc-400">
                    <th className="px-5 py-3 font-medium">Source type</th>
                    <th className="px-5 py-3 font-medium">Mentions</th>
                    <th className="px-5 py-3 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {SOURCE_TYPES.map((s) => (
                    <tr key={s.type} className="border-b border-zinc-100 last:border-b-0">
                      <td className="px-5 py-3 text-zinc-800">{s.type}</td>
                      <td className="px-5 py-3 tabular-nums text-zinc-600">{s.mentions}</td>
                      <td className="px-5 py-3 tabular-nums text-zinc-500">{s.share}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900">Топ-домены кроме bolid.ru</h3>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs text-zinc-400">
                    <th className="px-5 py-3 font-medium">Domain</th>
                    <th className="px-5 py-3 font-medium">Mentions</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_DOMAINS.map((d) => (
                    <tr key={d.domain} className="border-b border-zinc-100 last:border-b-0">
                      <td className="px-5 py-3 font-mono text-xs text-zinc-800">{d.domain}</td>
                      <td className="px-5 py-3 text-zinc-600">{d.mentions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-zinc-900">Observed pattern</h3>
              <ScopeTag>Run #2 · 34 responses</ScopeTag>
            </div>
            <ul className="space-y-2 text-sm leading-relaxed text-zinc-600">
              <li className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                Более половины источников (56.7%) — гетерогенная категория «Other».
              </li>
              <li className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                Review-площадки дали 0 упоминаний источников.
              </li>
              <li className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                Доля официальных доменов — менее 8% всех цитируемых источников.
              </li>
            </ul>
          </div>
        </div>

        <Screenshot
          src="/case-bolid/sources.png"
          alt="Источники: официальные домены, классификация, топ-домены"
          caption="Вкладка «Источники» в live audit — Scope: Run #2 · 34 responses"
        />
      </div>
    </section>
  );
}