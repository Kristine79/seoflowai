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
  Crunchbase: "REGISTERED",
  DesignRush: "SUBMITTED",
  GoodFirms: "SUBMITTED",
  Manta: "FAILED",
  Medium: "REGISTERED",
  "Shopify Partners": "REGISTERED",
  "Digital Agency Net": "SUBMITTED",
  Hotfrog: "FAILED",
  "Plantation Chamber": "SUBMITTED",
  "YouTube Channel": "REGISTERED",
  "Bark.com": "NEEDS_MANUAL",
  CityLocalPro: "SUBMITTED",
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
  Opendi: "EXTERNAL BLOCK — Cloudflare/access restriction; IP/fingerprint блокировка, turnstile не проходит (\"" + "Sorry, you have been blocked" + "\")",
  TopSEOs: "Форма жива на /registration (Drupal); заполнение проходит, submit зависает — нужен ручной шаг",
  ActiveCampaign: "Сайт ожил после DEAD; partner-форма 21f заполнена частично, submit-кнопки нет",
  G2: "Сайт ожил после DEAD; claim-listing закрыт Cloudflare; повторный прогон упал (краш браузера)",
  "Local.com": "claim-listing → 404 (Page not found), форма нерабочая",
  Semfirms: "VERIFIED_SUCCESS: профиль создан и публично доступен",
  FindUsHere: "VERIFIED_SUCCESS: профиль создан и публично доступен (18+ млн бизнесов в каталоге)",
};

export const PROFILE_URL_TEXT: Record<string, string> = {
  Semfirms: "https://www.semfirms.com/profile/itllect-llc",
  FindUsHere: "https://www.find-us-here.com/businesses/Itllect-LLC-Plantation-Florida-USA/34578398/",
  Brownbook: "не подтверждён (профиль не найден)",
};

export const NA_COMMENTS: Record<string, string> = {
  Alignable: "Нет открытой формы размещения",
  Spoke: "Площадка сменила профиль — не каталог",
  n49: "Доступ ограничен (403), нет формы размещения",
  "Find Best SEO": "Реестр рейтингов, формы нет",
  "Influencer Mkt Hub": "Форма не работает (email-сборщик)",
  "FL SBDC Network": "Консультационный сервис, не каталог",
  "Broward County Chamber": "Страница заявки пустая",
  "Miami Chamber": "Членство оформляется вручную",
  "Nextdoor Business": "Подтверждение по почтовой открытке",
  "City of Plantation": "Муниципальный ресурс",
  "Broward County Biz": "Муниципальный ресурс",
  "SCORE Mentor Network": "Менторская программа, не каталог",
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
  "Data Axle": 3,
  "Neustar Localeze": 3,
  "Find Best SEO": 3,
  Spoke: 3,
  "FL DEO Business": 3,
  "SBA.gov Business": 3,
  "FL SBDC Network": 3,
  "Broward County Biz": 3,
  "City of Plantation": 3,
  Alignable: 4,
  "Broward County Chamber": 4,
  "Miami Chamber": 4,
  ProductHunt: 4,
  n49: 4,
};

export const CLIENT_RESULT_TABLE = [
  { status: "Размещено (подтверждено)", count: 2, description: "Профиль компании успешно создан и доступен (Semfirms, FindUsHere)" },
  { status: "Заявка отправлена", count: 6, description: "Форма размещения заполнена и отправлена, ожидается обработка площадкой (в т.ч. Brownbook, CityLocalPro 07.08)" },
  { status: "Аккаунт создан", count: 4, description: "Создан аккаунт, требуется дальнейшее заполнение или публикация профиля" },
  { status: "Требуется действие", count: 12, description: "Нужен ручной шаг: подтверждение, CAPTCHA, заполнение профиля или другие действия" },
  { status: "Не удалось выполнить", count: 23, description: "Площадка недоступна, заблокирована (в т.ч. Cloudflare/anti-bot) или возникла техническая проблема" },
  { status: "Не подходит для размещения", count: 29, description: "Ресурс не является стандартным каталогом компаний или требует другого подхода" },
];

