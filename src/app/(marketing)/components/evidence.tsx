import { Link, Search, CheckCircle2, FileText } from "lucide-react";

const chain = [
  { label: "Status", text: "Площадка переходит в конкретный статус" },
  { label: "Result", text: "Что именно произошло на площадке" },
  { label: "Evidence", text: "Скриншот, URL или ответ сервера" },
  { label: "Record", text: "Запись сохранена в кампании" },
  { label: "Report", text: "Собирается в отчёт по итогам" },
];

const evidence = [
  { icon: Search, title: "Скриншоты", text: "Подтверждённые шаги и результаты подачи" },
  { icon: Link, title: "URL профиля", text: "Ссылка на опубликованный профиль, если он появился" },
  { icon: CheckCircle2, title: "Статус ответа", text: "Результат автоматизированного шага фиксируется сразу" },
  { icon: FileText, title: "История", text: "Каждое изменение статуса сохраняется в истории площадки" },
];

export function Evidence() {
  return (
    <section className="border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Отчётность</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Каждый результат оставляет след.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-600">
            SEOFlow не просто показывает «готово». Система сохраняет состояние кампании и результат
            каждого шага — от подачи до проверки.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Цепочка результата
            </p>
            <ol className="mt-5">
              {chain.map((step, i) => (
                <li key={step.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-bold text-blue-600">
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {evidence.map((e) => (
              <div key={e.title} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <e.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3.5 text-sm font-semibold text-zinc-900">{e.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{e.text}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-900 p-5 sm:col-span-2">
              <p className="text-sm font-medium text-white">Отчёт по кампании</p>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                Реальная кампания завершается структурированным отчётом — с площадками, статусами
                и следующими шагами по каждой из них.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}