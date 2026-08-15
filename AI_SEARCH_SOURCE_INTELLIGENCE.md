# AI Search — Source Intelligence (Phase 2)

> Дата: 14 августа 2026 г. Кейс: АО НВП «Болид», run #2 (web_search, perplexity/sonar).

## Что это

Source Intelligence — слой, который честно фиксирует, какие источники реально были обнаружены в ответах AI, без выдумывания citations и без превращения отсутствия данных в выводы.

Цепочка: OBSERVE → EVIDENCE → DIAGNOSE → ACTION → VERIFY.

## Как устроено

### 1. Provider capability model
- `supportsWebSearch`, `supportsCitations`, `supportsStructuredOutput`, `supportsUsage` — детерминированная оценка на `src/lib/automation/ai-client.ts`.
- Search-capable провайдер: `search` = `perplexity/sonar` на существующем OpenRouter ключе (без изменения .env; OPENAI_SEARCH_MODEL для переопределения).
- `gpt-4o-mini` / `deepseek-v4-flash` — НЕ search-capable: не симулируются.

### 2. Citation capture
- Только если провайдер реально вернул citations (`message.annotations` у perplexity).
- Модель: `{ url, domain, title, sourceType, citationText }`. Поле недоступно — null.
- raw response сохраняется всегда и не изменяется.

### 3. Rule-based source normalization
- Классификация доменов: official / competitor / industry / documentation / review / community / media / other.
- Правила приоритетны; LLM-метки не источник истины.
- Примеры: bolid.ru → official; perco.ru → competitor; reddit.com → community; habr.com → community; rusprofile.ru → industry; companies.rbc.ru → media.

### 4. Source Gap
- Формулировка: «No bolid.ru citations were detected in this audit (0/34)» — не «AI не использует bolid.ru».
- Отсутствие citations при провайдере без source support → «Source data unavailable from this provider».

## Реальные результаты run #2 (34 промпта, web_search)

| Показатель | Значение |
|---|---|
| Ответов с citations | 35.3% (12 из 34) |
| Всего упоминаний источников | 277 |
| Уникальных доменов | 157 |
| Официальные (bolid.ru, *.bolid.ru) | 21 |
| Конкуренты (perco.*, sigur.com, rubezh.*, …) | 10 |
| Отраслевые (реестры/каталоги) | 55 |
| Сообщества (habr, cyclowiki, reddit, форумы) | 20 |
| СМИ (rbc, tadviser, kp.ru, …) | 12 |
| Документация | 2 |
| Прочее (не классифицировано) | 157 |

Топ источников: bolid.ru (19), rusprofile.ru (9), cyclowiki.org (9), kontragent.vbr.ru (8), t-save.ru (8), companies.rbc.ru (7), habr.com (6), stroimprosto.mos.ru (6), unitest.ru (5), model.rubytech.ru (5), unitrex.ru (5).

**Source Gap по официальному домену: НЕ подтверждён в run #2** — bolid.ru обнаружен в 22 упоминаниях (в baseline chat-режиме citations отсутствовали полностью → source data unavailable, что не являлось доказательством отсутствия влияния сайта).

## Ограничения

- Классификация «other» (157) — правила не покрывают все домены; это честное «не знаю», а не ошибка.
- Citations фиксируются только у search-провайдеров; результаты провайдеров не смешиваются между runs.
- Никаких утверждений о причинности между источниками и метриками.
- Срез 34 промптов одного запуска, не рынок.

## Verification

- Повторный web_search-запуск того же prompt set создаст сравнимый run (runId, timestamp, promptSetVersion фиксируются).
- Сравнение некорректно при изменении prompt set → UI предупреждает.
