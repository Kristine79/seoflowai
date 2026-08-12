"use client";
import { Link as LinkIcon, Search, CheckCircle2, FileText, ArrowRight, FileBarChart2 } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

const chain = [
  { label: "Status", text: "Площадка переходит в конкретный статус" },
  { label: "Result", text: "Что именно произошло на площадке" },
  { label: "Evidence", text: "Скриншот, URL или ответ сервера" },
  { label: "Record", text: "Запись сохранена в кампании" },
  { label: "Report", text: "Собирается в отчёт по итогам" },
];

const evidence = [
  { icon: Search, title: "Скриншоты", text: "Подтверждённые шаги и результаты подачи" },
  { icon: LinkIcon, title: "URL профиля", text: "Ссылка на опубликованный профиль, если он появился" },
  { icon: CheckCircle2, title: "Статус ответа", text: "Результат автоматизированного шага фиксируется сразу" },
  { icon: FileText, title: "История", text: "Каждое изменение статуса сохраняется в истории площадки" },
];

export function Evidence() {
  return (
    <section className="border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <SectionLabel>Отчётность</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Каждый результат оставляет след.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            SEOFlow не просто показывает «готово». Система сохраняет состояние кампании и результат
            каждого шага — от подачи до проверки.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Цепочка результата — горизонтальный flow на desktop */}
          <Reveal>
            <div className="h-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
                Цепочка результата
              </p>

              {/* desktop: горизонтально */}
              <ol className="mt-6 hidden sm:block">
                {chain.map((step, i) => (
                  <li key={step.label} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-blue-600 bg-white text-xs font-bold text-blue-600">
                      {i + 1}
                    </div>
                    <div className="w-36 shrink-0">
                      <p className="text-sm font-semibold text-zinc-900">{step.label}</p>
                    </div>
                    {i < chain.length - 1 && (
                      <span aria-hidden className="flex flex-1 items-center">
                        <span className="h-px flex-1 bg-zinc-200" />
                        <ArrowRight className="h-3 w-3 -ml-1 text-zinc-300" />
                      </span>
                    )}
                  </li>
                ))}
              </ol>

              {/* mobile: вертикально */}
              <ol className="mt-4 sm:hidden">
                {chain.map((step, i) => (
                  <li key={step.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-blue-600 bg-white text-xs font-bold text-blue-600">
                        {i + 1}
                      </div>
                      {i < chain.length - 1 && <div className="h-6 w-px bg-zinc-200" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-semibold text-zinc-900">{step.label}</p>
                      <p className="mt-0.5 text-sm text-zinc-500">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="mt-4 hidden rounded-xl border border-zinc-100 bg-zinc-50/70 px-4 py-3 text-xs leading-relaxed text-zinc-500 sm:block">
                {chain.map((s) => s.label).join(" → ")} — каждый этап фиксируется, ничего не теряется
                между вкладками и таблицами.
              </p>
            </div>
          </Reveal>

          {/* Доказательства + тёмный отчёт */}
          <div className="grid gap-4 sm:grid-cols-2">
            {evidence.map((e, i) => (
              <Reveal key={e.title} delay={i * 80}>
                <div className="h-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                    <e.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3.5 text-sm font-semibold text-zinc-900">{e.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{e.text}</p>
                </div>
              </Reveal>
            ))}

            <Reveal delay={320} className="sm:col-span-2">
              <div className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:flex-row sm:items-center sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-zinc-200">
                    <FileBarChart2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Отчёт по кампании</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                      Реальная кампания завершается структурированным отчётом — с площадками, статусами
                      и следующими шагами по каждой из них.
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-white/10 px-3 py-1.5 font-mono text-[11px] font-medium text-zinc-300">
                  77 записей
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
