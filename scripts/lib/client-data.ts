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
  Crunchbase: "REGISTERED",
  Medium: "REGISTERED",
  "Shopify Partners": "REGISTERED",
  "YouTube Channel": "REGISTERED",
  "SCORE Mentor Network": "NOT_APPLICABLE",
  TopSEOs: "NEEDS_MANUAL",
  ProvenExpert: "NEEDS_MANUAL",
  Trustpilot: "NEEDS_MANUAL",
  "Foursquare Business": "NEEDS_MANUAL",
  "Nextdoor Business": "NEEDS_MANUAL",
  "AngelList/Wellfound": "NEEDS_MANUAL",
  "Express Update USA": "NEEDS_MANUAL",
  "HubSpot Agency Dir": "NEEDS_MANUAL",
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
};

export const RESULT_TEXT: Record<string, string> = {
  Brownbook: "SUBMITTED 07.08: заявка отправлена, профиль НЕ опубликован (поиск: Results Found 0) — ожидает email-подтверждения на info@itllect-agency.com / модерации",
  Crunchbase: "Аккаунт создан в headed-сессии; CF обойдён вручную",
  DesignRush: "Регистрация пройдена, профиль агентства заполнен вручную, отправлен",
  GoodFirms: "Подтверждено в headed-сессии 31.07 (turnstile решён, submit прошёл)",
  Manta: "BLOCKED: Cloudflare 403 — 'Performing security verification'; требуется ручной заход",
  Medium: "Аккаунт создан, email подтверждён, draft о компании готов",
  "Shopify Partners": "Partner-аккаунт создан",
  "Digital Agency Net": "Регистрация пройдена, заявка add-agency отправлена",
  Hotfrog: "BLOCKED: Cloudflare 403 — 'Performing security verification'; требуется ручной заход",
  "Plantation Chamber": "Заявка на членство подана (человек подтвердил)",
  "YouTube Channel": "Brand channel создан (человек подтвердил)",
  "Bark.com": "SPA-форма 35f открывается; заполнение медленное, зависает — нужен ручной шаг",
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
  "AngelList/Wellfound": "RECLASSIFIED 08.08: create startup/company profile. Startup directory listing possible.",
  "Express Update USA": "RECLASSIFIED 08.08: claim InfoGroup citation listing via phone/postcard.",
  "HubSpot Agency Dir": "RECLASSIFIED 08.08: partner application leads to public agency directory listing.",
  "Semrush Agency Partners": "RECLASSIFIED 08.08: list agency on agencies.semrush.com self-service flow.",
};

export const PROFILE_URL_TEXT: Record<string, string> = {
  Semfirms: "https://www.semfirms.com/profile/itllect-llc",
  FindUsHere: "https://www.find-us-here.com/businesses/Itllect-LLC-Plantation-Florida-USA/34578398/",
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
  { status: "Размещено (подтверждено)", count: 2, description: "Найден публичный профиль URL и размещение подтверждено (Semfirms, FindUsHere)" },
  { status: "Заявка отправлена", count: 6, description: "Форма отправлена, публикация/профиль ещё не подтверждены (Brownbook, CityLocalPro, DesignRush, GoodFirms, Digital Agency Net, Plantation Chamber)" },
  { status: "Аккаунт создан", count: 4, description: "Аккаунт создан, требуется заполнение профиля, публикация контента или завершение регистрации (Crunchbase, Medium, Shopify Partners, YouTube Channel)" },
  { status: "Ожидает модерации", count: 0, description: "Площадка получила заявку и выполняет проверку" },
  { status: "Требуется подтверждение", count: 0, description: "Требуется подтверждение email/телефона для активации размещения" },
{ status: "Требуется ручное действие", count: 7, description: "Ручной шаг: CAPTCHA, OAuth, зависший submit, партнёрская/плановая заявка или решение пользователя" },
    { status: "Заблокировано защитой сайта", count: 14, description: "Внешняя блокировка: Cloudflare, CAPTCHA challenge, IP restriction — только ручной заход" },
  { status: "Не удалось выполнить", count: 12, description: "Сайт недоступен, регистрация отсутствует (404) или техническая ошибка" },
  { status: "Не подходит для размещения", count: 31, description: "Ресурс не является стандартным каталогом компаний, требует другого подхода или платного членства" },
];

export const CLIENT_IMPORTANT_INFO =
  "В процессе проверки выяснилось, что не все площадки из исходного списка являются каталогами для прямого добавления компаний.\n" +
  "Часть ресурсов относится к социальным платформам, контентным площадкам, партнёрским программам или информационным ресурсам.\n" +
  "Для таких площадок требуется отдельная стратегия: создание контента, публикации, партнёрство или ручная заявка.";

