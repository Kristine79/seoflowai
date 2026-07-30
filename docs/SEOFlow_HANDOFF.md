# SEOFlow AI — Directory Submission Handoff

> **Дата:** 30 июля 2026  
> **Проект:** SEOFlow AI — автоматизация размещения компании ITllect в каталогах  
> **Клиент:** ITllect (https://itllect.com)  
> **Компания ID:** `cms3o7jwj0000ssutcych75pi`  
> **Кампания:** Q3 2026  

---

## 1. Цель проекта

SEOFlow AI используется для выполнения заказа клиента по размещению сайта ITllect в каталогах.

**Задача:** автоматизировать процесс заполнения форм и отправки данных компании в 75+ каталогов из списка клиента.

**Данные компании (ITllect):**
- Name: ITllect
- Email: info@itllect.com
- Phone: (123) 636-4087
- Address: 100 N University Dr, Coral Springs, FL 33071, US
- Website: https://itllect.com
- Description: ITllect is a technology consulting firm specializing in AI, cloud infrastructure, and digital transformation solutions for enterprise clients.

---

## 2. Что уже реализовано

### AI Submission Pipeline
- `src/lib/automation/submission-runner.ts` (~1500 строк) — основной движок автоматизации
- Playwright headless browser для навигации и заполнения форм
- AI-powered field mapping (OpenRouter → gpt-4o-mini)

### Playwright Automation
- `src/lib/automation/field-filler.ts` — заполнение полей формы
- `src/lib/automation/form-detector.ts` — обнаружение форм на странице
- `src/lib/automation/submit-detector.ts` — обнаружение кнопки отправки
- `src/lib/automation/multi-step-handler.ts` — обработка многошаговых форм
- `src/lib/automation/react-select-handler.ts` — обработка React Select и MUI Autocomplete

### Label-based Field Mapping
**Проблема:** селекторы полей меняются между шагами многошаговых форм (например, `#_r_t_` → `#_r_1v_`), что приводит к перепутанным значениям.

**Решение:** маппинг по label полей — label остаётся стабильным между шагами, что обеспечивает корректное заполнение (address→address, email→email, и т.д.).

Реализовано в `processFormStep` в `submission-runner.ts`.

### Template Priority
**Проблема:** template values перезаписывали carryover values между шагами.

**Решение:** приоритет `carryover > template > AI` — значения, перенесённые с предыдущего шага, имеют высший приоритет.

### Pre-submit Validation
`validateBeforeSubmit` — семантическая валидация критических полей (name, address, city, phone, email, website) перед отправкой.

### AutomationJob
- `src/lib/automation/job-runner.ts` — управление задачами автоматизации
- Job status tracking: PENDING → RUNNING → COMPLETED / FAILED
- Скриншоты на каждом этапе

### Reports
- `docs/production-tests/brownbook-submission-report.md` — отчёт по Brownbook
- `docs/directory-submission-report.md` — полный отчёт по 75 каталогам

---

## 3. Первый успешный кейс: Brownbook

**URL:** https://www.brownbook.net/add-business

### Результат
| Метрика | Значение |
|---------|----------|
| Полей заполнено | 44 |
| Ошибок | 0 |
| Время | 66.3с |
| Email verification | Не требуется |
| Статус | ✅ SUCCESS |

### Проблемы, которые были решены
1. **Scrambled values** — address получал city, email получал website → решено label-based mapping
2. **Template overwriting carryover** — template перезаписывал перенесённые значения → решено приоритетом carryover > template > AI
3. **Multi-step form navigation** — форма из 3+ шагов → решено multi-step handler
4. **React Select fields** — кастомные dropdown компоненты → решено react-select-handler

### Файлы
- `scripts/test-brownbook-preview.ts` — Preview тест
- `scripts/test-brownbook-submit.ts` — Submit тест (успешный)
- `docs/production-tests/brownbook-submission-report.md` — полный отчёт

---

## 4. Текущий статус списка каталогов

**Всего:** 75 уникальных каталогов в БД (NeonDB PostgreSQL)

### Классификация

| Статус | Кол-во | Описание |
|--------|--------|----------|
| ✅ **SUCCESS** | 1 | Brownbook — размещено полностью |
| 🔶 **NEEDS_MANUAL** | 28 | Форма есть, но нужна ручная работа |
| ❌ **FAILED** | 13 | Cloudflare / сайт не работает |
| ⚪ **NOT_APPLICABLE** | 33 | Не каталоги размещения |

### NEEDS_MANUAL (28) — разбивка

**reCAPTCHA / Cloudflare (3):**
- CityLocalPro — 13 полей заполнены, reCAPTCHA v2 блокирует
- DesignRush — регистрация успешна, Cloudflare после
- TopSEOs — 13 полей формы, требуется регистрация

**Требуется регистрация (16):**
SBA.gov, HubSpot, Envato, Smashing Magazine, BuiltWith, Moz, Bark.com, Behance, Dribbble, Medium, Quora, Alignable, Nextdoor, Express Update USA, Neustar Localeze, Foursquare

**Partner program (9):**
ActiveCampaign, SimilarWeb, Yext, Birdeye, Stripe, Shopify, Webflow, Mailchimp, WooCommerce

### FAILED (13)
- Cloudflare (7): Yellow Pages, Manta, Superpages, EZlocal, Stack Overflow, ThemeForest, Data Axle
- Сайт не работает (6): EzineArticles, Semfirms, Digital Agency Network, SCORE, Plantation Chamber, Freepik

### NOT_APPLICABLE (33)
- Поисковые/подписочные формы (14): GoodFirms, Opendi, Hotfrog, Merchant Circle, Local.com, Trustpilot, Sitejabber, и др.
- Формы подписки (5): ProvenExpert, Crunchbase, ProductHunt, Influencer Marketing Hub, CSS-Tricks
- Новостные/контент сайты (6): Business2Community, G2, HubPages, и др.
- Конкурсы дизайна (3): Awwwards, CSS Design Awards, SiteInspire
- Прочее (5): Sortlist, n49, WPBeginner, GitHub, FL Business Dir

---

## 5. Следующая стратегия

### Приоритизация по типам каталогов

**Приоритет 1 — Классические business directories (NEEDS_MANUAL):**
1. CityLocalPro — форма готова, только captcha
2. TopSEOs — форма готова, только регистрация
3. DesignRush — регистрация пройдена, нужно заполнить профиль

**Приоритет 2 — Agency directories:**
- Те, что имеют реальные формы размещения (не поисковые)

**Приоритет 3 — Partner programs:**
- Ручные заявки через формы partner application

**Приоритет 4 — Review/content platforms:**
- Требуют создания контента, не просто заполнения формы

### Что НЕ делать
- НЕ интегрировать 2captcha или другие captcha-solving сервисы
- НЕ использовать Cloudflare bypass
- НЕ использовать stealth browser
- НЕ обходить защиты сайтов

### Подход
1. Для NEEDS_MANUAL с captcha — отметить как требует ручного вмешательства
2. Для NEEDS_MANUAL с регистрацией — автоматизировать регистрацию, но не email verification
3. Для FAILED — предложить замену каталогов
4. Для NOT_APPLICABLE — удалить из списка, предложить замену

---

## 6. Текущие задачи

### Что делать дальше

1. **Создать клиентский отчёт** (в процессе)
   - Файл: `docs/directory-submission-report.md` — готов
   - Добавить рекомендации по замене каталогов

2. **Обработать NEEDS_MANUAL каталоги**
   - CityLocalPro: форма готова, captcha блокирует → отметить для ручной обработки
   - DesignRush: регистрация успешна → проверить следующий шаг (заполнение профиля)
   - TopSEOs: форма есть → попробовать регистрацию

3. **Заменить NOT_APPLICABLE каталоги**
   - 33 каталога не являются площадками размещения
   - Предложить клиенту замену на рабочие business directories

4. **Заменить FAILED каталоги**
   - 13 каталогов недоступны
   - Предложить замену

### Важные файлы

| Файл | Описание |
|------|----------|
| `src/lib/automation/submission-runner.ts` | Основной движок автоматизации (~1500 строк) |
| `src/lib/automation/field-filler.ts` | Заполнение полей формы |
| `src/lib/automation/form-detector.ts` | Обнаружение форм |
| `src/lib/automation/multi-step-handler.ts` | Многошаговые формы |
| `src/lib/automation/react-select-handler.ts` | React Select / MUI Autocomplete |
| `src/lib/automation/job-runner.ts` | Управление задачами |
| `scripts/test-brownbook-submit.ts` | Успешный тест Brownbook |
| `scripts/preview-citylocalpro2.ts` | Тест CityLocalPro |
| `scripts/test-designrush.ts` | Тест DesignRush |
| `scripts/final-report-complete.ts` | Генерация финального отчёта |
| `docs/directory-submission-report.md` | Клиентский отчёт |
| `final-directory-report.txt` | Полная таблица 75 каталогов |

### Команды запуска

```bash
# Preview для каталога
npx tsx scripts/preview-<platform>.ts

# Submit для каталога
npx tsx scripts/test-<platform>.ts

# Генерация отчёта
npx tsx scripts/final-report-complete.ts

# Проверка каталогов (batch)
npx tsx scripts/check-batch1.ts
npx tsx scripts/check-batch2.ts

# Полный запуск submission pipeline
# (через UI или API — см. src/app/api/automation/)
```

### База данных
- **NeonDB PostgreSQL** (free tier)
- **Connection:** `DATABASE_URL` в `.env`
- **Важно:** NeonDB free tier suspend после 5 мин неактивности, wake-up занимает 10-30с
- **Prisma:** `npx prisma generate` после изменений schema

### Скриншоты
Все скриншоты тестов в корне проекта:
- `preview_*.png` — скриншоты preview
- `citylocalpro-*.png` — скриншоты CityLocalPro
- `designrush-*.png` — скриншоты DesignRush

---

## 7. Архитектура проекта

```
src/
  lib/automation/
    submission-runner.ts    # Главный orchestrator
    field-filler.ts         # Заполнение полей
    form-detector.ts        # Поиск форм
    submit-detector.ts      # Поиск кнопки submit
    multi-step-handler.ts   # Многошаговые формы
    react-select-handler.ts # React Select / MUI
    job-runner.ts           # Job management
  app/api/automation/       # API endpoints
  generated/prisma/         # Prisma client

scripts/                    # Тестовые скрипты
docs/                       # Документация и отчёты
```

---

## 8. Git

**Branch:** main  
**Последний коммит:** см. `git log -1`  
**Важно:** перед началом работы проверить `git status` и `git log`

---

## 9. Заметки для AI-кодера

1. **Не создавай новые фичи** если не блокирует текущую задачу
2. **Используй существующие паттерны** — label-based mapping, template priority
3. **Не обходи защиты** — captcha, Cloudflare, login walls требуют ручной работы
4. **Проверяй через Preview** перед Submit для каждого каталога
5. **Сохраняй отчёты** в `docs/production-tests/`
6. **NeonDB может быть в suspend** — подожди 15-30с для wake-up
7. **Disk space ограничен** (~4GB free) — не создавай большие файлы
