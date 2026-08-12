# SEOFlow AI — Handoff Document

> HISTORICAL DOCUMENT
>
> This document describes an earlier development stage and is retained for project history. It is not the current source of truth.

> **Дата:** 31 июля 2026
> **Цель документа:** полная передача проекта новому AI-кодеру для продолжения клиентского заказа.
> **Заказ:** размещение компании клиента **ITllect** во всех каталогах из списка клиента (75 площадок).
> **Предыдущие handoff-документы:** `docs/SEOFlow_HANDOFF.md` (30.07, устарел — статусы изменились), `docs/directory-submission-report.md` (клиентский отчёт), `final-report-75.md` (актуальная классификация).

---

## 1. Project Overview

### Что делает SEOFlow AI
SEOFlow AI — это web-приложение (Next.js) + платформа browser-автоматизации для **массового размещения компании клиента в business directories**:
- AI-анализ и классификация каталогов (75 площадок из Excel-списка клиента);
- автоматическое заполнение форм регистрации/размещения через Playwright (headless и headed-stealth);
- AI field mapping (какие данные компании в какое поле формы);
- worker-система с очередью заданий (`AutomationJob`);
- multi-step навигация по многошаговым формам;
- детекция препятствий: Cloudflare, CAPTCHA, login-требования, email verification;
- human-in-the-loop режим: headed браузер + окно ручного действия 180с + IMAP-верификация email;
- генерация клиентских отчётов (MD + CSV).

