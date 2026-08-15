import { SectionHeading, Screenshot, NoteCard } from "./ui";
import { RUNS } from "../data";

export function Context() {
  return (
    <section id="context" className="mx-auto max-w-5xl scroll-mt-32 px-8 py-16 sm:py-20">
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Case context"
          title="Что мы исследовали"
          lead="Объект исследования — АО НВП «Болид»: российский производитель оборудования и ПО для систем безопасности, автоматизации и диспетчеризации. Мы не меняли сайт и контент бренда — только измеряли, что AI отвечает уже сейчас."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Бренд</p>
            <p className="mt-1.5 text-sm text-zinc-800">АО НВП «Болид» · itllect.com</p>
            <p className="mt-2 text-xs text-zinc-400">Разработка, производство и поставка оборудования и ПО для безопасности</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Веб-сайт</p>
            <p className="mt-1.5 text-sm text-zinc-800">bolid.ru</p>
            <p className="mt-2 text-xs text-zinc-400">Официальный домен бренда — один из объектов source intelligence</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Промпт-сет</p>
            <p className="mt-1.5 text-sm text-zinc-800">34 промпта · 10 интент-категорий</p>
            <p className="mt-2 text-xs text-zinc-400">Фиксированная версия и хэш во всех запусках — запуски сравнимы</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Замер</p>
            <p className="mt-1.5 text-sm text-zinc-800">3 запуска · 102 ответа</p>
            <p className="mt-2 text-xs text-zinc-400">34 промпта × 3 запуска, 34/34 успешных ответов в каждом</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900">Запуски</h3>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-400">
                  <th className="px-5 py-3 font-medium">Run</th>
                  <th className="px-5 py-3 font-medium">Mode</th>
                  <th className="px-5 py-3 font-medium">Provider</th>
                  <th className="px-5 py-3 font-medium">Prompt set</th>
                  <th className="px-5 py-3 font-medium">Success</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {RUNS.map((r) => (
                  <tr key={r.n} className="border-b border-zinc-100 last:border-b-0">
                    <td className="px-5 py-3 font-semibold text-zinc-900">{r.n}</td>
                    <td className="px-5 py-3">
                      <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700">{r.mode}</code>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{r.provider}</td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-500">9db15516</td>
                    <td className="px-5 py-3 text-emerald-600">{r.success}</td>
                    <td className="px-5 py-3 text-zinc-500">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2">
            <NoteCard>
              <strong className="text-zinc-800">Run #1 → Run #2 — это не замер «до/после»:</strong>{" "}
              разные режимы (chat vs web_search) и провайдеры. Только повторные Run #2 → Run #3
              (один режим, один провайдер, один промпт-сет) образуют контур верификации.
            </NoteCard>
            <NoteCard>
              Каждый ответ анализируется отдельным AI-запросом: извлекаются бренд-упоминание,
              рекомендация, позиция (top-3), конкуренты, утверждения, источники и цитаты.
              Классификация источников (official/competitor/industry/…) — rule-based и детерминированная.
            </NoteCard>
          </div>
        </div>

        <Screenshot
          src="/case-bolid/overview-run-history.png"
          alt="История запусков: метрики Run #1, Run #2, Run #3"
          caption="История запусков в live audit — Scope: All Runs · 3 runs · 102 responses"
        />
      </div>
    </section>
  );
}