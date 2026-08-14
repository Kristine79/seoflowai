import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";


const proofs = [
  {
    platform: "Wellfound",
    url: "https://wellfound.com/company/itllect",
    note: "Профиль компании публично доступен",
  },
  {
    platform: "FindUsHere",
    url: "https://www.find-us-here.com/businesses/Itllect-LLC-Plantation-Florida-USA/34578398/",
    note: "Профиль создан и подтверждён",
  },
  {
    platform: "Semfirms",
    url: "https://www.semfirms.com/profile/itllect-llc",
    note: "Профиль создан и подтверждён",
  },
  {
    platform: "Bark.com",
    url: "https://www.bark.com/en/us/sellers/dashboard/",
    note: "Аккаунт продавца live",
  },
] as const;

/**
 * Полоса доказательств: реальные публичные профили кампании «77 Platforms».
 * Не логотипы-бутафория, а проверяемые ссылки с пояснением статуса.
 */
export function ProofStrip() {
  return (
    <section aria-label="Публичные профили кампании" className="border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="shrink-0 text-xs font-medium text-zinc-500">
            Публичные профили кампании{" "}
            <Link href="/case-studies/seo-agency-directory-campaign" className="text-blue-600 hover:underline">
              «77 Platforms»
            </Link>
          </p>
          <ul className="grid w-full grid-cols-2 gap-2 lg:max-w-3xl sm:grid-cols-4">
            {proofs.map((p) => (
              <li key={p.platform}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-zinc-900">{p.platform}</span>
                    <span className="block truncate text-[11px] text-zinc-400">{p.note}</span>
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-zinc-300 transition-colors group-hover:text-blue-600" />
                </a>
              </li>
            ))}
          </ul>
          <Link
            href="/case-studies/seo-agency-directory-campaign"
            className="hidden shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:underline lg:inline-flex"
          >
            Полный кейс <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
