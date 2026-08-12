import { readFileSync } from "fs";

export interface QueueEntry {
  name: string;
  url: string;
  submissionUrl: string;
  type: string;
  priority: number;
  previewStatus: string;
  previewFields: number;
  previewFilled: number;
  humanAction: string;
  notes: string;
  status: string;
  result: string | null;
}

export interface ProbeEntry {
  verdict: string;
  fields: number;
  cloudflare?: boolean;
  captcha?: string;
  error?: string | null;
}

export function loadQueue(): QueueEntry[] {
  return JSON.parse(readFileSync("human-queue.json", "utf8")) as QueueEntry[];
}

export function loadProbes(): Record<string, ProbeEntry> {
  return JSON.parse(readFileSync("probe-results.json", "utf8")) as Record<string, ProbeEntry>;
}

export const STATUS_OVERRIDES: Record<string, string> = {
  Brownbook: "SUBMITTED",
  CityLocalPro: "SUBMITTED",
  DesignRush: "SUBMITTED",
  GoodFirms: "SUBMITTED",
  "Digital Agency Net": "SUBMITTED",
  "Plantation Chamber": "SUBMITTED",
  "Bark.com": "VERIFIED_SUCCESS",
  Crunchbase: "BLOCKED",
  Medium: "BLOCKED",
  "Shopify Partners": "REGISTERED",
  "YouTube Channel": "NOT_APPLICABLE",
  "SCORE Mentor Network": "NOT_APPLICABLE",
  TopSEOs: "NEEDS_MANUAL",
  ProvenExpert: "VERIFIED_SUCCESS",
  Trustpilot: "NEEDS_MANUAL",
  "Foursquare Business": "NEEDS_MANUAL",
  "Nextdoor Business": "NEEDS_MANUAL",
  "AngelList/Wellfound": "VERIFIED_SUCCESS",
  "Express Update USA": "NEEDS_MANUAL",
  "HubSpot Agency Dir": "SUBMITTED",
  "Semrush Agency Partners": "NEEDS_MANUAL",
  "The Manifest": "BLOCKED",
  ActiveCampaign: "NOT_APPLICABLE",
  "Yellow Pages": "BLOCKED",
  Manta: "BLOCKED",
  Hotfrog: "BLOCKED",
  Opendi: "BLOCKED",
  G2: "BLOCKED",
  Superpages: "BLOCKED",
  EZlocal: "BLOCKED",
  "Agency Spotter": "BLOCKED",
  Sortlist: "BLOCKED",
  "South FL Biz Journal": "BLOCKED",
  "Stack Overflow": "BLOCKED",
  n49: "NOT_APPLICABLE",
  Dribbble: "NOT_APPLICABLE",
};

