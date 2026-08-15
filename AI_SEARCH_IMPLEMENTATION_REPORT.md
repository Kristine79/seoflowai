# AI Search Intelligence — Implementation Report

> Дата: 14 августа 2026 г. Статус: Phase 2 (Source Intelligence) и Phase 3 (Positioning Intelligence + Verification Loop) завершены, Bolid провалидирован.

## 0. Phase 3 — что добавлено

1. **Positioning / Phrase Intelligence** (`src/lib/ai-search/positioning.ts`):
   - LLM-извлечение structured positioning из каждого raw response (только то, что реально присутствует; пустые поля = `[]`): brandDescriptions, productAssociations, categoryAssociations, useCases, valuePropositions, differentiators, recurringPhrases, adjectives, technicalTerms, buyerCriteria.
   - Частотная агрегация (phrase / count / % / prompts).
   - Brand positioning, competitor positioning (Observed AI positioning), Brand vs Competitors таблица, positioning gaps («Product association was not observed in this prompt set»).
   - Извлечение выполняется при run + backfill для старых runs (реальные LLM-запросы по сохранённым raw responses, ничего не симулируется).
2. **Action → Verification loop**:
   - Action status SUGGESTED → PLANNED → DONE (декларация пользователя: note, implementedDate, affectedUrl). API: `[id]/actions` POST.
   - «Run verification» в Overview: тот же prompt set / mode / promptSetVersion/hash, новый AiSearchRun, старые ответы immutable.
   - Run comparison (`[id]/compare`): метрики, intent-level по 10 категориям, источники (new/disappeared/repeated + official/competitor/industry), positioning (new/removed/increased/decreased phrases).
   - Вся терминология — «Observed change», без причинности.
3. **UI**: вкладки Positioning и Runs (выбор двух runs + полное сравнение); Actions получил status-workflow; Overview — кнопка Run verification.
4. **Отчёт**: секции 9.5 AI Positioning, 9.6 Competitor Positioning, 9.7 Positioning Gaps, 14.5 Verification Run (только при наличии verification run; иначе «Verification not yet available»).

## 0.1 Validation — Phase 3 Bolid

