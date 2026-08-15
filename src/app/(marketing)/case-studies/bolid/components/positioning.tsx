import { SectionHeading, BlueNote } from "./ui";
import { POSITIONING } from "../data";

function PhraseList({ items }: { items: { phrase: string; count: number }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((p) => (
        <li
          key={p.phrase}
          className="flex items-baseline justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3"
        >
          <span className="text-sm text-zinc-800">{p.phrase}</span>
          <span className="font-mono text-xs tabular-nums text-zinc-400">{p.count}</span>
        </li>
      ))}
    </ul>
  );
}

function ChipList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((i) => (
        <li
          key={i}
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700"
        >
          {i}
        </li>
      ))}
    </ul>
  );
}

export function Positioning() {
  return (
    <section className="mx-auto max-w-5xl px-8 py-16 sm:py-20">
      <div className="space-y-10">
        <SectionHeading
          eyebrow="AI positioning"
          title="Как AI описывает БОЛИД и конкурентов"
          lead="Самые частые формулировки, которыми AI описывает бренд, его продукты, категории и отличия."
          scope="Run #2 · 34 responses"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900">Описание бренда</h3>
            <PhraseList items={POSITIONING.brand} />
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-zinc-900">Отличия, упомянутые AI</h3>
              <ChipList items={POSITIONING.differentiators} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <h3 className="text-sm font-semibold text-zinc-900">Продуктовые ассоциации</h3>
              <div className="mt-4 space-y-2">
                <PhraseList items={POSITIONING.product.slice(0, 4)} />
              </div>
            </div>
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-zinc-900">Критерии выбора в контексте БОЛИД</h3>
              <div className="mt-4">
                <ChipList items={POSITIONING.buyerCriteria} />
              </div>
            </div>
          </div>
        </div>

        <BlueNote>
          «Observed AI positioning» — как AI формулирует позиционирование бренда в рамках данного
          набора промптов. Это наблюдение за ответами модели, а не официальное позиционирование
          компании. В Use Case / Problem / Solution промптах конкуренты появлялись чаще, чем БОЛИД —
          это потенциальная возможность, а не установленная причина.
        </BlueNote>
      </div>
    </section>
  );
}