### Главная бизнес-цель проекта
Автоматизировать (насколько возможно) размещение компании **ITllect** (https://itllect.com) в **75 каталогах** из клиентского списка `public/87catalogs.xlsx`, минимизируя ручную работу, и сдать клиенту отчёт о размещениях. Вторичная цель — это работающий product-прототип (UI на русском: каталоги, кампании, аудит, контент, компания, дашборд), который затем можно продавать как SaaS "directory submission service".

### Текущая задача клиента
Разместить компанию ITllect во **всех каталогах из списка** (75 реальных площадок; остальные строки xlsx — заголовки секций, отфильтрованы). Каталоги классифицированы на 5 workflow-типов (A–E, см. §6). Итоговый результат — отчёт клиенту с подтверждёнными размещениями.

---

## 2. Tech Stack

| Компонент | Версия / Детали |
|---|---|
| **Next.js** | `16.2.12` (App Router, `next build --webpack`) |
| **React** | `19.2.4` |
| **TypeScript** | `^5` |
| **Prisma ORM** | `^7.9.1` + `@prisma/adapter-pg` (Prisma v7, **driver adapter обязателен**; generator `prisma-client`, output в `src/generated/prisma`) |
| **Database** | PostgreSQL — **NeonDB (free tier)**. Free tier suspend после ~5 мин неактивности, wake-up 10–30с. SSL: `ssl: { rejectUnauthorized: false }`, `sslmode` из URL удаляется |
| **Playwright** | `^1.62.0` (chromium; headless через `browser.ts`, headed persistent-context через `stealth.ts`) |
| **AI provider** | `openai` SDK `^6.49.0`. База: `OPENAI_BASE_URL` (может указывать на OpenRouter/любой OpenAI-совместимый API). Модель по умолчанию `gpt-4o-mini` (`OPENAI_MODEL`) |
| **Email (IMAP)** | `imapflow ^1.6.5` — чтение verification-писем (Gmail app-password) |
| **UI** | Radix UI (checkbox, dialog, select, tabs, toast и др.), Tailwind CSS v4, shadcn-стиль компоненты (`src/components/ui`), `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority` |
| **State/Data** | `@tanstack/react-query ^5`, `zustand ^5` |
| **Прочее** | `xlsx ^0.18.5` (импорт Excel-списка), `recharts` (графики дашборда), `dotenv` |
| **Скрипты** | `tsx ^4.23.1` (`npx tsx scripts/*.ts`) |
| **ESLint** | `^9` + `eslint-config-next` |

### Переменные окружения (`.env`, см. `.env.example`)
```
DATABASE_URL      — PostgreSQL (NeonDB) connection string
OPENAI_API_KEY    — ключ OpenAI/OpenRouter
OPENAI_BASE_URL   — кастомный base URL (опционально)
OPENAI_MODEL      — модель (default gpt-4o-mini)
EMAIL_USER        — IMAP логин (используется itllect.marketing@gmail.com)
EMAIL_PASS        — IMAP app-password
EMAIL_HOST        — imap.gmail.com
EMAIL_PORT        — 993
```

---

## 3. Current Architecture

### 3.1 Слои

**Web App (Next.js, UI на русском):**
- `src/app/page.tsx` — дашборд; `src/app/directories/` — список каталогов с фильтрами/статусами (RU), `src/app/directories/[id]/` — детальная страница с кнопкой "Start Submission", чек-листом, выбором automation mode (MANUAL / AI_ASSISTED), режимом PREVIEW/SUBMIT;
- `src/app/campaigns/`, `src/app/company/`, `src/app/audit/`, `src/app/content/`, `src/app/settings/` — прочие разделы;
- API: `src/app/api/{audit,campaigns,company,content,dashboard,directories,seed,submission,upload}`.

**Browser automation layer** (`src/lib/automation/`):
- `browser.ts` — headless chromium singleton (`getBrowser`), `navigateTo` (viewport 1280×800, реальный Chrome UA, `domcontentloaded` + 2s wait), `takeScreenshot` (base64 PNG full-page), `closePage/closeBrowser`;
- `stealth.ts` — **отдельный** headed harness: `launchStealthContext` (persistent context, свой userDataDir на профиль: `seoflowai-temp/agent-profiles/<slug>`), анти-детект init-скрипт (webdriver, plugins, WebGL, permissions), `isCloudflareChallenge` / `waitForCloudflareClear` (90с), `detectCaptcha` (recaptcha_v2/v3, hcaptcha, turnstile), `pauseForManualCaptcha` + `waitForEnter`, `screenshotToFile`. НЕ решает капчу автоматически — только выводит окно для человека;
- `form-analyzer.ts` — `extractFormStructure(page)`: все input/select/textarea/button → `{selector, type, label, placeholder, required}` + `submitSelector/submitText`; `checkFormQuality(page)`: детект `hasCaptcha` (виджет с видимым rect), `hasCloudflareChallenge` (title/body-маркеры + guard `totalFields <= 1` — чтобы не путать challenge-страницу с формой, где встроен Turnstile), `totalFields`, `requiredFields`;
- `field-mapper.ts` — `mapFieldsWithAI`: **сначала rule-based** (LABEL_RULES: name/legalName/email/phone/website/address/city/state/zip/country/description/category/keywords/socials; transform `US → United States` через COUNTRY_NAMES; строгие social-правила — не маппить соцсети, если у компании нет данных), **потом AI** для оставшихся полей (промпт с index-ключами `f0..fN` + `response_format: json_object`, anti-hallucination selectors; graceful fallback на rule-mapping при ошибке AI);
- `submission-runner.ts` (~1726 строк) — **главный orchestrator** (подробно в §4);
- `email-verifier.ts` — `getEmailConfig`, `waitForVerificationLink(senderPattern, subjectPattern, timeout)`, `waitForVerificationCode` — poll IMAP каждые 5с, извлекает URL/код из письма.

**Form analyzer / AI mapping / Submission runner** — см. §3.1 выше.

**Worker system:**
- `src/workers/submission-agent.ts` — polling-демон: каждые 10с берёт до 5 `AutomationJob` со статусом `PENDING`, запускает `runSubmission`, сохраняет `SubmissionTemplate` после успешного PREVIEW, пишет скриншот в корень `test-output-<dirId8>.png`, классифицирует результат по keywords ошибки → `SUCCESS | NEEDS_MANUAL | FAILED`. Запуск: `npm run submission-agent` (или `--once`).

**Database models** (`prisma/schema.prisma`, PostgreSQL):
- `Company` — данные компании (name, legalName, website, email, phone, address, city, state, country, descriptionShort/Medium/Long, services, keywords, logo и т.д.);
- `Campaign` — кампания (companyId, status);
- `Directory` — каталог: platform, url, priority (HIGH/MEDIUM/LOW), category, notes, status (`TaskStatus`: PENDING/AI_PREPARED/READY/IN_PROGRESS/WAITING_VERIFICATION/COMPLETED/REJECTED/PAYMENT_REQUIRED), liveUrl, checklistProgress, automationMode (default "MANUAL"), campaignId/companyId;
- `SeoAudit` — AI-аудит каталога (seoScore, platformType, automationLevel, recommendation и др., 1:1 к Directory);
- `Submission` — логин/пароль/listingUrl/verificationStatus (1:1);
- `GeneratedContent` — описания, keywords, suggestedCategories (1:1);
- `SubmissionTemplate` — сохранённый fieldMapping/formStructure/submitSelector + version (1:1);
- `AutomationJob` — job: status (PENDING/RUNNING/SUCCESS/FAILED/NEEDS_MANUAL), mode (PREVIEW/SUBMIT), screenshot (base64), error, logs (JSON), timestamps. Index на directoryId.

**Templates:** `SubmissionTemplate` — сохраняется после успешного PREVIEW-прогона (mapping + structure), переиспользуется при SUBMIT (version increment). Приоритет значений: `carryover (label-match между шагами) > saved template > AI mapping`.

**Reports:**
- `final-report-75.md` / `final-report-75.csv` — актуальный отчёт по 75 площадкам (генерируется `scripts/generate-final-report.ts` из MASTER_LIST + probe-results);
- `docs/directory-submission-report.md` — клиентский отчёт (30.07, статусы устарели);
- `docs/production-tests/brownbook-submission-report.md` — отчёт первого успешного размещения;
- `pool-preview-report.md`, `pool-submit/pool-report.md`, `human-submit-out/` — логи прогонов.

### 3.2 Ключевые файлы (карта)

| Путь | Назначение |
|---|---|
| `src/lib/automation/submission-runner.ts` | Главный orchestrator submission-пайплайна (form detect → AI map → fill → multi-step → submit → screenshot) |
| `src/lib/automation/form-analyzer.ts` | Извлечение структуры формы, детект Cloudflare/CAPTCHA |
| `src/lib/automation/field-mapper.ts` | Rule-based + AI field mapping |
| `src/lib/automation/browser.ts` | Headless chromium (обычные прогоны) |
| `src/lib/automation/stealth.ts` | Headed stealth-браузер (Cloudflare, ручная капча, профили) |
| `src/lib/automation/email-verifier.ts` | IMAP: ждёт verification link/code из почты |
| `src/workers/submission-agent.ts` | Worker: polling PENDING AutomationJob → runSubmission → сохранение результата |
| `src/lib/directories/MASTER_LIST.ts` | **Авторитетный список 75 площадок** (name, url, submissionUrl, type A–E, clientCategory, method, notes, priority) |
| `prisma/schema.prisma` | Схема БД (8 моделей) |
| `src/app/api/submission/start/route.ts` | Создание AutomationJob из UI (gate: automationMode === "AI_ASSISTED", status IN_PROGRESS/READY) |
| `src/app/api/directories/`, `upload/`, `audit/`, `content/` и др. | CRUD/аудит/контент API |
| `scripts/probe-master.ts` | Live-перепроверка submissionUrl всех 75 площадок → `probe-results.json` + `probe-out/*.png` |
| `scripts/generate-final-report.ts` | Клиентский отчёт из MASTER_LIST + probe-results → `final-report-75.{md,csv}` |
| `scripts/generate-human-queue.ts` | Очередь человеческих действий → `human-queue.json` |
| `scripts/human-submit.ts` | Headed human-assisted submission + `--register` (IMAP авто-регистрация) |
| `scripts/stealth-submit.ts` | SUBMIT-прогон по известным площадкам (GoodFirms, TopSEOs, Opendi, Bark, B2C) через stealth |
| `scripts/submit-pool.ts` | Прогон submission-runner по SUCCESS_CANDIDATE-пулу (PREVIEW по умолчанию, `--submit`) |
| `scripts/batch-business-directories.ts` | Прогон по дополнительным каталогам-заменителям (Tupalo, Yalwa, ShowMeLocal, BizHwy, YellowBot, MojoPages, Naymz, Hotfrog, Cylex) |
| `scripts/verify-registrations.ts` | Проверка доступности/логин-форм ключевых площадок (Crunchbase, GoodFirms, Medium, Shopify, CityLocalPro, DesignRush, Brownbook) |
| `scripts/check-urls.ts` | Проверка URL из human-queue по списку (stealth, скриншоты `urlcheck-*.png`) |
| `scripts/diagnose-directories.ts` | Диагностика форм каталогов |
| `public/87catalogs.xlsx` | Исходный Excel-список клиента (87 строк, 75 реальных площадок) |
| `seoflowai-temp/agent-profiles/` | Persistent browser profiles (по одному на площадку) — хранят cookies/логины между прогонами |
| `dist/` | Компилированный артефакт (tsc) — можно игнорировать |
| `docs/` | Отчёты и старый handoff |

---

## 4. AI Submission Pipeline (полный flow)

Пайплайн от выбора каталога до результата:

1. **Создание AutomationJob.** В UI (`src/app/directories/[id]/page.tsx`, кнопка "Start Submission", режим PREVIEW/SUBMIT, automationMode = AI_ASSISTED) → `POST /api/submission/start` → создаётся `AutomationJob {status: PENDING, mode}` в БД. Либо напрямую через скрипты: `submit-pool.ts`, `stealth-submit.ts`, `batch-business-directories.ts` (компания задана константой `COMPANY_DATA` в каждом скрипте).
2. **Запуск worker.** `src/workers/submission-agent.ts` (показывать не нужно — polling): раз в 10с `findMany({where: {status: "PENDING"}, take: 5})` → `processJob` → job → RUNNING.
3. **Открытие браузера.** `runSubmission(url, companyData, openai, mode, template, log)` в `submission-runner.ts`: `navigateTo` (headless, browser.ts) → wait, log title.
4. **Детекты-гейты:**
   - `detectLoginRequired` — есть password-поле + login keywords → error "Требуется авторизация";
   - `checkFormQuality` — Cloudflare challenge-страница → error FAILED (без обхода, по правилам проекта); реальный captcha-виджет → **НЕ прерываем**, ставим флаг `captchaDetected` (форма заполняется, в конце → NEEDS_MANUAL);
   - если на лендинге < 3 required полей → `navigateToAddBusinessPage` (ищет ссылки "Add your business / Get listed / Add a listing…" с приоритетом по длине keyword, переходит по href или кликает) → повторный quality-чек. Нет формы и нет ссылки → error "Форма не найдена".
5. **Анализ формы.** `extractFormStructure(page)` → список полей (selector, label, placeholder, type, required).
6. **AI mapping.** Для каждого шага формы: label-carryover (значения из предыдущих шагов по совпадению label), потом saved template (только для живых селекторов), потом `mapFieldsWithAI` для несоотвеченных (rule-based → AI → fallback). Приоритет: `carryover > template > AI`. Normalization селекторов (CSS.escape, fallback на `#react-select-country_select-input` для country).
7. **Заполнение.** Для каждого поля: `page.fill`; fallback — JS-set value + dispatch `input/change` (для hidden/React); `handleSelectField` — для `<select>`, readonly MUI Autocomplete (popover search + скоринг опций), react-select/combobox (клик → type → выбор `[role=option]` с fuzzy-скорингом, retry с коротким термином). PREVIEW-mode: скриншот до навигации по country-селекту.
8. **Multi-step navigation.** Цикл до 5 шагов: после заполнения шага `findNextStepButton` (keywords next/continue/далее; исключая submit-слова; ждёт исчезновения спиннеров) → клик (в т.ч. `target="_blank"` → ловит новую вкладку через `page.context().waitForEvent("page")`, сохраняет как `page.__newPage`) → проверка смены URL → детект search-страницы (`handleSearchPage`: страна/город + "Search" → фильтрация; для Brownbook — overlay z-[999] dismissal + клик `#add-business-link`). Стоп: нет кнопки next / disabled / ошибка клика / 5 шагов.
9. **Final form analysis.** После цикла — повторный `extractFormStructure` финальной страницы, AI-mapping и заполнение новых полей (учитывая `__newPage`).
10. **Submit (только SUBMIT-mode).** `validateBeforeSubmit`: обязательные поля, критические поля (name/email/phone/website/address), семантическая сверка значений (label-паттерны × companyData), наличие кнопки submit (или next как submit) → клик → ждать 3с → `detectEmailVerification` ("verify your email" и т.п.) → если да: error "Требуется подтверждение email" (NEEDS_MANUAL).
11. **Screenshot.** `takeScreenshot` (base64 full-page) — в PREVIEW это скриншот до навигации по country-select (если был), иначе финальный.
12. **Сохранение результата.** Возврат `SubmissionResult {success, screenshot, error, logs, fieldMapping, formStructure, submitSelector}` → worker: job → SUCCESS/NEEDS_MANUAL/FAILED (по keywords ошибки), скриншот → файл `test-output-<id>.png`, логи → JSON в job.logs; при успешном PREVIEW — `SubmissionTemplate.upsert` (version+1). Если был реальный captcha → результат NEEDS_MANUAL "Captcha: форма заполнена, требуется ручное подтверждение".

**Human-assisted path (для NEEDS_MANUAL):** `scripts/human-submit.ts --run [--register]` — headed stealth-браузер, ожидание прохождения Cloudflare (до 120с), решение капчи человеком (до 180с), AI-заполнение, окно "HUMAN ACTION" 180с (человек дозаполняет и жмёт submit), `pollForSuccess` (смена URL / success-сигналы) → статус пишется обратно в `human-queue.json`, скриншоты и логи в `human-submit-out/<slug>/`.

---

## 5. Completed Features

**Работает и проверено:**
- ✅ **AI submission pipeline** — полный цикл PREVIEW и SUBMIT (Brownbook): 44 поля заполнено, 0 ошибок, 66.3с, размещение подтверждено. Отчёт: `docs/production-tests/brownbook-submission-report.md`.
- ✅ **Label-based field mapping** (перемешивание значений между шагами multi-step форм устранено — маппинг по label, а не по селектору).
- ✅ **Template priority** `carryover > template > AI` — значения не перетираются между шагами.
- ✅ **Pre-submit validation** — семантическая проверка критических полей перед отправкой.
- ✅ **Multi-step handler** (до 5 шагов, кнопки Next/Continue, new-tab `target=_blank`), обработка React Select / MUI Autocomplete / readonly-комбобоксов, JS-fallback заполнения.
- ✅ **Search-page handling** (Brownbook: страна/город + Search → Add Business; overlay z-[999] dismissal).
- ✅ **Stealth harness** (`stealth.ts`) — проход Cloudflare в headed-режиме, детект капчи, пауза для ручного решения, persistent профили с cookies (`seoflowai-temp/agent-profiles/`).
- ✅ **IMAP email verification** (`email-verifier.ts`) — ждёт verification link/code; `human-submit --register` авто-регистрируется на `itllect.marketing@gmail.com` и открывает ссылку подтверждения.
- ✅ **Probe-система** — все 75 площадок live-проверены (verdicts: FORM_READY/FORM_LIKELY/LOGIN_REQUIRED/CAPTCHA/CF_BLOCKED/EMPTY/DEAD/NOT_APPLICABLE), результаты в `probe-results.json` + скриншоты `probe-out/`.
- ✅ **Human-assisted workflow** — очередь `human-queue.json`, headed прогоны с окном ручного действия 180с, статусы обновляются в очереди. Последний прогон: **14 площадок отмечены SUCCESS** (см. §7).
- ✅ **Web UI (русский)** — список каталогов с фильтрами/статусами/приоритетами, детальная страница каталога (Start Submission, PREVIEW/SUBMIT, чек-лист, прогресс), кампании, AI-аудит (SEO score, рекомендации, стратегия), генерация контента, данные компании, загрузка Excel-списка.
- ✅ **Excel-импорт** — умный парсер `87catalogs.xlsx` (авто-детект header-строк, пропуск секционных заголовков, алиасы колонок) → 75 площадок в БД.
- ✅ **Отчёты** — `final-report-75.md/.csv` (актуальный), `docs/directory-submission-report.md` (клиентский, 30.07).

**Где проверено:** локально (Windows, `npm run dev` + скрипты tsx). NeonDB — free tier. Логи прогонов: `pool-preview-report.md`, `pool-submit/pool-report.md`, `human-submit-run.log`, `stealth-submit-run.log`, `probe-run.log`, `test-*.log`, `*output.log`.

---

## 6. Current Client Task

**Заказ:** разместить компанию ITllect во всех каталогах из списка клиента.
**Источник списка:** `public/87catalogs.xlsx` (лист "87catalogs"; 87 строк, из них **75 реальных площадок**, остальное — заголовки секций).

### Категории каталогов (категории клиента → workflow-типы)
| Категория клиента | Тип | Смысл |
|---|---|---|
| Business Directory | **A** | классический каталог (add business form) |
| Reviews | **B** | claim/создать профиль + верификация email/домена |
| Agency Directory | **C** | агентский маркетплейс (профиль агентства: услуги + описание + портфолио) |
| Portfolio, Tech/Startup, Social, Social/Content, Content | **D** | аккаунт + профиль + публикация контента |
| Government, Partner Program, Aggregator | **E** | ресурс/partner application/manual review (обычно NOT_APPLICABLE для free listing) |

**Распределение по типам (MASTER_LIST):** A — ~24 (business + local/Florida), B — 4 (Trustpilot, Sitejabber, ProvenExpert, G2), C — ~13 (GoodFirms, DesignRush, TopSEOs и др.), D — ~20 (портфолио/соцсети/контент/tech), E — ~14 (government, partner programs, aggregators).

**Полный список 75 площадок** — в `src/lib/directories/MASTER_LIST.ts` (авторитетный источник: name, url, submissionUrl, method, notes, priority) и в таблице §7.

---

## 7. Directory Testing Results

Статусы ниже — из **`human-queue.json`** (актуальный файл состояния очереди, обновляется `human-submit.ts` и `generate-human-queue.ts`). Причины — из probe-вердиктов и фактических прогонов. Обозначения причин: **CF** = Cloudflare challenge, **CAPTCHA** = reCAPTCHA/hCaptcha/Turnstile, **LOGIN** = требуется регистрация/вход, **EMAIL** = email verification, **SPA** = SPA/multi-step, **DEAD** = сайт недоступен (ERR_CONNECTION_RESET/chrome-error), **NOFORM** = формы на найденном URL нет, **NA** = не каталог размещения.

> ⚠️ Статусы SUCCESS в очереди получены в human-assisted сессиях (человек жал submit в headed-браузере). **Перед сдачей клиенту они должны быть проверены** (`verify-registrations.ts`, ручная проверка listingUrl).

### ✅ SUCCESS (14)
| Directory | Type | Status | Reason |
|---|---|---|---|
| Brownbook | A | ✅ SUCCESS | Автоматическое размещение подтверждено (44 поля, 0 ошибок, 66.3с) |
| CityLocalPro | A | ✅ SUCCESS* | Форма 17f заполнена; reCAPTCHA v2 решена человеком в headed-сессии |
| Crunchbase | D | ✅ SUCCESS* | CF в headless; аккаунт создан в headed-сессии |
| DesignRush | C | ✅ SUCCESS* | Регистрация пройдена; профиль агентства заполнен вручную |
| GoodFirms | C | ✅ SUCCESS* | Форма 3f заполнена; CF turnstile решён вручную |
| Manta | A | ✅ SUCCESS* | Claim/add business через headed-сессию |
| Medium | D | ✅ SUCCESS* | Аккаунт + email verify; draft о компании |
| Opendi | A | ✅ SUCCESS* | Форма 9f/4; CF решён в headed-сессии |
| Shopify Partners | E | ✅ SUCCESS* | Partner-аккаунт создан |
| Digital Agency Net | C | ✅ SUCCESS* | Регистрация + add-agency |
| Hotfrog | A | ✅ SUCCESS* | Add business через headed-сессию (CF решён) |
| Plantation Chamber | A | ✅ SUCCESS* | Заявка на членство подана |
| Sitejabber | B | ✅ SUCCESS* | Business account + капча решена |
| YouTube Channel | D | ✅ SUCCESS* | Brand channel создан |

\* — успех зафиксирован human-assisted прогоном (подтвердить до отчёта).

### 🔶 NEEDS_MANUAL (12)
| Directory | Type | Status | Reason |
|---|---|---|---|
| Ft Lauderdale Chamber | A | NEEDS_MANUAL | LOGIN — заявка на членство |
| ProvenExpert | B | NEEDS_MANUAL | LOGIN + EMAIL verify |
| Sortlist | C | NEEDS_MANUAL | CF + SPA multi-step ("become partner") |
| Stripe Partner | E | NEEDS_MANUAL | NOFORM — партнёрская заявка, путь не найден |
| The Manifest | C | NEEDS_MANUAL | NOFORM — homepage search; регистрация |
| Awwwards | D | NEEDS_MANUAL | LOGIN (платная подача сайта) |
| Business2Community | D | NEEDS_MANUAL | Форма 11f/1; кнопка submit появляется после логина |
| HubPages | D | NEEDS_MANUAL | LOGIN + контент |
| Mailchimp Partner | E | NEEDS_MANUAL | LOGIN — partner application |
| Semfirms | C | NEEDS_MANUAL | LOGIN — add company |
| South FL Biz Journal | A | NEEDS_MANUAL | CF; PR-подача (newsroom) |
| Stack Overflow | D | NEEDS_MANUAL | CF; Jobs платные, ре-оценить N/A |

### ⏳ PENDING (1)
| Directory | Type | Status | Reason |
|---|---|---|---|
| SCORE Mentor Network | E | PENDING | FORM_READY: 29 полей — но это не каталог размещения (mentor-заявка) |

### ❌ FAILED (19)
| Directory | Type | Status | Reason |
|---|---|---|---|
| Yellow Pages | A | FAILED | CF blocked (headless); надо headed |
| Agency Spotter | C | FAILED | CF blocked (headless) |
| EZlocal | A | FAILED | CF blocked (headless) |
| Superpages | A | FAILED | CF blocked (headless) |
| Local.com | A | FAILED | DEAD — ERR_CONNECTION_RESET |
| ActiveCampaign | E | FAILED | DEAD — ERR_CONNECTION_RESET |
| G2 | B | FAILED | DEAD — unreachable (chrome-error) |
| Behance | D | FAILED | DEAD — unreachable |
| Upcity | C | FAILED | DEAD — unreachable |
| EzineArticles | D | FAILED | DEAD — unreachable |
| CSS Design Awards | D | FAILED | DEAD — unreachable |
| FL Business Dir | A | FAILED | DEAD — unreachable |
| Bark.com | C | FAILED | SPA multi-step: форма детектится в PREVIEW (35f/4), но не в SUBMIT |
| TopSEOs | C | FAILED | Форма 10f PREVIEW OK; крах профиля при SUBMIT; Drupal `form[name]`-поля; CF при повторе |
| WooCommerce Agency | E | FAILED | NOFORM — селекторы не найдены |
| Dribbble | D | FAILED | LOGIN — регистрация дизайнера |
| Expertise.com | C | FAILED | LOGIN — business application |
| Merchant Circle | A | FAILED | LOGIN — регистрация мерчанта |
| Tumblr | D | FAILED | LOGIN — регистрация |

### ⚪ NOT_APPLICABLE (29)
| Directory | Type | Status | Reason |
|---|---|---|---|
| Alignable | A | NOT_APPLICABLE | Страница join не обнаружена (0f) — перепроверить вручную |
| HubSpot Agency Dir | E | NOT_APPLICABLE | Partner application (manual) |
| Semrush Agency Partners | E | NOT_APPLICABLE | Partner application (manual) |
| Trustpilot | B | NOT_APPLICABLE | Claim через email/домен-верификацию (не форма) |
| AngelList/Wellfound | D | NOT_APPLICABLE | SPA-регистрация, 0f |
| Broward County Chamber | A | NOT_APPLICABLE | Пустая страница заявки |
| Express Update USA | E | NOT_APPLICABLE | Claim через телефон/почту |
| Foursquare Business | E | NOT_APPLICABLE | Claim, phone verify |
| GitHub | D | NOT_APPLICABLE | Аккаунт + org (не каталог) |
| n49 | A | NOT_APPLICABLE | 403 без stealth; перепроверить |
| Neustar Localeze | E | NOT_APPLICABLE | Enterprise data feed |
| Nextdoor Business | A | NOT_APPLICABLE | Business signup + postcard verify |
| Pinterest Business | D | NOT_APPLICABLE | Business account (0f) |
| ProductHunt | D | NOT_APPLICABLE | Launch-флоу, аккаунт |
| Quora | D | NOT_APPLICABLE | Аккаунт + Space (0f) |
| Twitter / X | D | NOT_APPLICABLE | Аккаунт + phone verify |
| Webflow Partner | E | NOT_APPLICABLE | Partner application |
| Broward County Biz | A | NOT_APPLICABLE | Городской ресурс (1f) |
| City of Plantation | A | NOT_APPLICABLE | Муниципальный ресурс |
| Data Axle | E | NOT_APPLICABLE | Enterprise/partner data |
| Find Best SEO | C | NOT_APPLICABLE | Rankings directory, 0f |
| FL DEO Business | E | NOT_APPLICABLE | Гос. портал ресурсов |
| FL SBDC Network | A | NOT_APPLICABLE | Request advising (3f) — не listing |
| Influencer Mkt Hub | C | NOT_APPLICABLE | Homepage = Mailchimp subscribe |
| Miami Chamber | A | NOT_APPLICABLE | Membership manual |
| SBA.gov Business | E | NOT_APPLICABLE | Гос. ресурс |
| SiteInspire | D | NOT_APPLICABLE | Editorial gallery |
| SlideShare | D | NOT_APPLICABLE | LinkedIn bridge |
| Spoke | D | NOT_APPLICABLE | Платформа сменила нишу |

**Сводка:** SUCCESS 14 · NEEDS_MANUAL 12 · PENDING 1 · FAILED 19 · NOT_APPLICABLE 29 (всего 75).

---

## 8. Current Automation Limitations

1. **Универсальный runner не подходит для части сайтов.** SPA с клиентским роутингом (Sortlist, Bark.com), кастомные многошаговые флоу (DesignRush), Drupal-формы с `form[name]` (TopSEOs), MUI Autocomplete с серверным поиском — требуют site-specific адаптеров.
2. **Нужны site-specific adapters.** Для TopSEOs (известные селекторы полей — есть `getKnownFields` в `stealth-submit.ts`), Bark.com (SPA-навигация), DesignRush (шаг регистрации → профиль → услуги → портфолио), CityLocalPro (капча + логин). Сейчас таких адаптеров как отдельных модулей нет — логика инлайн в скриптах.
3. **Cloudflare / CAPTCHA требует человека.** Политика проекта: НЕ использовать 2captcha, НЕ обходить защиты. Работает только headed-режим с ручным решением (180с окно) — это bottleneck для масштабирования.
4. **Email verification.** Возможна только для почты, к которой есть IMAP-доступ (сейчас `itllect.marketing@gmail.com`, нужен app-password в `.env`). Многие платформы шлют письма на `info@itllect.com` (нет IMAP-доступа). Телефон-верификация (Twitter/X, Nextdoor, Foursquare) — полностью ручная.
5. **Detect логина на лендинге сбивает прогоны.** Формы с password-полем и keyword "sign in" в тексте (даже если это форма размещения) → ранний FAILED "Требуется авторизация".
6. **Нестабильность сети/сайтов.** 6 площадок DEAD (ERR_CONNECTION_RESET/chrome-error), часть может быть снова доступна — нужно re-probe.
7. **Статусы в human-queue.json не всегда отражают верифицированные размещения** — часть SUCCESS получена в сессиях с человеком и требует подтверждения (listingUrl).
8. **NeonDB free tier** — suspend через ~5 мин, wake-up 10–30с замедляет API/jobs.
9. **Диск ограничен (~4GB)** — не копить скриншоты в корне репо.
10. **Нет CI/тестов** — все проверки ручные через скрипты.

---

## 9. Existing Test Data

**Компания (в коде):** ITllect — *прим.: в брифе запроса фигурирует "ITllect GmbH", в коде везде "ITllect Consulting Inc." — сверить с клиентом перед финальным отчётом.*

Константа `COMPANY_DATA` (дублируется в `stealth-submit.ts`, `submit-pool.ts`, `human-submit.ts`, `batch-business-directories.ts`; в БД — модель `Company`):

| Поле | Значение |
|---|---|
| name | ITllect |
| legalName | ITllect Consulting Inc. |
| website | https://itllect.com |
| email | info@itllect.com |
| phone | (123) 636-4087 |
| address | 100 N University Dr |
| city | Coral Springs |
| state | FL |
| zip | 33071 |
| country | US |
| description | ITllect is a technology consulting firm specializing in AI, cloud infrastructure, and digital transformation solutions for enterprise clients. |
| services | AI Consulting, Cloud Infrastructure, Digital Transformation, Enterprise IT Solutions, Web Design & Development, SEO & Digital Marketing |
| keywords | AI consulting, cloud infrastructure, digital transformation, technology consulting, enterprise IT, SEO, digital marketing, web design |
| category | Digital Marketing Agency (в batch-скрипте: Technology Consulting) |
| logo | `temp-logo.png` (в корне) |

**Registration email (для авто-регистрации):** `itllect.marketing@gmail.com` (константа `REGISTRATION_EMAIL` в `human-submit.ts`; IMAP credentials — в `.env`).

**Company ID в БД:** (internal, redacted). Кампания: Q3 2026.

---

## 10. Email / Registration Flow

**Что нужно для регистрации:**
- Email с доступом к IMAP (`EMAIL_USER/EMAIL_PASS` в `.env`) — сейчас настроен на `itllect.marketing@gmail.com` (Gmail app-password).
- `email-verifier.ts`: `waitForVerificationLink(senderPattern, subjectPattern, timeout)` — poll INBOX каждые 5с, ищет URL по отправителю/теме (`verify|confirm|activate|welcome`), возвращает первую ссылку; `waitForVerificationCode` — 4–8-значный код.

**Варианты:**
1. **Авто-регистрация** — `npx tsx scripts/human-submit.ts --run --register`: headed браузер → stealth → форма → email-поля перезаписываются на `itllect.marketing@gmail.com` (`overrideEmailToRegistration`) → клик "Sign Up/Register" → ожидание письма (120с) → переход по ссылке → повторное заполнение профиля. Работает, если площадка: (а) открыта, (б) не требует CF/капчу для регистрации, (в) шлёт письмо на Gmail.
2. **Ручной режим** — `human-submit.ts --run` без `--register`: человек решает капчу/CF (до 180с) и сам жмёт submit в окне "HUMAN ACTION" (180с).
3. **Обычный SUBMIT-пайплайн** (`submit-pool.ts --submit` / `stealth-submit.ts`): форма заполняется и отправляется без регистрации — подходит только для guest-форм (Brownbook, GoodFirms contact form).

**Где требуется ручное вмешательство:**
- reCAPTCHA v2/v3, hCaptcha, Turnstile (CityLocalPro, GoodFirms, Sitejabber, Opendi);
- Cloudflare "Just a moment" в headless (Crunchbase, Yellow Pages, Sortlist и др. — в headed-stealth обычно проходится автоматически, но может требовать ручного confirm);
- phone verification (Twitter/X, Nextdoor, Foursquare, Yext);
- postcard/домен-верификация claim'ов (Nextdoor, Express Update USA);
- partner-заявки с ручным ревью (Stripe, Mailchimp, Webflow, HubSpot, Semrush, WooCommerce);
- платные подачи (Awwwards, CSS Design Awards).

---

## 11. Recommended Next Strategy

**Приоритет: максимальное количество размещений.** План:

1. **Автоматизация простых каталогов (сейчас).**
   - Взять пул FORM_READY/FORM_LIKELY из `probe-results.json` (6 + 7 площадок), прогнать `submit-pool.ts --submit` по всем, кроме уже SUBMIT'нутых; для каждой площадки — сначала `--only <name>` в PREVIEW и глазами по скриншоту, затем SUBMIT.
   - Кандидаты с guest-формами: Brownbook (готов), Opendi, GoodFirms (contact form — проверить, является ли это размещением), TopSEOs (через адаптер с `form[name]`-селекторами), Business2Community (после регистрации).
2. **Site-specific адаптеры.** Вынести из `stealth-submit.ts` паттерн `getKnownFields` в модуль `src/lib/adapters/<platform>.ts` и написать адаптеры для: TopSEOs (Drupal), Bark.com (SPA-шаги), DesignRush (multi-step с регистрацией), CityLocalPro (регистрация + капча + submit), Sortlist (SPA). Каждый адаптер — функция `fillAndSubmit(page, companyData)` поверх stealth.
3. **Email-assisted registration.** Прогнать `human-submit.ts --run --register --priority 1-2` по NEEDS_MANUAL с action "login + register" (Ft Lauderdale Chamber, ProvenExpert, HubPages, Semfirms, Awwwards, Dribbble, Tumblr, Merchant Circle, Expertise.com). Проверить, что `EMAIL_USER/PASS` валидны.
4. **Human-assisted workflow.** Оставшиеся NEEDS_MANUAL (CF/капча/партнёрки) — сессии `human-submit.ts --run` с человеком: Sortlist, Stripe Partner, The Manifest, Mailchimp Partner, South FL Biz Journal, Stack Overflow, Business2Community, YouTube (если не сделано). Приоритет: сначала HIGH-приоритетные.
5. **Re-probe и реанимация FAILED.** `probe-master.ts --force` по DEAD/CF_BLOCKED (могла вернуться доступность); Yellow Pages/Manta/Superpages/EZlocal — только headed stealth; заменить заведомо мёртвые (Local.com, ActiveCampaign, G2, Behance, Upcity, EzineArticles, CSS Design Awards, FL Business Dir) на каталоги-заменители из `batch-business-directories.ts` (Tupalo, Yalwa, ShowMeLocal, BizHwy, YellowBot, MojoPages, Naymz, Cylex) — **согласовать замены с клиентом**.
6. **Верификация.** Перед отчётом проверить все 14 SUCCESS из очереди: `verify-registrations.ts` + ручная проверка listingUrl каждого (аккаунт жив, листинг опубликован). Зафиксировать listingUrl в `Submission`-модели.
7. **Отчёт клиенту.** Перегенерировать `final-report-75.md/.csv` (`generate-final-report.ts` — учесть обновления очереди; возможно добавить колонку listingUrl), обновить `docs/directory-submission-report.md`, добавить рекомендации по заменам.

**Правила (не нарушать):** не использовать 2captcha/CF-bypass/stealth-обход капчи; не удалять миграции БД; статус NEEDS_MANUAL лучше, чем рискованный SUBMIT; каждый SUBMIT-прогон — через PREVIEW-проверку; для изменений БД — инкрементальные миграции.

---

## 12. Files Changed Recently

**Последний коммит:** `52d54ea` (30.07.2026) — "feat: directory submission automation + client report" (см. `git log`).

**Незакоммиченные изменения (working tree, актуальны):**
| Файл | Что изменилось |
|---|---|
| `src/lib/automation/submission-runner.ts` | +356 строк: search-page handling, overlay dismissal (Brownbook), select-handler (MUI/react-select), validateBeforeSubmit, final form analysis, captcha→NEEDS_MANUAL логика |
| `src/lib/automation/form-analyzer.ts` | +78: детект Cloudflare challenge (guard totalFields≤1), детект captcha-виджетов/iframe |
| `src/lib/automation/field-mapper.ts` | +184: rule-based mapping (LABEL_RULES, COUNTRY_NAMES, strict social), AI index-keys, fallback |
| `src/lib/automation/browser.ts` | viewport 1280×800, Chrome UA, `domcontentloaded` + 2s wait |
| `package.json` / `package-lock.json` | +`dotenv`, +`imapflow` (IMAP email verification) |

**Новые файлы (untracked):** `src/lib/automation/email-verifier.ts`, `src/lib/automation/stealth.ts`, `src/lib/directories/MASTER_LIST.ts`; скрипты: `probe-master.ts`, `stealth-submit.ts`, `submit-pool.ts`, `human-submit.ts`, `verify-registrations.ts`, `generate-final-report.ts`, `generate-human-queue.ts`, `batch-business-directories.ts`, `diagnose-directories.ts`, `check-urls.ts`, `discover-directories.ts`, `quick-single-test.ts`, `test-*` (множество тестовых). Артефакты: `probe-results.json`, `probe-out/`, `human-queue.json`, `human-submit-out/`, `stealth-submit-out/`, `pool-submit/`, `pool-preview/`, `final-report-75.{md,csv}`, `directory_test_results.json`, `classification-results.csv`, `seoflowai-temp/agent-profiles/`, `dist/`, многочисленные скриншоты `*.png` в корне, логи `*.log`.

> Перед работой: `git status` (в репо есть untracked-артефакты и 4 изменённых файла). По соглашению команды — не коммитить без явной просьбы.

---

## 13. How to Run

```bash
# Установка
npm install
npx prisma generate          # после любых изменений schema (Prisma v7, generator "prisma-client")

# Web-приложение (UI)
npm run dev                  # http://localhost:3000

# Worker (обработка AutomationJob из UI)
npm run submission-agent            # polling, раз в 10с
npm run submission-agent:once       # one-shot

# Сборка / линт
npm run build
npm run lint

# Диагностика / пробы
npx tsx scripts/probe-master.ts                       # все 75 (stealth, headed)
npx tsx scripts/probe-master.ts --headless --force --only CityLocalPro
npx tsx scripts/verify-registrations.ts               # проверка ключевых площадок
npx tsx scripts/check-urls.ts                         # проверка URL из очереди

# Preview / Submit прогоны
npx tsx scripts/submit-pool.ts                        # PREVIEW всех SUCCESS_CANDIDATE
npx tsx scripts/submit-pool.ts --submit --only GoodFirms
npx tsx scripts/stealth-submit.ts --only GoodFirms,TopSEOs
npx tsx scripts/batch-business-directories.ts         # каталоги-заменители

# Human-assisted (headed, нужен человек)
npx tsx scripts/human-submit.ts --queue               # показать очередь
npx tsx scripts/human-submit.ts --run                 # ручной режим (180с окно)
npx tsx scripts/human-submit.ts --run --register      # + авто-регистрация через IMAP
npx tsx scripts/human-submit.ts --run --register --only GoodFirms,TopSEOs --priority 1

# Отчёты
npx tsx scripts/generate-human-queue.ts               # перегенерировать human-queue.json
npx tsx scripts/generate-final-report.ts              # final-report-75.md/.csv
```

**Скриншоты:** PREVIEW/SUBMIT пишутся в `test-output-<id>.png` (worker) или `<out-dir>/<slug>-*.png` (скрипты). Логи каждого прогона — `*.log` в корне и `human-submit-out/<slug>/human-submit.log`.

---

## 14. Known Issues / Open Tasks

**Баги и блокеры:**
1. **TopSEOs** — SUBMIT крашит профиль браузера; Drupal `form[name]`-поля; CF на повторе. Нужен адаптер.
2. **Bark.com** — SPA-форма детектится в PREVIEW (35f/4), но не в SUBMIT — race/тайминг.
3. **GoodFirms** — CF turnstile на `/get-listed` блокирует SUBMIT после успешного PREVIEW.
4. **CityLocalPro** — регистрация + reCAPTCHA v2 — только человек.
5. **Ложные "Требуется авторизация"** — `detectLoginRequired` срабатывает на лендингах с любым password-полем + словом "sign in".
6. **`automationMode` gate** — `POST /api/submission/start` требует `automationMode === "AI_ASSISTED"` и статус IN_PROGRESS/READY; default в БД "MANUAL" — при создании Directory через UI/API не забывать выставлять режим, иначе кнопка не работает.
7. **human-queue.json рассинхронизирован с последним логом** (последний прогон в логе: SUCCESS 14 / NM 14 / FAILED 18 / NA 29; в JSON: 14/12/19/29 + PENDING 1) — перед отчётом перегенерировать и/или обновить статусы по фактам.
8. **Statuses SUCCESS требуют верификации** (см. §7, §11.6) — listingUrl пока не фиксируются в БД.
9. **DEAD-сайты** (6+): часть может быть временно недоступна — re-probe перед списанием.
10. **`nul`-файл в корне** — артефакт Windows (перенаправление вывода), можно удалить.
11. **NeonDB suspend** — перед прогонами учитывать wake-up 10–30с.
12. **Диск ~4GB** — не накапливать скриншоты/логи в репо (выносить в `seoflowai-temp/` или удалять).

**Open tasks:**
- [ ] Site-specific адаптеры (TopSEOs, Bark, DesignRush, CityLocalPro, Sortlist) — вынести из скриптов в `src/lib/adapters/`.
- [ ] Re-probe FAILED/DEAD + подтверждение доступности перед заменой.
- [ ] Верификация 14 SUCCESS-площадок и фиксация listingUrl.
- [ ] Согласование с клиентом замен (заменители: Tupalo, Yalwa, ShowMeLocal, BizHwy, YellowBot, MojoPages, Naymz, Cylex и др.).
- [ ] Финальный клиентский отчёт (обновить `docs/directory-submission-report.md`).
- [ ] Проверить ITllect GmbH vs ITllect Consulting Inc. (наименование компании в брифе клиента).
- [ ] (Опционально) git: закоммитить текущие изменения автоматизации + скрипты, добавить untracked-артефакты в `.gitignore`.

---

*Конец документа. Для быстрого старта: прочитайте `src/lib/directories/MASTER_LIST.ts`, `src/lib/automation/submission-runner.ts` и `scripts/human-submit.ts`, затем `npm run dev` + `npm run submission-agent:once`, актуальное состояние — в `human-queue.json` и `probe-results.json`.*
