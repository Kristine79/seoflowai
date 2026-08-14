"use client";
import { ProductPreview } from "./product-preview";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

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
          <SectionLabel className="justify-center">Продукт</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Вся кампания перед глазами.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            Дашборд, кампании, каталоги, аудит и профиль компании — один рабочий контекст вместо
            десятков вкладок.
          </p>
        </div>

        <Reveal className="mt-12">
          <ProductPreview />
        </Reveal>

        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {captions.map((c) => (
            <span key={c} className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-1 w-1 rounded-full bg-blue-500" />
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
