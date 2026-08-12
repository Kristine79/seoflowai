import { writeFileSync, mkdirSync, existsSync } from "fs";
import ExcelJS from "exceljs";
import { MASTER_LIST } from "../src/lib/directories/MASTER_LIST";
import {
  QueueEntry,
  ProbeEntry,
  loadQueue,
  loadProbes,
  probeOf,
  shortReason,
  techStatusOf,
  techResultOf,
  NA_COMMENTS,
  NA_CATEGORY_LABELS,
  NA_CATEGORY,
} from "./lib/client-data";
import { buildClientSummarySheet, styleTable } from "./lib/client-excel";

const OUT = "client-report/client-status-report.xlsx";

interface ClientRow {
  name: string;
  url: string;
  status: string;
  result: string;
  next: string;
  comment: string;
}

interface Override {
  status: string;
  result: string;
  next: string;
  comment: string;
}

const OVERRIDES: Record<string, Override> = {
  Brownbook: { status: "Размещено", result: "Профиль создан", next: "Проверить публикацию", comment: "Размещение подтверждено" },
  Manta: { status: "Заявка отправлена", result: "Ожидает обработки", next: "Ожидать модерацию", comment: "Заявка на размещение подана" },
  Hotfrog: { status: "Заявка отправлена", result: "Ожидает обработки", next: "Ожидать модерацию", comment: "Заявка подана (Cloudflare пройден)" },
  GoodFirms: { status: "Заявка отправлена", result: "Ожидает обработки", next: "Ожидать модерацию", comment: "Подтверждено в headed-сессии 31.07 (turnstile решён, submit прошёл)" },
  DesignRush: { status: "Заявка отправлена", result: "Ожидает обработки", next: "Ожидать модерацию", comment: "Профиль агентства отправлен на проверку" },
  "Digital Agency Net": { status: "Заявка отправлена", result: "Ожидает обработки", next: "Ожидать модерацию", comment: "Заявка add-agency отправлена" },
  "Plantation Chamber": { status: "Заявка отправлена", result: "Ожидает обработки", next: "Ожидать решение по членству", comment: "Заявка на членство подана" },
  Crunchbase: { status: "Не удалось", result: "Блокировка защитой (внешняя)", next: "No action required", comment: "Cloudflare 403 — \"Sorry, you have been blocked\" на /organization/* даже в headed-браузере (11.08); входа нет, креды не сохранены, регистрация OAuth-only — повторные попытки не запускать" },
  Medium: { status: "Не удалось", result: "Блокировка защитой (внешняя)", next: "No action required", comment: "Cloudflare 403 — \"Sorry, you have been blocked\" (11.08); сессия не активна, внешняя блокировка — повторные попытки не запускать" },
  "Shopify Partners": { status: "Аккаунт создан", result: "Требуется заполнение профиля", next: "Заполнить профиль партнёра", comment: "Partner-аккаунт создан" },
  Sitejabber: { status: "Требуется действие", result: "Ожидает действия", next: "Повторно пройти регистрацию/капчу", comment: "Аккаунт создавался ранее; повторный прогон не стартовал (ошибка браузера)" },
  "YouTube Channel": { status: "Аккаунт создан", result: "Канал создан", next: "Создать контент канала", comment: "Brand channel создан" },
  CityLocalPro: { status: "Форма заполнена", result: "Ожидает завершения", next: "Завершить submit/captcha", comment: "Форма заполнена ранее; повторный прогон упал — нужен ручной шаг (reCAPTCHA v2)" },
  TopSEOs: { status: "Форма заполнена", result: "Ожидает завершения", next: "Завершить отправку формы", comment: "Заполнение проходит, submit зависает — нужен ручной клик" },
  "Yellow Pages": { status: "Не удалось", result: "Блокировка защитой (внешняя)", next: "No action required", comment: "Заявка подана в headed-сессии 31.07 (CF пройден); повторный заход блокируется (Cloudflare/IP) — публикацию проверить вручную" },
  G2: { status: "Требуется действие", result: "Ожидает действия", next: "Пройти защиту и подать claim", comment: "Закрыто Cloudflare; повторный прогон упал" },
  Opendi: { status: "Не удалось", result: "Блокировка защитой (внешняя)", next: "No action required (нужен другой IP/VPN)", comment: "Сайт показывает \"Sorry, you have been blocked\" — IP/fingerprint блокировка, turnstile не проходит" },
  "The Manifest": { status: "Требуется действие", result: "Ожидает действия", next: "Зарегистрироваться и подать заявку", comment: "Форма не найдена автоматически" },
  Sortlist: { status: "Требуется действие", result: "Ожидает действия", next: "Пройти защиту и подать заявку", comment: "Закрыто Cloudflare (SPA)" },
  "Bark.com": { status: "Размещено", result: "Профиль создан", next: "Проверить публикацию", comment: "Аккаунт создан и подтверждён 10.08 (seller/self: spf_id=4708659, user_id=40829222), dashboard live" },
  Semfirms: { status: "Размещено", result: "Профиль создан", next: "Проверить публикацию", comment: "Профиль создан и публично доступен: https://www.semfirms.com/profile/itllect-llc" },
  FindUsHere: { status: "Размещено", result: "Профиль создан", next: "Проверить публикацию", comment: "Профиль создан и публично доступен: https://www.find-us-here.com/businesses/Itllect-LLC-Plantation-Florida-USA/34578398/" },
  "AngelList/Wellfound": { status: "Размещено", result: "Профиль создан", next: "Проверить публикацию", comment: "Профиль компании создан и публично доступен: https://wellfound.com/company/itllect" },
  "Ft Lauderdale Chamber": { status: "Требуется действие", result: "Ожидает действия", next: "Зарегистрироваться и подать заявку", comment: "Заявка на членство за логином" },
  "South FL Biz Journal": { status: "Требуется действие", result: "Ожидает действия", next: "Пройти защиту (PR-подача)", comment: "Закрыто Cloudflare" },
  "Mailchimp Partner": { status: "Требуется действие", result: "Ожидает действия", next: "Зарегистрироваться и подать заявку", comment: "Партнёрская заявка за логином" },
  ActiveCampaign: { status: "Требуется действие", result: "Ожидает действия", next: "Дозаполнить форму и отправить", comment: "Форма заполнена частично, нет кнопки отправки" },
  "Stripe Partner": { status: "Требуется действие", result: "Ожидает действия", next: "Найти путь подачи заявки", comment: "Страница заявки без формы" },
  Awwwards: { status: "Требуется действие", result: "Ожидает действия", next: "Зарегистрироваться (подача платная)", comment: "Подача сайта платная" },
  "Stack Overflow": { status: "Требуется действие", result: "Ожидает действия", next: "Пройти защиту / уточнить применимость", comment: "Закрыто Cloudflare; Jobs платные" },
  HubPages: { status: "Требуется действие", result: "Ожидает действия", next: "Зарегистрироваться и опубликовать материал", comment: "Требуется аккаунт" },
  ProvenExpert: { status: "Требуется действие", result: "Ожидает действия", next: "Регистрация + подтверждение email", comment: "Требуется аккаунт и подтверждение email" },
  Superpages: { status: "Не удалось", result: "Блокировка защитой", next: "Manual captcha required (headed-сессия)", comment: "Закрыто Cloudflare" },
  EZlocal: { status: "Не удалось", result: "Блокировка защитой", next: "Manual captcha required (headed-сессия)", comment: "Закрыто Cloudflare" },
  "Agency Spotter": { status: "Не удалось", result: "Блокировка защитой", next: "Manual captcha required (headed-сессия)", comment: "Закрыто Cloudflare" },
  "Merchant Circle": { status: "Не удалось", result: "Ошибка автоматизации", next: "Зарегистрировать аккаунт вручную", comment: "Требуется регистрация мерчанта" },
  "Local.com": { status: "Не удалось", result: "Страница не работает", next: "No action required", comment: "Страница подачи не работает (404)" },
  Upcity: { status: "Не удалось", result: "Сайт недоступен", next: "No action required", comment: "Сайт недоступен" },
  "Expertise.com": { status: "Не удалось", result: "Требуется регистрация", next: "Зарегистрировать аккаунт вручную", comment: "Требуется регистрация/номинация" },
  "FL Business Dir": { status: "Не удалось", result: "Сайт недоступен", next: "No action required", comment: "Сайт недоступен" },
  "WooCommerce Agency": { status: "Не удалось", result: "Форма не найдена", next: "No action required", comment: "Форма не определяется автоматически" },
  Behance: { status: "Не удалось", result: "Сайт недоступен", next: "No action required", comment: "Сайт недоступен" },
  Dribbble: { status: "Не удалось", result: "Требуется регистрация", next: "Зарегистрировать аккаунт вручную", comment: "Требуется регистрация дизайнера" },
  "CSS Design Awards": { status: "Не удалось", result: "Сайт недоступен", next: "No action required", comment: "Сайт недоступен" },
  Tumblr: { status: "Не удалось", result: "Требуется регистрация", next: "Зарегистрировать аккаунт вручную", comment: "Регистрация не прошла автоматически" },
  EzineArticles: { status: "Не удалось", result: "Сайт недоступен", next: "No action required", comment: "Сайт недоступен" },
};