- Positioning извлечено для **68/68** ответов (runs #1+#2, реальные LLM-запросы).
- AI Positioning (run #2): категории — системы безопасности, автоматизация, диспетчеризация, контроль доступа; продукты — СКУД (7), пожарная сигнализация (5), видеонаблюдение (4), контроллеры (3); use cases — контроль доступа, интеграция, охрана объектов; технические — СКУД (9), ОКВЭД (4), ONVIF, RTSP; критерии покупателя — цена, интеграции, масштабируемость, лицензирование.
- Competitor positioning: PERCo (8 упоминаний), Sigur (7), RusGuard (7), Parsec (6), RUBEZH (4).
- Positioning gap (run #2): «Стрелец-Интеграл» — product association не наблюдалась (честно, 0 упоминаний).
- Run comparison (#1 chat vs #2 web_search): mention 47.1%→67.6% (+20.5 pp), recommendation 5.9%→20.6%, top3 2.9%→20.6%, citation 0%→100%, official source mentions 0→41, competitor source mentions 0→31, industry 0→55, новые домены 157. Positioning: increased — видеонаблюдение 1→7, системы безопасности 2→7, пожарная сигнализация 2→7, контроль доступа 3→8.
  - ВАЖНО: провайдер изменился между runs (#1 gpt-4o-mini chat, #2 perplexity/sonar web_search) — UI показывает предупреждение «Provider/mode изменился», сравнение только как observed change.
- Action workflow: SUGGESTED→PLANNED(+note)→SUGGESTED проверен через API (декларация пользователя, система не проверяет факт изменения).

## 0.2 Validation — Run #3 (verification re-measurement)

Run #3 запущен как verification (тот же prompt set v1, hash совпадает, тот же провайдер perplexity/sonar, web_search): **34/34 SUCCESS, 0 failed**.

| | Run #2 | Run #3 | Observed change |
|---|---|---|---|
| mention | 67.6% | 70.6% | +3 pp |
| recommendation | 20.6% | 17.6% | −3 pp |
| top-3 | 20.6% | 17.6% | −3 pp |
| citation | 100% | 100% | 0 pp |
| official source rate | 7.9% | 7.3% | −0.6 pp |
| competitor-only | 2 | 0 | −2 |
| official source mentions | 41 | 35 | −6 |
| new domains | — | 22 | |
| disappeared domains | — | 16 | |
| repeated domains | — | 141 | |

Intent-level observed changes: USE_CASE 0/3 → **1/3** (+1), ALTERNATIVES 3/4 → 4/4 (+1), BUYER_INTENT 1/3 → 0/3 (−1), остальные стабильны. PROBLEM_SOLUTION и EXPERT_TECHNICAL остаются 0 — observed gap сохраняется (контент не менялся).

Positioning: 25 new phrases, 25 removed, 20 increased, 20 decreased (natural variation, тот же провайдер).

**Методологически важно**: Run #2 vs Run #3 — сравнение на том же провайдере и prompt set (promptSetCompatible=true, providerChanged=false) — это корректный verification. Run #1 vs Run #2 показывает изменение provider → в UI предупреждение и формулировка «observed change» без причинности.

## 1. Что изменилось в Phase 2

Phase 2 довела существующий AI Search Intelligence MVP до source-aware уровня:

1. **Provider capability model** (`src/lib/automation/ai-client.ts`): `AiProviderCapabilities` (supportsWebSearch / supportsCitations / supportsStructuredOutput / supportsUsage), детерминированная оценка возможностей.
2. **Search-capable provider**: выделенный провайдер `search` (`perplexity/sonar` через существующий OpenRouter key, без изменения .env; конфигурация через OPENAI_SEARCH_MODEL при необходимости). Citations реально возвращаются провайдером (`message.annotations`) и сохраняются структурированно: url / domain / title / sourceType / citationText.
3. **Режимы выполнения**: `chat` (baseline, как раньше) и `web_search` (только search-capable провайдеры). Если search-провайдер недоступен — понятная ошибка «Source data unavailable», ничего не симулируется.
4. **Source normalization layer** (`src/lib/ai-search/sources.ts`): rule-based, детерминированная классификация доменов (official / competitor / industry / documentation / review / community / media / other). LLM-метки не источник истины.
5. **Source Intelligence view**: total sources, unique domains, типы источников, per-domain таблица (домен, URL, тип, появления, промпты), блок **Source Gap**.
6. **Run model**: `AiSearchRun` (runId, runNumber, timestamp, mode, providers, promptSetVersion, promptSetHash). Baseline и повторный запуск сравниваются корректно; UI предупреждает «Prompt set changed — direct comparison may be unreliable».
7. **Insights**: Intent gap (бренд не обнаружен в задачных категориях) и Awareness → Recommendation gap (только при наблюдаемом разрыве; формулировки без причинности).
8. **Evidence chain**: Gap → Evidence → Hypothesis (interpretation, явно отделена от фактов) → Recommended action → Target → Why this action → How to verify.
9. **Human review для potential issues**: статусы PENDING_REVIEW / VERIFIED / FALSE_POSITIVE + note. Raw responses immutable.
10. **Отчёт — 16 секций**, включая Methodology, Intent-level Analysis, Source Intelligence, Verification Plan. Исправлена некорректная формулировка «AI опирается на другие источники» → «no sources detected in returned response» / «Source data unavailable from this provider».

## 2. Provider capabilities

| Provider | Model | Web search | Citations | Structured output | Usage |
|---|---|---|---|---|---|
| primary | gpt-4o-mini (OpenRouter) | нет | нет | да | да |
| fallback-2 | deepseek-v4-flash | нет | нет | да | да |
| search | perplexity/sonar (OpenRouter) | **да** | **да** | да | да |

- `perplexity/sonar` возвращает citations в `message.annotations` (url + title + span). Проверено live.
- `gpt-4o-mini` с плагином web на OpenRouter не поддерживает citations и деградирует (проверено: ответ на арабском вместо русского) — поэтому плагин НЕ используется; только выделенный search-провайдер.

## 3. Validation — Bolid re-run (Phase 6)

Тот же prompt set: **34 промпта**, без изменений (promptSetVersion 1, hash `9db15516…` — совпадает с baseline).

| | Baseline (Run #1) | Run #2 (Source-aware) |
|---|---|---|
| runId | cmst4dajf0000sguthxqbbhic | cmst53ezk0000ekut1fuudt52 |
| mode | chat | web_search |
| provider / model | primary (gpt-4o-mini) | search (perplexity/sonar) |
| date | 2026-08-14 | 2026-08-14 |
| execution count | 34 | 34 |
| successful | 34 | 34 |
| failed | 0 | 0 |
| Mention Rate | 47.1% | **67.6%** |
| Recommendation Rate | 5.9% | **20.6%** |
| Top-3 Rate | 2.9% | **20.6%** |
| Citation Rate | 0% | **35.3%** |
| Competitor-only responses | 4 | **2** |
| Source detection | 0 (source data unavailable) | **277 упоминаний, 157 уникальных доменов** |
| Official source mentions (bolid.ru) | 0 | **22** |

Провайдеры в run #2: `search (perplexity/sonar)`. Результаты разных провайдеров не смешиваются в одну метрику — у каждого run свои providers.

## 4. Source Intelligence (реально обнаруженные источники, run #2)

- Всего упоминаний: **277**; уникальных доменов: **157**.
- Официальные (bolid.ru и поддомены: antares.bolid.ru, partners.bolid.ru): **21** упоминание.
- Конкуренты (perco.ru, perco.com, sigur.com, perco-russia.ru, products.rubezh.ru и др.): **10**.
- Отраслевые (rusprofile.ru, vbr.ru, unitest.ru, unitrex.ru, rubytech, t-save.ru, tbank.ru и др.): **55**.
- Сообщества (habr.com, cyclowiki.org, reddit.com, форумы): **20**.
- СМИ (companies.rbc.ru, tadviser.ru, kp.ru): **12**.
- Документация: **2**. Прочее: **157** (не классифицировано правилами — честно «other»).
- **Source Gap**: No bolid.ru citations were detected → НЕ подтвердился в run #2: официальный домен обнаружен в 22 упоминаниях (базовый прогон не давал citations вообще — source data unavailable).

Формулировки везде: «citations with bolid.ru were detected» — не «bolid.ru используется/не используется AI».

## 5. Intent gap (Phase 7)

Observed visibility pattern run #2: Brand 100%, Product 100%, Comparison 100% — но:
- Use Case: 3 промптов, **0** упоминаний бренда (упомянут конкурент RUBEZH)
- Problem / Solution: 3 промптов, **0** упоминаний бренда
- Expert / Technical: 2 промптов, **0** упоминаний бренда
- Buyer Intent: 3 промптов, 1 упоминание (33.3%)

Сформулировано как «observed gap» + «potential content/information opportunity», без установления причины. Evidence: категория, число промптов, число упоминаний, присутствие конкурентов.

## 6. Awareness → Recommendation gap (Phase 8)

Mention 67.6% vs Recommendation 20.6% в run #2 — разрыв в рамках порога (mention ≥ 30%, recommendation < 10%) НЕ достигнут, поэтому insight не эмитируется (честно). В baseline (47.1% vs 5.9%) порог выполнялся бы, но insight показывается для выбранного run; оба значения отображаются в Run history.

## 7. Human review (Phase 11)

- Run #1 обнаружил потенциальное утверждение: «у меня нет конкретной информации о компании с названием Sigur» → статус **PENDING_REVIEW**, доступен review (verified / false positive + note).
- Run #2: potential issues не обнаружены (0).
- Raw responses не изменяются.

## 8. Testing

- `npm run build` — ✓ (28/28 страниц).
- `npm run lint` — новые файлы чисты; 198 ошибок — pre-existing (scripts/, test-browser.js и т.п.).
- API: create/get/analysis/issues/report проверены; run #2 web_search — 34/34 SUCCESS.
- UI smoke: Overview (run history, comparison, insights), Sources (source intelligence + source gap), Gaps (hypothesis + human review), Actions (why/how to verify) — 0 console errors (кроме транзиентного 500 на /api/dashboard из-за сетевого сбоя Neon pooler, повторный запрос успешен).
- Existing pages (/dashboard, /campaigns и пр.) — 200.

## 9. Ограничения

- Классификация доменов rule-based: много «other» (157) — правила покрывают известные паттерны; неопределённое честно остаётся «other».
- Citations доступны только у search-провайдера; для chat-провайдеров source data unavailable (это честно показывается, не симулируется).
- Метрики — срез 34 промптов конкретного запуска, не рынка.
- Отсутствие citations в chat-режиме не интерпретируется как отсутствие влияния официального сайта.
- Провайдеры разных runs не смешиваются; сравнение baseline vs run #2 корректно только из-за неизменного prompt set (hash совпадает).

## 10. Deliverables обновлены

- `AI_SEARCH_INTELLIGENCE_SPEC.md` — обновлён (ниже).
- `AI_SEARCH_AUDIT_REPORT.md` — сгенерирован из run #2 (16 секций).
- `AI_SEARCH_IMPLEMENTATION_REPORT.md` — этот документ.
- `AI_SEARCH_SOURCE_INTELLIGENCE.md` — создан.

## 11. Next steps

1. Дождаться внедрения контента по intent-категориям и повторить run #3 (тот же prompt set) — сравнить с baseline/run #2.
2. Расширить rule-based классификацию (реестры, отраслевые СМИ) для снижения «other».
3. Валидация на втором клиентском кейсе.
4. Экспорт отчёта в PDF/HTML (опционально).
