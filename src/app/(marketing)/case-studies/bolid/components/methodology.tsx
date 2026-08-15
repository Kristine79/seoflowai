import { SectionHeading, Screenshot } from "./ui";

const STEPS = [
  {
    n: "01",
    title: "Prompt design",
    detail: "34 промпта в 10 интент-категориях: Brand, Product, Category, Buyer Intent, Use Case, Comparison, Alternatives, Problem / Solution, Expert / Technical, Competitor.",
  },
  {
    n: "02",
    title: "AI Search run",
    detail: "Запуск по провайдеру в режиме chat или web_search. Каждый запуск исполняет весь промпт-сет с сохранением версии и хэша.",
  },
  {
    n: "03",
    title: "Raw responses",
    detail: "Сырые ответы AI сохраняются как неизменяемые доказательства — их можно пересматривать в любой момент.",
  },
  {
    n: "04",
    title: "Source extraction",
    detail: "Из каждого ответа извлекаются источники и цитаты; классификация по типам и официальным доменам.",
  },
  {
    n: "05",
    title: "Competitor analysis",
    detail: "Какие конкуренты упоминаются в позициях ответов, где бренд присутствует, а где — нет.",
  },
  {
    n: "06",
    title: "Positioning intelligence",
    detail: "Как AI описывает бренд: продуктовые и категорийные ассоциации, отличия, критерии выбора покупателя.",
  },
  {
    n: "07",
    title: "Gap analysis",
    detail: "Интент-уровневые гэпы: категории промптов, где бренд отсутствует, при наличии возможностей.",
  },
  {
    n: "08",
    title: "Actions",
    detail: "Гипотезы и контентные действия по каждому гэпу — с явной пометкой «требует проверки».",
  },
  {
    n: "09",
    title: "Verification run",
    detail: "Повторный запуск того же промпт-сета через 2–4 недели для проверки изменений.",
  },
];

export function Methodology() {
  return (
    <section id="methodology" className="scroll-mt-32 border-y border-zinc-200 bg-white">
      <div className="mx-auto max-w-5xl px-8 py-16 sm:py-20">
        <div className="space-y-10">
          <SectionHeading
            eyebrow="Methodology"
            title="Как проводилось исследование"
            lead="OBSERVE → EVIDENCE → DIAGNOSE → ACTION → VERIFY → COMPARE: рабочий процесс AI Search Intelligence, применённый к АО НВП «Болид»."
          />

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-lg border border-zinc-200 bg-white p-5">
                <p className="font-mono text-xs font-semibold text-blue-600">{s.n}</p>
                <h3 className="mt-2 text-sm font-semibold text-zinc-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{s.detail}</p>
              </li>
            ))}
          </ol>

          <Screenshot
            src="/case-bolid/responses.png"
            alt="Один из сырых ответов AI с разбором анализа"
            caption="Сырой ответ AI и структурированный анализ по нему (Run #3 · web_search · perplexity/sonar)"
          />
        </div>
      </div>
    </section>
  );
}