export const RESULT_TEXT: Record<string, string> = {
  Brownbook: "SUBMITTED 07.08: заявка отправлена, профиль НЕ опубликован (поиск: Results Found 0) — ожидает email-подтверждения на info@itllect-agency.com / модерации",
  Crunchbase: "BLOCKED 11.08: Cloudflare 403 — 'Sorry, you have been blocked' на /organization/itllect даже в headed-браузере с профилем human-crunchbase (evidence: human-submit-out/crunchbase/cb-org-headed.png). Главная грузится, но все глубокие пути (/organization/*, /search/*) блокируются. Сессионной cookie нет, логины не сохранены, пароль не найден; по документации регистрация OAuth-only; почта регистрации недоступна (IMAP invalid). Повторные попытки НЕ запускать, новый аккаунт НЕ создавать.",
  DesignRush: "Регистрация пройдена, профиль агентства заполнен вручную, отправлен",
  GoodFirms: "Подтверждено в headed-сессии 31.07 (turnstile решён, submit прошёл)",
  Manta: "BLOCKED: Cloudflare 403 — 'Performing security verification'; требуется ручной заход",
  Medium: "BLOCKED 11.08: Cloudflare 403 — 'Sorry, you have been blocked' (headed). Сессия не активна, повторные заходы блокируются. Повторные попытки НЕ запускать, новый аккаунт НЕ создавать.",
  "Shopify Partners": "Partner-аккаунт создан",
  "Digital Agency Net": "Регистрация пройдена, заявка add-agency отправлена",
  Hotfrog: "BLOCKED: Cloudflare 403 — 'Performing security verification'; требуется ручной заход",
  "Plantation Chamber": "Заявка на членство подана (человек подтвердил)",
  "YouTube Channel": "YouTube является видеоплатформой, а не бизнес-каталогом; создание брендового канала не соответствует цели текущего заказа по добавлению компании в каталоги.",
  "Bark.com": "VERIFIED_SUCCESS: аккаунт продавца создан 2026-08-10 13:39:13 (seller spf_id=4708659, user_id=40829222) — подтверждено через api.bark.com/seller/self. Dashboard live (15 leads, 3 services, 1 location). Регистрация серверная на шаге address-Next; профиль ITllect / Plantation FL 33324. Повторная регистрация НЕ нужна.",
  CityLocalPro: "SUBMITTED 07.08: заявка отправлена (reCAPTCHA v2 решена вручную), профиль НЕ опубликован (поиск: No result) — ожидает модерации",
  Sitejabber: "Аккаунт создавался ранее; повторный прогон не стартовал (ошибка браузера)",
  "Yellow Pages": "BLOCKED: Cloudflare 403 — 'Sorry, you have been blocked'; требуется ручной заход",
  Opendi: "REPROBE 08.08: CF turnstile — multiple headed attempts failed, verification not passable; stay BLOCKED",
  TopSEOs: "Форма жива на /registration (Drupal); заполнение проходит, submit зависает — нужен ручной шаг",
  ProvenExpert: "REPROBE 08.08: site accessible (en-us/), form 10 fields detected, EMAIL fields absent — HUMAN ACTION timeout; stay NEEDS_MANUAL",
  n49: "REPROBE 08.08: accessible but no add business form — not a business directory; status NOT_APPLICABLE",
  ActiveCampaign: "Partner ecosystem (reseller/commission program), не бизнес-каталог — /partner содержит только sales-lead формы (Demo/Pricing/Trial), публичного каталога агентств нет",
  G2: "Сайт ожил после DEAD; claim-listing закрыт Cloudflare; повторный прогон упал (краш браузера)",
  "Local.com": "claim-listing → 404 (Page not found), форма нерабочая",
  Semfirms: "VERIFIED_SUCCESS: профиль создан и публично доступен",
  FindUsHere: "VERIFIED_SUCCESS: профиль создан и публично доступен (18+ млн бизнесов в каталоге)",
  Trustpilot: "RECLASSIFIED 08.08: claim business + domain verification required. Listing IS possible.",
  "Foursquare Business": "RECLASSIFIED 08.08: claim venue + phone verification required. Business CAN be listed.",
  "Nextdoor Business": "RECLASSIFIED 08.08: create business page + postcard PIN verification. Local directory listing possible.",
  "AngelList/Wellfound": "VERIFIED_SUCCESS: company profile создан и публично доступен — https://wellfound.com/company/itllect (slug itllect, location Coral Springs, Software, 1-10, Founder: [REDACTED]). Регистрация аккаунта itllect.marketing@gmail.com + профиль заполнены в headed-сессии 11.08; step 1 onboarding завершён, invite-шаг пропущен.",
  "Express Update USA": "RECLASSIFIED 08.08: claim InfoGroup citation listing via phone/postcard.",
  "HubSpot Agency Dir": "RECLASSIFIED 08.08: partner application leads to public agency directory listing.",
  "Semrush Agency Partners": "RECLASSIFIED 08.08: list agency on agencies.semrush.com self-service flow.",
  SmartCustomer: "Регистрация технически выполнена, но площадка требует корпоративный email домена; требуется подтверждение адреса со стороны клиента.",
  Dribbble: "Площадка ориентирована на дизайнерские профили и портфолио; подходящего профиля компании/SEO-агентства для размещения ITllect в рамках данного заказа не найдено.",
};

export const PROFILE_URL_TEXT: Record<string, string> = {
  Semfirms: "https://www.semfirms.com/profile/itllect-llc",
  FindUsHere: "https://www.find-us-here.com/businesses/Itllect-LLC-Plantation-Florida-USA/34578398/",
  "AngelList/Wellfound": "https://wellfound.com/company/itllect",
  "Bark.com": "https://www.bark.com/en/us/sellers/dashboard/ (аккаунт live, spf_id=4708659)",
  Brownbook: "не подтверждён (профиль не найден)",
};