const EXTERNAL_KIND = {
  CF: "Cloudflare / IP / access restriction",
  CAPTCHA: "CAPTCHA",
  UNREACHABLE: "Site unavailable",
};

function externalBlockOf(q: QueueEntry): { kind: string; detail: string } | null {
  const text = ((q.result || "") + " | " + (q.notes || "")).toLowerCase();
  if (/external block|cloudflare|cf blocked|cf in headless|access restriction|blocked in headless|sorry, you have been blocked/.test(text)) {
    return { kind: EXTERNAL_KIND.CF, detail: (q.result || q.notes || "").slice(0, 120) };
  }
  if (/captcha|turnstile|recaptcha/.test(text)) {
    return { kind: EXTERNAL_KIND.CAPTCHA, detail: (q.result || q.notes || "").slice(0, 120) };
  }
  if (/unreachable|chrome-error/.test(text)) {
    return { kind: EXTERNAL_KIND.UNREACHABLE, detail: (q.result || q.notes || "").slice(0, 120) };
  }
  return null;
}

function clientRow(
  name: string,
  url: string,
  q: QueueEntry,
  probes: Record<string, ProbeEntry>,
  tech: string
): ClientRow {
  const ov = OVERRIDES[name];
  if (ov) {
    return { name, url, status: ov.status, result: ov.result, next: ov.next, comment: ov.comment };
  }
  if (tech === "NOT_APPLICABLE") {
    return {
      name,
      url,
      status: "Не подходит",
      result: "Не применимо",
      next: "No action required",
      comment: NA_COMMENTS[name] || "Площадка не подходит для размещения",
    };
  }
  const r = shortReason(q, probes);
  return {
    name,
    url,
    status: "Требуется действие",
    result: "Ожидает действия",
    next: "Уточнить следующий шаг",
    comment: r || q.notes || "",
  };
}

