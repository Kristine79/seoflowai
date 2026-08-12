"use client";
import { Sparkles, FileText, Rocket, CheckCircle2 } from "lucide-react";
import { COMPANY_PROFILE } from "../data/case-data";

const flow = [
  { label: "Company Profile", text: "Единый источник данных" },
  { label: "Platform requirements", text: "Требования площадки" },
  { label: "AI generation", text: "Адаптация контента" },
  { label: "Review", text: "Проверка человеком" },
  { label: "Submission", text: "Подача" },
];

export function ContentShowcase() {
  return (
    <section className="border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <span className="text-sm font-bold text-white">{COMPANY_PROFILE.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{COMPANY_PROFILE.name}</p>
                    <p className="text-xs text-zinc-500">{COMPANY_PROFILE.legalName}</p>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  100% заполнено
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Веб-сайт", COMPANY_PROFILE.website],
                  ["Email", COMPANY_PROFILE.email],
                  ["Телефон", COMPANY_PROFILE.phone],
                  ["Категория", COMPANY_PROFILE.category],
                  ["Адрес", COMPANY_PROFILE.address],
                  ["Услуги", COMPANY_PROFILE.services],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-zinc-50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
                    <p className="mt-1 truncate text-xs font-medium text-zinc-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {flow.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-center">
                    <p className="text-[10px] font-semibold text-blue-700">{step.label}</p>
                    <p className="hidden text-[9px] text-blue-500 sm:block">{step.text}</p>
                  </div>
                  {i < flow.length - 1 && i < flow.length - 2 && (
                    <span className="hidden h-px w-2 bg-blue-200 sm:block sm:w-3" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">AI Content</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Один профиль компании. Контент под разные площадки.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-zinc-600">
              Компания хранится как единый источник данных. Из него SEOFlow готовит
              platform-specific контент: описания, услуги и ключевые слова под требования
              конкретной площадки.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: FileText, title: "Описания любой длины", text: "Короткие, средние и развёрнутые версии — под формат площадки." },
                { icon: Sparkles, title: "Услуги и ключевые слова", text: "Подбираются под направление компании и тематику каталога." },
                { icon: CheckCircle2, title: "Человек проверяет", text: "AI готовит черновик, решение о публикации остаётся за вами." },
                { icon: Rocket, title: "Подача из той же системы", text: "Подготовленный контент сразу попадает в workflow кампании." },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}