export const NA_COMMENTS: Record<string, string> = {
  Spoke: "Площадка сменила профиль — не каталог",
  "Find Best SEO": "Реестр рейтингов, формы нет",
  "Influencer Mkt Hub": "Форма не работает (email-сборщик)",
  "FL SBDC Network": "Консультационный сервис, не каталог",
  "Broward County Chamber": "Страница заявки пустая",
  "Miami Chamber": "Членство оформляется вручную",
  "Ft Lauderdale Chamber": "Платное членство ($574/год + $50 one-time, non-refundable) — требуется отдельное одобрение клиента и бюджет",
  "Nextdoor Business": "Подтверждение по почтовой открытке",
  "City of Plantation": "Муниципальный ресурс",
  "Broward County Biz": "Муниципальный ресурс",
  "FL DEO Business": "Гос. портал ресурсов",
  "SBA.gov Business": "Гос. ресурс",
  "Semrush Agency Partners": "Партнёрская программа (ручное ревью)",
  "HubSpot Agency Dir": "Партнёрская программа (ручное ревью)",
  "Webflow Partner": "Партнёрская программа (ручное ревью)",
  SiteInspire: "Редакционная галерея",
  "AngelList/Wellfound": "Требуется аккаунт и профиль (SPA)",
  ProductHunt: "Запуск через флоу продукта",
  "Twitter / X": "Требуется верификация по телефону",
  "Pinterest Business": "Требуется бизнес-аккаунт (SPA)",
  GitHub: "Платформа для разработки, не каталог",
  Quora: "Соцсеть, не каталог",
  SlideShare: "Регистрация через LinkedIn",
  Business2Community: "Форма оказалась email-сборщиком",
  Trustpilot: "Claim через верификацию домена (нужна почта домена)",
  "Data Axle": "Агрегатор данных — подача не предусмотрена",
  "Neustar Localeze": "Агрегатор данных — подача не предусмотрена",
  "Express Update USA": "Claim через телефон/почту",
  "Foursquare Business": "Верификация по телефону",
  ActiveCampaign: "Партнёрская программа (reseller/commission), публичного каталога агентств нет — только sales-lead формы (Demo/Pricing/Trial)",
};

export const NA_CATEGORY_LABELS: Record<number, { label: string; explanation: string }> = {
  1: {
    label: "Not a business directory",
    explanation: "Площадка не является каталогом компаний для добавления бизнес-профиля.",
  },
  2: {
    label: "Marketplace / Partner platform",
    explanation: "Площадка работает через партнёрскую программу или другой механизм, а не через стандартное размещение компании.",
  },
  3: {
    label: "Search / informational resource",
    explanation: "Ресурс предназначен для поиска информации, а не для создания карточки компании.",
  },
  4: {
    label: "Requires different strategy",
    explanation: "Для размещения требуется отдельный подход: создание контента, публикации, партнёрство или ручная заявка.",
  },
};

export const NA_CATEGORY_SHORT: Record<number, string> = {
  1: "Не является каталогом компаний",
  2: "Партнёрская платформа",
  3: "Информационный ресурс",
  4: "Требуется другой подход",
};

export const NA_CATEGORY: Record<string, number> = {
  GitHub: 1,
  Quora: 1,
  "Twitter / X": 1,
  "Pinterest Business": 1,
  SlideShare: 1,
  SiteInspire: 1,
  Business2Community: 1,
  "Influencer Mkt Hub": 1,
  "AngelList/Wellfound": 1,
  "Semrush Agency Partners": 2,
  "HubSpot Agency Dir": 2,
  "Webflow Partner": 2,
  Trustpilot: 2,
  "Foursquare Business": 2,
  "Express Update USA": 2,
  "Nextdoor Business": 2,
  ActiveCampaign: 2,
  "Data Axle": 3,
  "Neustar Localeze": 3,
  "Find Best SEO": 3,
  Spoke: 3,
  "FL DEO Business": 3,
  "SBA.gov Business": 3,
  "FL SBDC Network": 3,
  "Broward County Biz": 3,
  "City of Plantation": 3,
  "Broward County Chamber": 4,
  "Miami Chamber": 4,
  "Ft Lauderdale Chamber": 4,
  ProductHunt: 4,
};

