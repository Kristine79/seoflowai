"use client";
import { X } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

const manualSteps = [
  "Поиск площадок",
  "Проверка требований",
  "Регистрация",
  "Копирование данных",
  "Подготовка описаний",
  "Подача",
  "Проверка email / OAuth",
  "Модерация",
  "Повторная проверка",
  "Таблицы",
];

const problems = [
  { title: "Десятки вкладок", text: "Каждая площадка — отдельный сеанс браузера и отдельный контекст." },
  { title: "Разные формы", text: "Регистрации, поля и требования отличаются от платформы к платформе." },
  { title: "Непредсказуемые блокировки", text: "Cloudflare, капчи и IP-ограничения возникают без предупреждения." },
  { title: "Потерянные статусы", text: "Что отправлено, что подтверждено, что отклонено — теряется в переписке и файлах." },
  { title: "Повторная ручная работа", text: "Одни и те же данные компании перепечатываются в каждой форме заново." },
];

export function Problem() {
  return (
    <section className="border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          {/* ---- Левая часть: проблема ---- */}
          <Reveal>
            <SectionLabel>Проблема</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              SEO directory work ломается, когда площадок становится много.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-600">
              Пока каталогов пять — всё происходит в голове и вкладках. Когда их пятьдесят или
              семьдесят, процесс превращается в хаос: статусы теряются, формы дублируются,
              а результат невозможно собрать в отчёт.
            </p>

            <ul className="mt-9 divide-y divide-zinc-200/70 border-y border-zinc-200/70">
              {problems.map((p) => (
                <li key={p.title} className="flex gap-4 py-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-rose-200 bg-rose-50">
                    <X className="h-3.5 w-3.5 text-rose-500" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{p.title}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* ---- Правая часть: ручной процесс ---- */}
          <Reveal delay={120}>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
                  Типичный ручной процесс
                </p>
                <span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-[10px] font-medium text-zinc-500">
                  × 77 повторений
                </span>
              </div>

              <ol className="grid grid-cols-1 sm:grid-cols-2">
                {manualSteps.map((step, i) => (
                  <li
                    key={step}
                    className="flex items-center gap-3 border-b border-zinc-50 px-6 py-3 text-sm text-zinc-600 sm:odd:border-r"
                  >
                    <span className="font-mono text-xs tabular-nums text-zinc-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              <div className="flex items-center justify-between gap-4 bg-zinc-900 px-6 py-5">
                <p className="text-sm font-medium text-white">
                  77 площадок.
                  <span className="text-zinc-400"> И это только одна кампания.</span>
                </p>
                <span aria-hidden className="font-mono text-lg font-semibold text-zinc-600">
                  ×77
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-zinc-400">
              Десять шагов × 77 площадок. Большая часть из них — копирование одних и тех же данных
              компании в разные формы.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
