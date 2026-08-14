"use client";
import {
  Sparkles,
  FileText,
  Rocket,
  CheckCircle2,
  Building2,
  ClipboardList,
  Wand2,
  UserCheck,
  Send,
  ArrowDown,
} from "lucide-react";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";
import { COMPANY_PROFILE } from "../data/case-data";

const flow = [
  { icon: Building2, label: "Company Profile", text: "Единый источник данных" },
  { icon: ClipboardList, label: "Platform requirements", text: "Требования площадки" },
  { icon: Wand2, label: "AI generation", text: "Адаптация контента" },
  { icon: UserCheck, label: "Human review", text: "Проверка человеком" },
  { icon: Send, label: "Submission", text: "Подача" },
];

export function ContentShowcase({ embedded = false }: { embedded?: boolean }) {
  const content = (
    <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-16">
      {/* Левая часть: профиль + продуктовый flow */}
          <div className="order-2 lg:order-1">
            <Reveal>
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
                      <span className="text-sm font-bold text-white">{COMPANY_PROFILE.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{COMPANY_PROFILE.name}</p>
                      <p className="text-xs text-zinc-500">{COMPANY_PROFILE.legalName}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    100% заполнено
                  </span>
                </div>
                <div className="grid gap-px bg-zinc-100 sm:grid-cols-2">
                  {[
                    ["Веб-сайт", COMPANY_PROFILE.website],
                    ["Email", COMPANY_PROFILE.email],
                    ["Телефон", COMPANY_PROFILE.phone],
                    ["Категория", COMPANY_PROFILE.category],
                    ["Адрес", COMPANY_PROFILE.address],
                    ["Услуги", COMPANY_PROFILE.services],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white px-6 py-3.5">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-zinc-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* продуктовый flow: один источник → подача */}
            <Reveal delay={120}>
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
                  Один источник данных → подача
                </p>
                <ol className="mt-5">
                  {flow.map((step, i) => (
                    <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < flow.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute left-[19px] top-10 flex h-[calc(100%-2.5rem)] flex-col items-center"
                        >
                          <span className="h-full w-px bg-blue-200" />
                        </span>
                      )}
                      <div
                        className={
                          i === 0
                            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm"
                            : i === flow.length - 1
                            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
                            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-blue-600 shadow-sm"
                        }
                      >
                        <step.icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold text-zinc-300">
                            0{i + 1}
                          </span>
                          <p className="text-sm font-semibold text-zinc-900">{step.label}</p>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-5 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
                  <span className="text-xs text-zinc-600">
                    Изменения в профиле <span className="font-medium text-zinc-900">синхронизируются</span> со всей кампанией
                  </span>
                  <ArrowDown className="h-3.5 w-3.5 rotate-180 text-blue-500" />
                </div>
              </div>
            </Reveal>
          </div>

          {/* Правая часть: описание */}
          <div className="order-1 lg:order-2">
            {!embedded && <SectionLabel>AI Content</SectionLabel>}
            {!embedded && (
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                Один профиль компании. Контент под разные площадки.
              </h2>
            )}
            {!embedded && (
              <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-600">
                Компания хранится как единый источник данных. Из него SEOFlow готовит
                platform-specific контент: описания, услуги и ключевые слова под требования
                конкретной площадки.
              </p>
            )}
            <ul className="mt-8 space-y-5">
              {[
                { icon: FileText, title: "Описания любой длины", text: "Короткие, средние и развёрнутые версии — под формат площадки." },
                { icon: Sparkles, title: "Услуги и ключевые слова", text: "Подбираются под направление компании и тематику каталога." },
                { icon: CheckCircle2, title: "Человек проверяет", text: "AI готовит черновик, решение о публикации остаётся за вами." },
                { icon: Rocket, title: "Подача из той же системы", text: "Подготовленный контент сразу попадает в workflow кампании." },
              ].map((item) => (
                <li key={item.title} className="flex gap-3.5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-blue-600 shadow-sm">
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
  );

  if (embedded) return content;

  return (
    <section className="border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">{content}</div>
    </section>
  );
}