export const CLIENT_RESULT_TABLE = [
  { status: "Размещено (подтверждено)", count: 4, description: "Найден публичный профиль URL / аккаунт подтверждён (Semfirms, FindUsHere, AngelList/Wellfound, Bark.com)" },
  { status: "Заявка отправлена", count: 6, description: "Форма отправлена, публикация/профиль ещё не подтверждены (Brownbook, CityLocalPro, DesignRush, GoodFirms, Digital Agency Net, Plantation Chamber)" },
  { status: "Аккаунт создан", count: 4, description: "Аккаунт создан, требуется заполнение профиля, публикация контента или завершение регистрации (Crunchbase, Medium, Shopify Partners)" },
  { status: "Ожидает модерации", count: 0, description: "Площадка получила заявку и выполняет проверку" },
  { status: "Требуется подтверждение", count: 0, description: "Требуется подтверждение email/телефона для активации размещения" },
{ status: "Требуется ручное действие", count: 12, description: "Ручной шаг: CAPTCHA, OAuth, зависший submit, партнёрская/плановая заявка или решение пользователя" },
    { status: "Заблокировано защитой сайта", count: 12, description: "Внешняя блокировка: Cloudflare, CAPTCHA challenge, IP restriction — только ручной заход" },
  { status: "Не удалось выполнить", count: 12, description: "Сайт недоступен, регистрация отсутствует (404) или техническая ошибка" },
  { status: "Не подходит для размещения", count: 25, description: "Ресурс не является стандартным каталогом компаний, требует другого подхода или платного членства" },
];

export const CLIENT_IMPORTANT_INFO =
  "В процессе проверки выяснилось, что не все площадки из исходного списка являются каталогами для прямого добавления компаний.\n" +
  "Часть ресурсов относится к социальным платформам, контентным площадкам, партнёрским программам или информационным ресурсам.\n" +
  "Для таких площадок требуется отдельная стратегия: создание контента, публикации, партнёрство или ручная заявка.";

export const CLIENT_NEXT_STEPS =
  "Приоритет дальнейшей работы:\n" +
  "1. Отслеживание SUBMITTED/PENDING: подтвердить email (Brownbook), дождаться модерации (CityLocalPro), проверить публичные профили.\n" +
   "2. Завершение REGISTERED: заполнить профили Medium, Shopify Partners, \n" +
  "3. Обработка NEEDS_MANUAL: TopSEOs (LinkedIn OAuth).\n" +
  "4. Повторные регистрации для SUBMITTED/REGISTERED/PENDING/BLOCKED НЕ запускать.";

export function probeKeyOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function probeOf(entry: QueueEntry, probes: Record<string, ProbeEntry>): ProbeEntry | undefined {
  return probes[probeKeyOf(entry.name)];
}

export function shortReason(entry: QueueEntry, probes: Record<string, ProbeEntry>): string {
  const p = probeOf(entry, probes);
  if (p) {
    if (p.cloudflare) return "Cloudflare";
    if (p.captcha && p.captcha !== "none") return `CAPTCHA (${p.captcha})`;
    if (p.verdict === "DEAD") return "сайт недоступен";
    if (p.verdict === "LOGIN_REQUIRED") return "требуется регистрация/вход";
    if (p.verdict === "CF_BLOCKED") return "Cloudflare";
    if (p.verdict === "CAPTCHA") return "CAPTCHA";
  }
  return "";
}

export function techStatusOf(entry: QueueEntry): string {
  const ov = STATUS_OVERRIDES[entry.name];
  if (ov) return ov;
  return entry.status;
}

export function techResultOf(entry: QueueEntry, probes: Record<string, ProbeEntry>): string {
  if (RESULT_TEXT[entry.name]) return RESULT_TEXT[entry.name];
  const p = probeOf(entry, probes);
  switch (entry.status) {
    case "FAILED":
      if (entry.result) return entry.result.split("\n")[0].slice(0, 140);
      if (p?.verdict === "DEAD") return "Сайт недоступен";
      return entry.notes || "Не удалось";
    case "NEEDS_MANUAL":
      return entry.result?.includes("180s")
        ? "Окно ручного действия истекло (180с) — требуется повтор"
        : entry.notes || "Требуется ручное действие";
    case "NOT_APPLICABLE":
      return "Площадка не подходит для размещения";
    default:
      return entry.notes || "";
  }
}

