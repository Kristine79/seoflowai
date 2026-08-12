/**
 * Реальные данные кампании "77 Platforms" (ITllect).
 * Источник: client-report/client-directory-report-final.md (финальный отчёт от 2026-08-11)
 * и public/SEOFlow-77-Platform-Campaign-Report.xlsx.
 * Статусы и площадки соответствуют отчёту — не выдуманы.
 */

export const CASE_SUMMARY = {
  total: 77,
  verified: 5,
  submitted: 7,
  needsHuman: 23,
  blocked: 14,
  notApplicable: 28,
} as const;

export const CASE_STATUSES = [
  { key: "verified", label: "Размещено", count: CASE_SUMMARY.verified, color: "emerald" },
  { key: "submitted", label: "Заявка отправлена", count: CASE_SUMMARY.submitted, color: "blue" },
  { key: "needsHuman", label: "Требуется действие", count: CASE_SUMMARY.needsHuman, color: "amber" },
  { key: "blocked", label: "Площадка недоступна", count: CASE_SUMMARY.blocked, color: "rose" },
  { key: "notApplicable", label: "Не подходит", count: CASE_SUMMARY.notApplicable, color: "zinc" },
] as const;

export const VERIFIED_PLATFORMS = [
  { platform: "Wellfound", url: "https://wellfound.com/company/itllect", note: "Профиль компании публично доступен" },
  { platform: "FindUsHere", url: "https://www.find-us-here.com/businesses/Itllect-LLC-Plantation-Florida-USA/34578398/", note: "Профиль создан и подтверждён" },
  { platform: "Bark.com", url: "https://www.bark.com", note: "Аккаунт продавца создан, dashboard live" },
  { platform: "Semfirms", url: "https://www.semfirms.com/profile/itllect-llc", note: "Профиль создан и подтверждён" },
  { platform: "ProvenExpert", url: "https://www.provenexpert.com", note: "Найден публичный профиль" },
] as const;

export const SUBMITTED_PLATFORMS = [
  "Brownbook",
  "CityLocalPro",
  "GoodFirms",
  "DesignRush",
  "Digital Agency Net",
  "Plantation Chamber",
  "HubSpot Agency Directory",
] as const;

export const NEEDS_HUMAN_PLATFORMS = [
  "Alignable",
  "TopSEOs",
  "Sitejabber",
  "Trustpilot",
  "Shopify Partners",
  "Semrush Agency Partners",
  "Local.com",
  "Nextdoor Business",
  "Mailchimp Partner",
  "Stripe Partner",
  "Behance",
  "Foursquare Business",
] as const;

export const BLOCKED_PLATFORMS = [
  "Yellow Pages",
  "Manta",
  "Hotfrog",
  "Superpages",
  "EZlocal",
  "Opendi",
  "Agency Spotter",
  "The Manifest",
  "Sortlist",
  "Crunchbase",
  "Stack Overflow",
  "Medium",
  "G2",
  "South FL Biz Journal",
] as const;

export const NOT_APPLICABLE_PLATFORMS = [
  "SCORE",
  "SBA.gov",
  "ProductHunt",
  "GitHub",
  "YouTube",
  "Twitter / X",
  "Quora",
  "Tumblr",
  "SlideShare",
  "Webflow Partner",
  "ActiveCampaign",
  "Data Axle",
] as const;

/** Площадки для блока case study — реальные, из финального отчёта. */
export const CASE_PLATFORMS = [
  ...VERIFIED_PLATFORMS.map((p) => ({ name: p.platform, status: "verified" as const })),
  ...SUBMITTED_PLATFORMS.map((name) => ({ name, status: "submitted" as const })),
  ...NEEDS_HUMAN_PLATFORMS.map((name) => ({ name, status: "needsHuman" as const })),
  ...BLOCKED_PLATFORMS.map((name) => ({ name, status: "blocked" as const })),
  ...NOT_APPLICABLE_PLATFORMS.map((name) => ({ name, status: "notApplicable" as const })),
];

/**
 * Распределение 77 площадок по категориям — по типам из
 * src/lib/directories/MASTER_LIST.ts (A/B/C/D/E), сходится с отчётом.
 */
export const CASE_CATEGORIES = [
  { label: "Business Directory", count: 24, color: "#3b82f6" },
  { label: "Agency Directory", count: 13, color: "#8b5cf6" },
  { label: "Reviews", count: 5, color: "#14b8a6" },
  { label: "Portfolio / Tech / Social / Content", count: 20, color: "#f59e0b" },
  { label: "Gov / Partner / Aggregator", count: 15, color: "#a1a1aa" },
] as const;

/** Публичные данные компании из кейса (полный профиль — в приложении, /company). */
export const COMPANY_PROFILE = {
  name: "ITllect",
  legalName: "ITllect Consulting Inc.",
  website: "https://itllect.com",
  email: "info@itllect.com",
  phone: "(123) 636-4087",
  address: "100 N University Dr, Coral Springs FL 33071, US",
  category: "Digital Marketing Agency",
  services: "SEO · PPC · Web Development",
} as const;
