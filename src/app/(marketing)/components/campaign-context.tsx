"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SectionLabel } from "./section-label";
import { Reveal } from "./reveal";
import { CampaignShowcase } from "./campaign-showcase";
import { AuditShowcase } from "./audit-showcase";
import { ContentShowcase } from "./content-showcase";

const tabs = [
  { id: "campaign", label: "Кампания" },
  { id: "audit", label: "SEO Аудит" },
  { id: "content", label: "AI Контент" },
] as const;

type TabId = (typeof tabs)[number]["id"];

/**
 * Единая секция «Кампания как единый контекст» (объединение бывших
 * CampaignShowcase / AuditShowcase / ContentShowcase в одну с табами).
 */
export function CampaignContext() {
  const [active, setActive] = useState<TabId>("campaign");

  return (
    <section className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel className="justify-center">Как это работает</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Кампания: от импорта до отчёта.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            Один рабочий контекст: аудит платформ, подготовка контента и подача собираются
            в кампании — со статусом и следующим действием по каждой площадке.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1" role="tablist" aria-label="Разделы продукта">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active === tab.id}
                onClick={() => setActive(tab.id)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  active === tab.id
                    ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                    : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div key={active} className="mt-12 animate-fade-in">
          <Reveal>
            {active === "campaign" && <CampaignShowcase embedded />}
            {active === "audit" && <AuditShowcase embedded />}
            {active === "content" && <ContentShowcase embedded />}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