export const CLIENT_NEXT_STEPS =
  "Приоритет дальнейшей работы:\n" +
  "1. Отслеживание SUBMITTED/PENDING: подтвердить email (Brownbook), дождаться модерации (CityLocalPro), проверить публичные профили.\n" +
  "2. Завершение REGISTERED: заполнить профили Crunchbase, Medium, Shopify Partners, YouTube Channel.\n" +
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
  SUBMITTED: "Заявка отправлена",
  REGISTERED: "Аккаунт создан",
  PENDING_MODERATION: "Ожидает модерации",
  PENDING_VERIFICATION: "Требуется подтверждение",
  NEEDS_MANUAL: "Требуется ручное действие",
  FORM_READY: "Форма найдена, ожидает отправки",
  NOT_STARTED: "Не обработано",
  BLOCKED: "Заблокировано защитой сайта",
  FAILED: "Не удалось выполнить",
  NOT_APPLICABLE: "Не подходит для размещения",
};

export const CLIENT_NEXT: Record<string, string> = {
  "Размещено (подтверждено)": "Проверка завершена",
  "Заявка отправлена": "Ожидать обработки площадкой и проверить публичный профиль",
  "Аккаунт создан": "Заполнить профиль компании / завершить публикацию",
  "Ожидает модерации": "Дождаться проверки площадкой и проверить публичный профиль",
  "Требуется подтверждение": "Подтвердить email/телефон для активации размещения",
  "Требуется ручное действие": "Требуется ручное действие",
  "Форма найдена, ожидает отправки": "Заполнить и отправить форму",
  "Не обработано": "Запустить обработку площадки",
  "Заблокировано защитой сайта": "Ручной заход через обычный браузер / другой IP",
  "Не удалось выполнить": "Проверить альтернативный способ размещения",
  "Не подходит для размещения": "Не является стандартным каталогом компаний",
};

export const CLIENT_REASON: Record<string, string> = {
  "Размещено (подтверждено)": "Найден публичный профиль URL",
  "Заявка отправлена": "Форма размещения заполнена и отправлена, профиль ещё не подтверждён",
  "Аккаунт создан": "Создан аккаунт, профиль ещё не опубликован",
  "Ожидает модерации": "Площадка получила заявку и выполняет проверку",
  "Требуется подтверждение": "Требуется подтверждение email/телефона",
  "Требуется ручное действие": "CAPTCHA, OAuth, зависший submit, партнёрская/плановая заявка или решение пользователя",
  "Форма найдена, ожидает отправки": "Форма обнаружена, заполнение/отправка не выполнены",
  "Не обработано": "Площадка ещё не обработана",
  "Заблокировано защитой сайта": "Внешняя блокировка: Cloudflare / CAPTCHA / IP restriction",
  "Не удалось выполнить": "Сайт недоступен / техническая ошибка",
  "Не подходит для размещения": "Социальная сеть / контентная платформа / партнёрский ресурс, не является каталогом компаний",
};

export const CLIENT_RESULT: Record<string, string> = {
  Brownbook: "Заявка отправлена 07.08, профиль не опубликован (поиск: Results Found 0) — ожидает email-подтверждения/модерации",
  Crunchbase: "Аккаунт создан, требуется заполнение профиля компании",
  DesignRush: "Регистрация пройдена, профиль агентства отправлен",
  GoodFirms: "Заявка на размещение отправлена (подтверждено)",
  Manta: "Заблокировано Cloudflare/anti-bot — требуется ручной заход",
  Medium: "Аккаунт создан, подготовлен материал о компании",
  "Shopify Partners": "Партнёрский аккаунт создан",
  "Digital Agency Net": "Заявка на добавление агентства отправлена",
  Hotfrog: "Заблокировано Cloudflare/anti-bot — требуется ручной заход",
  "Plantation Chamber": "Заявка на членство подана",
  "YouTube Channel": "Канал компании создан",
  "Bark.com": "Форма открывается, заполнение зависает — нужен ручной шаг",
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
  Tumblr: "Требуется регистрация",
  "WooCommerce Agency": "Форма подачи не найдена",
  n49: "Доступ ограничен (403/IP restriction) — требуется ручной заход",
  CityLocalPro: "Заявка отправлена 07.08, профиль не опубликован (поиск: No result) — ожидает модерации",
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
