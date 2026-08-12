import { X } from "lucide-react";

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
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Проблема</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              SEO directory work ломается, когда площадок становится много.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-zinc-600">
              Пока каталогов пять — всё происходит в голове и вкладках. Когда их пятьдесят или
              семьдесят, процесс превращается в хаос: статусы теряются, формы дублируются,
              а результат невозможно собрать в отчёт.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {problems.map((p) => (
                <div key={p.title} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 shrink-0 text-rose-500" />
                    <h3 className="text-sm font-semibold text-zinc-900">{p.title}</h3>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{p.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                Типичный ручной процесс
              </p>
              <ol className="mt-5 space-y-1">
                {manualSteps.map((step, i) => (
                  <li
                    key={step}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 odd:bg-zinc-50"
                  >
                    <span className="font-mono text-xs text-zinc-400">{String(i + 1).padStart(2, "0")}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                × 77 площадок. И это только одна кампания.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}