function main() {
  if (!existsSync("client-report")) mkdirSync("client-report", { recursive: true });
  const queue = loadQueue();
  const probes = loadProbes();
  const qBy = new Map(queue.map((e) => [e.name, e]));

  const rows: ClientRow[] = [];
  for (const m of MASTER_LIST) {
    const q = qBy.get(m.name);
    if (!q) continue;
    const tech = techStatusOf(q);
    rows.push(clientRow(m.name, m.url, q, probes, tech));
  }

  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
  const order = ["Размещено", "Заявка отправлена", "Аккаунт создан", "Форма заполнена", "Требуется действие", "Не удалось", "Не подходит"];
  const totalPlatforms = rows.length;
  const totalList = 87;
  const headerRows = totalList - totalPlatforms;

  const blockedRows = queue
    .filter((e) => e.status !== "SUCCESS")
    .map((e) => ({ entry: e, ext: externalBlockOf(e) }))
    .filter((x): x is { entry: QueueEntry; ext: { kind: string; detail: string } } => x.ext !== null)
    .map(({ entry, ext }) => {
      const next =
        ext.kind === EXTERNAL_KIND.CF
          ? "Требуется другой IP/VPN или ручной заход"
          : ext.kind === EXTERNAL_KIND.CAPTCHA
            ? "Ручное решение капчи (headed-сессия)"
            : "No action required (сайт недоступен)";
      return {
        Directory: entry.name,
        URL: entry.url,
        Restriction: ext.kind,
        Detail: ext.detail,
        "Next Action": next,
      };
    });

  const summary: Array<{ Показатель: string; Значение: string }> = [
    { Показатель: "Всего каталогов", Значение: String(totalList) + " (строк списка клиента; реальных площадок: " + totalPlatforms + ", строк-заголовков секций: " + headerRows + ")" },
    { Показатель: "Размещено", Значение: String(counts["Размещено"] || 0) },
    { Показатель: "Заявки отправлены", Значение: String(counts["Заявка отправлена"] || 0) },
    { Показатель: "Аккаунты созданы", Значение: String(counts["Аккаунт создан"] || 0) },
    { Показатель: "Форма заполнена", Значение: String(counts["Форма заполнена"] || 0) },
    { Показатель: "Требуется действие", Значение: String(counts["Требуется действие"] || 0) },
    { Показатель: "Не удалось", Значение: String(counts["Не удалось"] || 0) },
    { Показатель: "Не подходит", Значение: String(counts["Не подходит"] || 0) },
    { Показатель: "Заблокировано внешними ограничениями", Значение: String(blockedRows.length) + " (см. лист \"External Restrictions\")" },
    { Показатель: "Пояснение (Не подходит)", Значение: "Статус \"Не подходит\" — не ошибка выполнения: часть исходного списка не являлась площадками для стандартного размещения компании. Все такие площадки проверены и исключены по причине несоответствия формату задачи (соцсети, партнёрские программы, агрегаторы данных, информационные и государственные ресурсы). Подробности — в листе \"Not Applicable Explanation\"." },
    { Показатель: "Итого площадок", Значение: String(totalPlatforms) },
  ];

  const naRows = rows
    .filter((r) => r.status === "Не подходит")
    .map((r) => {
      const cat = NA_CATEGORY[r.name] || 4;
      const cls = NA_CATEGORY_LABELS[cat];
      const specific = NA_COMMENTS[r.name] ? " " + NA_COMMENTS[r.name] + "." : "";
      return {
        Directory: r.name,
        URL: r.url,
        Reason: cls.label,
        Explanation: cls.explanation + specific,
      };
    });

  const techRows = rows.map((r) => {
    const q = qBy.get(r.name)!;
    const reason = shortReason(q, probes);
    return {
      Каталог: r.name,
      URL: r.url,
      "Системный статус": techStatusOf(q),
      "Статус в очереди": q.status,
      "Результат (техн.)": techResultOf(q, probes),
      Причина: reason,
    };
  });

  const wb = new ExcelJS.Workbook();

  buildClientSummarySheet(wb);

  const wsMain = wb.addWorksheet("Client Report");
  wsMain.addRows([
    ["Каталог", "Статус", "Результат", "Next Action", "Ссылка", "Комментарий"],
    ...rows.map((r) => [r.name, r.status, r.result, r.next, r.url, r.comment]),
  ]);
  styleTable(wsMain, 1, 6, [24, 20, 26, 42, 48, 52]);

  const wsSummary = wb.addWorksheet("Summary");
  wsSummary.addRows([
    ["Показатель", "Значение"],
    ...summary.map((s) => [s.Показатель, s.Значение]),
  ]);
  styleTable(wsSummary, 1, 2, [26, 90]);

  const wsNA = wb.addWorksheet("Not Applicable Explanation");
  wsNA.addRows([
    ["Directory", "URL", "Reason", "Explanation"],
    ...naRows.map((r) => [r.Directory, r.URL, r.Reason, r.Explanation]),
  ]);
  styleTable(wsNA, 1, 4, [24, 48, 34, 110]);

  const wsBlocked = wb.addWorksheet("External Restrictions");
  wsBlocked.addRows([
    ["Directory", "URL", "Restriction", "Detail", "Next Action"],
    ...blockedRows.map((r) => [r.Directory, r.URL, r.Restriction, r.Detail, r["Next Action"]]),
  ]);
  styleTable(wsBlocked, 1, 5, [24, 48, 34, 60, 46]);

  const wsTech = wb.addWorksheet("Technical Status");
  wsTech.addRows([
    ["Каталог", "URL", "Системный статус", "Статус в очереди", "Результат (техн.)", "Причина"],
    ...techRows.map((r) => [r.Каталог, r.URL, r["Системный статус"], r["Статус в очереди"], r["Результат (техн.)"], r.Причина]),
  ]);
  styleTable(wsTech, 1, 6, [24, 48, 20, 16, 80, 30]);

  wb.xlsx.writeFile(OUT).then(() => {
    console.log("=== CLIENT STATUS REPORT ===");
    console.log("Rows:", totalPlatforms);
    for (const k of order) console.log(`${k}: ${counts[k] || 0}`);
    console.log("Sheets: " + wb.worksheets.map((s) => s.name).join(", "));
    console.log("File:", OUT);
  });
}

main();
