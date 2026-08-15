import { Eyebrow, StatCard } from "./ui";

const SUMMARY_STATS = [
  { value: "34", label: "промпта", hint: "10 интент-категорий" },
  { value: "3", label: "запуска", hint: "один промпт-сет во всех" },
  { value: "102", label: "AI-ответа", hint: "34 промпта × 3 запуска" },
];

export function Summary() {
  return (
    <section className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-5xl px-8 py-16 sm:py-20">
        <div className="space-y-8">
          <Eyebrow>Executive summary</Eyebrow>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Что показал кейс
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {SUMMARY_STATS.map((s) => (
              <StatCard key={s.label} value={s.value} label={s.label} hint={s.hint} />
            ))}
          </div>

          <blockquote className="border-l-2 border-blue-600 pl-5">
            <p className="text-base leading-relaxed text-zinc-700">
              AI Search visibility — не одно число. В этом исследовании мы одновременно отслеживали
              intent coverage, рекомендации, источники, позиционирование, конкурентное присутствие
              и изменения между повторными запусками.
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}