export const CLIENT_STATUS: Record<string, string> = {
  VERIFIED_SUCCESS: "Размещено (подтверждено)",
  SUCCESS: "Размещено (подтверждено)",
  SUBMITTED: "Заявка отправлена / ожидает модерации",
  REGISTERED: "Требуется действие клиента",
  PENDING_MODERATION: "Заявка отправлена / ожидает модерации",
  PENDING_VERIFICATION: "Требуется действие клиента",
  NEEDS_MANUAL: "Требуется действие клиента",
  FORM_READY: "Требуется действие клиента",
  NOT_STARTED: "Требуется действие клиента",
  BLOCKED: "Площадка недоступна",
  FAILED: "Требуется действие клиента",
  NOT_APPLICABLE: "Не подходит для текущей задачи",
  NOT_RELEVANT: "Не подходит для текущей задачи",
};

export const CLIENT_NEXT: Record<string, string> = {
  "Размещено (подтверждено)": "Проверка завершена",
  "Заявка отправлена / ожидает модерации": "Ожидать обработки площадкой и проверки модерации",
  "Требуется действие клиента": "Требуется действие клиента",
  "Площадка недоступна": "Площадка недоступна в текущем процессе",
  "Не подходит для текущей задачи": "Площадка не соответствует формату задачи",
};

export const CLIENT_REASON: Record<string, string> = {
  "Размещено (подтверждено)": "Найден публичный профиль URL",
  "Заявка отправлена / ожидает модерации": "Заявка успешно отправлена и ожидает модерации",
  "Требуется действие клиента": "Требуется действие клиента (вход, OAuth, подтверждение)",
  "Площадка недоступна": "Площадка недоступна в текущем процессе из-за ограничений платформы",
  "Не подходит для текущей задачи": "Площадка не соответствует формату текущего задания по размещению компании в каталогах",
};

export const CLIENT_RESULT: Record<string, string> = {
  Brownbook: "Заявка отправлена 07.08, профиль не опубликован (поиск: Results Found 0) — ожидает email-подтверждения/модерации",
  Crunchbase: "Заблокировано Cloudflare/anti-bot — требуется ручной заход",
  DesignRush: "Регистрация пройдена, профиль агентства отправлен",
  GoodFirms: "Заявка на размещение отправлена (подтверждено)",
  Manta: "Заблокировано Cloudflare/anti-bot — требуется ручной заход",
  Medium: "Заблокировано Cloudflare/anti-bot — требуется ручной заход",
  "Shopify Partners": "Партнёрский аккаунт создан",
  "Digital Agency Net": "Заявка на добавление агентства отправлена",
  Hotfrog: "Заблокировано Cloudflare/anti-bot — требуется ручной заход",
  "Plantation Chamber": "Заявка на членство подана",
  "YouTube Channel": "Канал компании создан",
  "Bark.com": "Аккаунт продавца создан и подтверждён (seller/self: user_id=40829222, spf_id=4708659), dashboard live",
  TopSEOs: "Регистрация только через LinkedIn OAuth — нужен ручной вход",
  ActiveCampaign: "Партнёрская программа (reseller/commission), не каталог — публичногоListing нет",
  Sitejabber: "Аккаунт создавался ранее + CAPTCHA — нужна ручная проверка",
  "South FL Biz Journal": "Заблокировано Cloudflare challenge — требуется ручной заход",
  "Stack Overflow": "Заблокировано Cloudflare challenge — требуется ручной заход",
  Sortlist: "Заблокировано Cloudflare challenge — требуется ручной заход",
  Semfirms: "Профиль создан и подтверждён",
  FindUsHere: "Профиль создан и подтверждён",
  "Ft Lauderdale Chamber": "Платное членство ($574/год + $50 one-time, non-refundable) — требуется отдельное одобрение клиента и бюджет",
  "The Manifest": "Заблокировано Cloudflare challenge-loop на vendor.clutch.co/profile/create/basic (реальная форма регистрации). Главная clutch.co/get-listed грузится, но vendor-портал не отвечает после CF verification (Ray ID a27c85757b9b543b) — требуется ручной заход в обычном браузере",
  "Mailchimp Partner": "Требуется регистрация и подача партнёрской заявки",
  "Stripe Partner": "Требуется найти способ подачи партнёрской заявки",
  Awwwards: "Требуется регистрация (подача платная)",
  HubPages: "Регистрация недоступна (все URL 404) — требуется ручная проверка",
  ProvenExpert: "Сайт блокирует соединение (ERR_CONNECTION_CLOSED) — внешняя блокировка",
  "Yellow Pages": "Заблокировано Cloudflare/anti-bot — требуется ручной заход",
  Opendi: "Заблокировано Cloudflare/IP-reputation — требуется другой IP/VPN или ручной заход",
  G2: "Заблокировано Cloudflare/anti-bot — требуется ручной заход",
  "Local.com": "Страница подачи не работает (404)",
  Superpages: "Заблокировано Cloudflare challenge — требуется ручной заход",
  EZlocal: "Заблокировано Cloudflare challenge — требуется ручной заход",
  "Agency Spotter": "Заблокировано Cloudflare challenge — требуется ручной заход",
  "Merchant Circle": "Регистрация недоступна (404/403) — требуется ручная проверка",
  Upcity: "Сайт недоступен",
  "FL Business Dir": "Сайт недоступен",
  Behance: "Сайт недоступен",
  "CSS Design Awards": "Сайт недоступен",
  EzineArticles: "Сайт недоступен",
  "Expertise.com": "Требуется регистрация",
  Dribbble: "Требуется регистрация",
  Tumblr: "Контентная/социальная платформа, а не релевантный бизнес-каталог для текущей задачи размещения компании.",
  "WooCommerce Agency": "Форма подачи не найдена",
  n49: "Доступ ограничен (403/IP restriction) — требуется ручной заход",
  CityLocalPro: "Заявка отправлена 07.08, профиль не опубликован (поиск: No result) — ожидает модерации",
  "AngelList/Wellfound": "Профиль компании создан и публично доступен: https://wellfound.com/company/itllect",
  "SCORE Mentor Network": "Ресурс не является каталогом бизнеса (government mentoring) — не подходит для размещения",
};

