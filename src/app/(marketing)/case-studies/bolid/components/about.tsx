import { SectionHeading } from "./ui";
import { ABOUT_CAPABILITIES } from "../data";

export function About() {
  return (
    <section className="border-y border-zinc-200 bg-white">
      <div className="mx-auto max-w-5xl px-8 py-16 sm:py-20">
        <div className="space-y-10">
          <SectionHeading
            eyebrow="About this workflow"
            title="Что здесь было построено"
            lead="Этот кейс демонстрирует слой AI Search Intelligence в SEOFlow — как измеряется видимость бренда в генеративных AI-ответах и как результаты превращаются в проверяемые действия."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT_CAPABILITIES.map((c) => (
              <div key={c.title} className="rounded-lg border border-zinc-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-zinc-900">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{c.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-6 py-5">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              OBSERVE → EVIDENCE → DIAGNOSE → ACTION → VERIFY → COMPARE
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Каждая цифра в этом кейсе опирается на данные запусков и цитаты; официальные домены,
              формулировки позиционирования и упоминания конкурентов извлекаются по каждому ответу.
              Ни один показатель не сгенерирован «по предположению».
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}