export const CLIENT_IMPORTANT_INFO =
  "В процессе проверки выяснилось, что не все площадки из исходного списка являются каталогами для прямого добавления компаний.\n" +
  "Часть ресурсов относится к социальным платформам, контентным площадкам, партнёрским программам или информационным ресурсам.\n" +
  "Для таких площадок требуется отдельная стратегия: создание контента, публикации, партнёрство или ручная заявка.";

export const CLIENT_NEXT_STEPS =
  "Приоритет дальнейшей работы:\n" +
  "1. Завершение площадок, где уже создан аккаунт или отправлена заявка.\n" +
  "2. Обработка площадок, требующих ручного действия.\n" +
  "3. Дополнение профилей и получение прямых ссылок на размещения.";

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
  NEEDS_MANUAL: "Требуется ручное действие",
  FAILED: "Не удалось выполнить",
  NOT_APPLICABLE: "Не подходит для размещения",
  UNVERIFIED: "Требуется ручное действие",
};

export const CLIENT_NEXT: Record<string, string> = {
  "Размещено (подтверждено)": "Проверка завершена",
  "Заявка отправлена": "Ожидать обработки площадкой",
  "Аккаунт создан": "Заполнить профиль компании / завершить публикацию",
  "Требуется ручное действие": "Требуется ручное действие",
  "Не удалось выполнить": "Проверить альтернативный способ размещения",
  "Не подходит для размещения": "Не является стандартным каталогом компаний",
};

export const CLIENT_REASON: Record<string, string> = {
  "Размещено (подтверждено)": "Профиль компании создан и доступен",
  "Заявка отправлена": "Форма размещения заполнена и отправлена",
  "Аккаунт создан": "Создан аккаунт, профиль ещё не опубликован",
  "Требуется ручное действие": "Требуется CAPTCHA, подтверждение, ручной шаг или дополнительная регистрация",
  "Не удалось выполнить": "Сайт недоступен / ограничение доступа / техническая ошибка",
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
  TopSEOs: "Форма заполняется, отправка зависает — нужен ручной шаг",
  ActiveCampaign: "Сайт доступен; форма заполнена частично, нет кнопки отправки",
  "South FL Biz Journal": "Доступ ограничен защитой сайта — требуется ручной заход",
  "Stack Overflow": "Доступ ограничен защитой сайта — требуется ручной заход",
  Sortlist: "Доступ ограничен защитой сайта — требуется ручной заход",
  Semfirms: "Профиль создан и подтверждён",
  FindUsHere: "Профиль создан и подтверждён",
  "Ft Lauderdale Chamber": "Заявка на членство требует регистрации и ручного шага",
  "Mailchimp Partner": "Требуется регистрация и подача партнёрской заявки",
  "Stripe Partner": "Требуется найти способ подачи партнёрской заявки",
  Awwwards: "Требуется регистрация (подача платная)",
  HubPages: "Регистрация недоступна (все URL 404) — требуется ручная проверка",
  ProvenExpert: "Сайт блокирует соединение (ERR_CONNECTION_CLOSED) — требуется ручная проверка",
  "Yellow Pages": "Заблокировано Cloudflare/anti-bot — требуется ручной заход",
  Opendi: "Сайт блокирует доступ (защита сайта); требуется другой IP/VPN или ручной заход",
  G2: "Форма подачи ограничена защитой сайта; требуется ручное действие",
  "Local.com": "Страница подачи не работает (404)",
  Sitejabber: "Аккаунт создавался ранее; требуется ручная проверка",
  Superpages: "Доступ ограничен защитой сайта",
  EZlocal: "Доступ ограничен защитой сайта",
  "Agency Spotter": "Доступ ограничен защитой сайта",
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
  CityLocalPro: "Заявка отправлена 07.08, профиль не опубликован (поиск: No result) — ожидает модерации",
  "SCORE Mentor Network": "Форма найдена, требуется ручное заполнение",
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