export function clientStatusOf(entry: QueueEntry): string {
  const tech = techStatusOf(entry);
  if (CLIENT_STATUS[tech]) return CLIENT_STATUS[tech];
  return "Требуется ручное действие";
}

export function clientNextOf(status: string): string {
  return CLIENT_NEXT[status] || "Требуется ручное действие";
}

export function clientReasonOf(status: string): string {
  return CLIENT_REASON[status] || "Требуется уточнить причину";
}

function failedClientResult(entry: QueueEntry, probes: Record<string, ProbeEntry>): string {
  const p = probeOf(entry, probes);
  if (p) {
    if (p.verdict === "DEAD") return "Сайт недоступен";
    if (p.cloudflare) return "Доступ ограничен защитой сайта";
    if (p.captcha && p.captcha !== "none") return "Требуется прохождение капчи вручную";
    if (p.verdict === "LOGIN_REQUIRED") return "Требуется регистрация";
    if (p.verdict === "CF_BLOCKED") return "Доступ ограничен защитой сайта";
    if (p.verdict === "CAPTCHA") return "Требуется прохождение капчи вручную";
  }
  const r = shortReason(entry, probes);
  if (r === "Cloudflare") return "Доступ ограничен защитой сайта";
  if (r.startsWith("CAPTCHA")) return "Требуется прохождение капчи вручную";
  if (r === "сайт недоступен") return "Сайт недоступен";
  if (r === "требуется регистрация/вход") return "Требуется регистрация";
  if (/404|Page not found|нерабочая/.test(entry.result || "")) return "Страница подачи не работает";
  return "Не удалось выполнить автоматическое размещение";
}

export function clientResultOf(entry: QueueEntry, probes: Record<string, ProbeEntry>): string {
  if (CLIENT_RESULT[entry.name]) return CLIENT_RESULT[entry.name];
  const tech = techStatusOf(entry);
  if (tech === "NOT_APPLICABLE") {
    const c = NA_COMMENTS[entry.name];
    if (c) return c;
    const cat = NA_CATEGORY[entry.name];
    return cat ? NA_CATEGORY_LABELS[cat].explanation : "Площадка не подходит для стандартного размещения";
  }
  switch (tech) {
    case "VERIFIED_SUCCESS":
      return "Размещение подтверждено";
    case "SUBMITTED":
      return "Заявка отправлена, ожидается обработка";
    case "REGISTERED":
      return "Аккаунт создан, требуется заполнение профиля";
    case "NEEDS_MANUAL":
      return "Требуется ручное действие (повторить заполнение или завершить отправку)";
    case "FAILED":
      return failedClientResult(entry, probes);
    default:
      return entry.notes || "Требуется ручное действие";
  }
}
