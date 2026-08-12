import { ProductPreview } from "./product-preview";

const captions = [
  "Campaign progress",
  "Platform status",
  "SEO score",
  "AI preparation",
  "Next action",
  "Reporting",
];

export function ProductSection() {
  return (
    <section id="product" className="scroll-mt-20 border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Продукт</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Вся кампания перед глазами.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-600">
            Дашборд, кампании, каталоги, аудит и профиль компании — один рабочий контекст вместо
            десятков вкладок.
          </p>
        </div>

        <div className="mt-12">
          <ProductPreview />
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          {captions.map((c) => (
            <span
              key={c}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-500"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
