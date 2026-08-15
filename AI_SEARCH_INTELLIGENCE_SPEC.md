# AI Search Intelligence — Product Spec

> Статус: MVP (Phase 1–20 по заданию). Документ описывает продукт целиком,
> явно отделяя реализованное в MVP от будущих версий.
> Реализация: см. `AI_SEARCH_IMPLEMENTATION_REPORT.md`.

---

## 1. Product goal

AI Search Intelligence — функциональный модуль SEOFlow, который исследует,
как AI-системы (LLM-ассистенты) представляют бренд, его продукты и конкурентов
в ответах на пользовательские запросы.

Продукт отвечает не на вопрос «какой у нас AI Visibility Score», а на вопросы:

- где бренд появляется в ответах AI;
- где его нет, хотя должен;
- кого AI рекомендует вместо него;
- какие источники AI цитирует;
- какие утверждения AI делает о бренде/рынке;
- почему возникает gap (согласно наблюдаемым данным, без утверждения причинности);
- что конкретно можно сделать;
- что изменилось после действий (по методологии baseline → action → re-run → compare).

Главный принцип:

```
INSIGHT → ACTION → EVIDENCE → VERIFICATION
```

**Отличие от generic GEO/AI-Visibility dashboard:** модуль не показывает один
«магический» score, а строит диагностическую картину из измеряемых метрик,
каждая из которых привязана к raw evidence (исходный AI-ответ).

## 2. Target user

MVP-пользователь — владелец/маркетолог компании, которую уже ведёт SEOFlow
(Company Profile существует в системе). Пользователь хочет понять, как его
бренд представлен в AI-ответах и что с этим делать — без необходимости
разбираться в prompt engineering.

## 3. Main workflow

```
BASELINE
  │  Brand / Website / Products / Market / Competitors
  ▼
PROMPT GENERATION  (template-based, user-editable)
  │
  ▼
AI QUERY EXECUTION  (provider abstraction, raw response)
  │
  ▼
RAW RESPONSE STORAGE  (evidence-first)
  │
  ▼
RESPONSE ANALYSIS  (structured extraction: mentions / recommendations / competitors / claims / sources)
  │
  ▼
METRICS  (Mention Rate, Recommendation Rate, Top-3 Rate, Citation Rate, …)
  │
  ▼
GAP ANALYSIS  (evidence-backed)
  │
  ▼
ACTION PLAN  (suggested actions, no causation claims)
  │
  ▼
REPORT  (AI Search Audit Report)
```

Будущий цикл верификации (не в MVP):

```
BASELINE → ACTION → WAIT → RE-RUN → COMPARE → REPORT
```

Сравнение — «observed change», без утверждения «причина — действие»,
если не доказано иначе.

## 4. User inputs

Пользователь вводит один раз при создании аудита:

| Поле | Источник в SEOFlow |
|---|---|
| Brand | Company Profile (name, legalName) |
| Website | Company Profile (website) |
| Description | Company Profile (descriptionMedium / descriptionShort) |
| Products | Company Profile (services / keywords) |
| Market | Company Profile (serviceArea / category) |
| Target audience | свободный ввод (не в Company Profile) |
| Competitors | свободный ввод (не в Company Profile) |

Данные компании НЕ дублируются: аудит хранит **снапшот** (чтобы повторные
запуски были сравнимы), но заполняется предзаполненно из Company Profile.

## 5. Prompt taxonomy

10 категорий (система шаблонов, не зашитые строки в UI):

| Ключ | Название | Пример шаблона |
|---|---|---|
| BRAND | Brand | «Что вы знаете о {brand}?» |
| PRODUCT | Product | «Какие продукты предлагает {brand} для {use case}?» |
| CATEGORY | Category | «Какие {category} решения лучшие в {market}?» |
| BUYER_INTENT | Buyer Intent | «Что учитывать при выборе {category}?» |
| USE_CASE | Use Case | «Какой {category} подходит для {use case}?» |
| COMPARISON | Comparison | «{brand} vs {competitor}» |
| ALTERNATIVES | Alternatives | «Какие альтернативы {brand} существуют?» |
| PROBLEM_SOLUTION | Problem / Solution | «Как решить {problem}, связанный с {category}?» |
| EXPERT_TECHNICAL | Expert / Technical | «Технические критерии выбора {category}» |
| COMPETITOR | Competitor | «Что известно о {competitor}?» |

Шаблоны параметризуются продуктами, категориями и конкурентами из конфигурации
аудита. Промпты редактируются, отключаются и создаются пользователем до запуска.

## 6. AI provider abstraction

Архитектурная абстракция:

```
AI Provider
  → executePrompt(prompt) → { rawResponse, provider, model, latency, usage }
  → citations — только если провайдер их реально возвращает через API
```

MVP использует существующую в SEOFlow абстракцию `src/lib/automation/ai-client.ts`
(упорядоченные OpenAI-совместимые провайдеры: primary + fallback-2 + fallback-3,
timeout 60s, maxRetries 1). Каждый ответ фиксирует provider + model.

Future providers (архитектурно поддерживаются, не реализованы):
OpenAI, Anthropic, Google, Perplexity и другие search-capable providers —
через единый интерфейс `executePrompt`. Правила:

- не симулировать провайдеров;
- не создавать fake responses;
- не выдумывать citations, которых нет в API/тексте ответа.

## 7. Data model

Новые модели (Prisma), все связаны с существующим `Company` через снапшот:

- `AiSearchAudit` — конфигурация и статус аудита (brand, website, description,
  products, market, targetAudience, competitors, sourceCompanyId, статус,
  executedAt/completedAt, отчёт).
- `AiSearchPrompt` — промпт (category, templateKey, text — редактируемый,
  enabled, custom, position).
- `AiSearchResponse` — evidence: provider, model, promptText, **rawResponse**,
  status, error, latency, usage, analysis (JSON), citations (JSON).
- `AiSearchGap` — гэп с типом, severity, evidence (promptIds / responseIds / stats).
- `AiSearchAction` — действие из gap-правила (priority, problem, evidence,
  recommendation, target, expectedPurpose, status).

Принципы статусов, evidence и отчётов наследуются от существующей status-системы
(`src/lib/status.ts`, тона blue/amber/emerald/rose/zinc).

## 8. Analysis pipeline

1. Промпт выполняется реальным провайдером → raw ответ сохраняется как есть.
2. Отдельный шаг analysis: structured output (JSON) извлекает:

```json
{
  "brandMentioned": true,
  "recommended": true,
  "recommendationPosition": 2,
  "competitors": [{ "name": "...", "mentioned": true, "recommended": false, "position": 1 }],
  "products": ["..."],
  "claims": [{ "text": "...", "potentialIssue": false }],
  "sources": [{ "name": "...", "domain": "...", "type": "review_platform", "official": false, "brandRelated": false, "competitorRelated": true }],
  "citations": [{ "title": "...", "url": "..." , "domain": "..."}],
  "insight": "Краткое объяснение"
}
```

3. Аналитика строится только на структурированных данных; raw-ответ всегда
   доступен для проверки. Если analysis не удался — raw-ответ сохраняется,
   метрики используют только успешные analysis.

## 9. Metrics

Диагностические метрики (без единого «AI Visibility Score»). Определения:

| Метрика | Определение |
|---|---|
| Mention Rate | ответов с упоминанием бренда / успешных ответов |
| Recommendation Rate | ответов с рекомендацией бренда / успешных ответов |
| Top-3 Rate | ответов, где бренд в топ-3 рекомендаций / успешных ответов |
| Citation Rate | ответов с хотя бы одной ссылкой/источником / успешных ответов |
| Competitor Presence | ответов с упоминанием хотя бы одного конкурента / успешных ответов |
| Competitor-only prompts | ответов, где конкуренты есть, а бренда нет |
| Official Source Rate | упоминаний официальных доменов / всех упоминаний источников |
| Source Coverage | число уникальных доменов-источников |
| Potential Issues | число утверждений, помеченных analysis как потенциально некорректные |

Если успешных analysis нет — UI показывает «Not enough data», а не score.

## 10. Citation / source model

Источники фиксируются на уровне ответа:

- source domain, source type (official site, review platform, social, media,
  documentation, directory, comparison article, forum, …);
- флаги: official (домен бренда), brandRelated, competitorRelated.

Правила: не утверждать причинность («Sources X заставляет AI рекомендовать
конкурента» — запрещено). Только «Observed source pattern».

Citations — только реальные: извлечённые из текста ответа или возвращённые
провайдером. Не выдумывать.

## 11. Competitor analysis

Для каждого конкурента из конфигурации:

- сколько ответов его упоминают;
- сколько ответов его рекомендуют;
- средняя позиция рекомендации;
- пересечения с брендом (brand+competitor в одном ответе).

Сравнение «бренд vs конкурент» по метрикам. Учитываются только конкуренты,
перечисленные пользователем (без самодельного поиска «рыночных» конкурентов
в MVP).

## 12. Gap analysis

Каждый гэп = наблюдаемый паттерн + evidence. Типы MVP:

- `BRAND_ABSENT` — бренд не упомянут в ответах на категорию запросов;
- `COMPETITOR_ONLY` — конкуренты упомянуты, бренд нет;
- `MISSING_OFFICIAL_SOURCE` — официальный домен не встречается в источниках;
- `WEAK_PRODUCT_REPRESENTATION` — продукты из конфигурации не упоминаются;
- `FACTUAL_ISSUE` — утверждения, помеченные как потенциально некорректные;
- `COMPARISON_GAP` — бренд отсутствует в comparison/alternatives запросах.

Формат каждого гэпа:

```
GAP: Brand absent in buyer-intent prompts
Evidence: 7 prompts / 4 competitors mentioned / 0 brand mentions
Sources: …
```

## 13. Action Plan

Правила «гэп → действие» (правила фиксированы, формулировки аккуратные):

- `recommended action`, `potential opportunity`, `observed gap`;
- без утверждений «это увеличит visibility»;
- каждое действие: Priority (P0/P1/P2), Problem, Evidence, Recommended action,
  Target (Website / Knowledge Base / Content / Directory), Expected purpose,
  Status (SUGGESTED → PLANNED → DONE).

Будущая интеграция (Phase 17, не в MVP): Gap → Create Campaign (SEOFlow
directory campaign), Content Task, Human Action Queue.

## 14. Verification

В MVP сохраняется baseline: audit, timestamp, prompt set, provider/model.
Повторный запуск использует тот же prompt set. Сравнение — «observed change».
Сложная longitudinal analytics — не в MVP.

## 15. Reporting

Генерация `AI_SEARCH_AUDIT_REPORT.md` (по аудиту):

мета (дата, провайдеры/модели, кол-во промптов, failed queries, sampling,
ограничения) → Executive Summary → Mention Analysis → Recommendation Analysis →
Competitor Analysis → Source/Citation Analysis → Potential Issues → Gaps →
Action Plan → Evidence → Limitations → Next Measurement.

Отчёт не выдаёт эксперимент за статистически доказанное измерение рынка.

## 16. MVP limitations

- Выполнение промптов только через настроенные OpenAI-совместимые провайдеры;
  search-native провайдеры (Perplexity и т.п.) — future.
- Citations — только извлечённые из текста/API; не гарантируется мгновенная
  свежесть веб-знаний модели.
- Ограничение: провайдеры OpenAI-совместимых endpoint'ов обычно не возвращают
  официальный `citations[]` — поэтому источники извлекаются из текста ответа.
- Экзекьюшн идёт батчами (лимиты Vercel function duration); при больших
  аудитах (~80 промптов) запуск занимает время и требует присутствия вкладки.
- Метрики — описательные, не статистически валидированные.
- MVP не реализует автосоздание кампаний из гэпов (только архитектура).
- Конкуренты — только из конфигурации пользователя.

## 17. Future versions

1. Search-native providers (Perplexity API c citations, Google/Gemini, Anthropic).
2. Longitudinal: re-run compare, observed-change отчёт.
3. Integration с Campaign/Directory/Content: Gap → Action → Campaign → Human → Evidence → Verify.
4. Source Intelligence: паттерны источников по рынку.
5. Расширенная продуктовая атрибутика (синтаксис упоминаний, tone).
6. Scheduling, дедупликация стоимости, budget caps.
7. Multi-brand workspace (несколько Company).
8. Claims fact-checking по официальным источникам.


---

# PHASE 2 — SOURCE INTELLIGENCE (дополнение к спецификации)

## P2-1. Provider capability model
- Каждый провайдер имеет capabilities: supportsWebSearch / supportsCitations / supportsStructuredOutput / supportsUsage (детерминированная оценка, src/lib/automation/ai-client.ts).
- Выделенный search-провайдер: OPENAI_SEARCH_API_KEY / OPENAI_SEARCH_BASE_URL / OPENAI_SEARCH_MODEL (default: существующий OpenRouter ключ + perplexity/sonar). Search-провайдер использует реальный веб-поиск и возвращает structured citations (url/title/span).

## P2-2. Режимы выполнения
- chat (baseline): обычные провайдеры, citations обычно отсутствуют.
- web_search (source-aware): только search-capable провайдеры; citations реально возвращённые провайдером сохраняются (url, domain, title, sourceType, citationText).
- Если search-провайдер недоступен — ошибка «Source data unavailable from this provider», ничего не симулируется.

## P2-3. Source normalization (rule-based)
- Классификация доменов: official / competitor / industry / documentation / review / community / media / other.
- Правила детерминированы; LLM-метки не источник истины.
- Примеры правил: bolid.ru → official; perco.ru → competitor; reddit.com → community; rusprofile.ru → industry; companies.rbc.ru → media.

## P2-4. Source Intelligence view
- Total sources, unique domains, типы источников, per-domain таблица (домен/URL/тип/появления/промпты).
- Source Gap: «No bolid.ru citations were detected in this audit (0/34)» — не «AI не использует bolid.ru».

## P2-5. Run model
- AiSearchRun: runId, runNumber, timestamp, mode, providers, promptSetVersion, promptSetHash.
- Baseline vs Run #2 сравниваются корректно; при изменении prompt set — предупреждение «Prompt set changed — direct comparison may be unreliable».

## P2-6. Insights
- Intent gap: категории без упоминаний бренда (observed pattern + evidence + potential opportunity).
- Awareness → Recommendation gap: только при наблюдаемом разрыве; без причинности.

## P2-7. Evidence chain
- Gap → Evidence → Hypothesis (interpretation, отдельно от фактов) → Recommended action → Target → Why this action → How to verify.

## P2-8. Human review
- Potential issues: PENDING_REVIEW / VERIFIED / FALSE_POSITIVE + note. Raw immutable.

## P2-9. Отчёт
- 16 секций: Executive Summary, Audit Scope, Methodology, Providers and Models, Prompt Coverage, AI Visibility Metrics, Intent-level Analysis, Awareness → Recommendation Gap, Competitor Analysis, Source Intelligence, Visibility Gaps, Evidence, Action Plan, Verification Plan, Limitations, Next Measurement.
- Некорректная формулировка «AI использует другие источники» запрещена; вместо неё — «no sources detected in returned response» / «Source data unavailable from this provider».

## P2-10. Формулировки
- «В рамках данного набора из 34 prompts…», «observed pattern», «observed gap», «potential opportunity», «recommended action».
- Не: «AI visibility Болида = X% на рынке», «SEOFlow доказал…», «Болид плохо представлен в AI».


---

# PHASE 3 — POSITIONING INTELLIGENCE + BOLID VERIFICATION LOOP (дополнение)

## P3-1. Positioning / Phrase Intelligence
- Извлечение positioning из каждого успешного raw response (LLM-экстракция, только то, что реально присутствует в ответе):
  brandDescriptions, productAssociations, categoryAssociations, useCases, valuePropositions, differentiators, recurringPhrases, adjectives, technicalTerms, buyerCriteria. Пустое поле = [].
- Частотная агрегация фраз: phrase, count, percentage of relevant responses, prompts where it appeared.
- Блок «AI Positioning» (How AI describes the brand): primary category associations, products, use cases, technical, buyer-oriented language, recurring descriptions.
- Competitor positioning: per-competitor recurring phrases (descriptions/products/use cases/differentiators/technical) — формулировка «Observed AI positioning», не официальное позиционирование.
- Brand vs Competitors: сравнительная таблица (entity, top category, top products, top use cases, top technical, top recurring).
- Positioning gaps: ассоциации из конфигурации, не наблюдавшиеся в наборе промптов. Формулировка: «Product association was not observed in this prompt set» — не «AI не знает продукт». Evidence: X prompts, 0 mentions.

## P3-2. Action → Verification loop
- Action status: SUGGESTED → PLANNED → DONE (декларация пользователя; система не проверяет фактическое изменение). При DONE: note, implementation date, affected URL.
- «Run verification»: тот же prompt set (все enabled prompts), тот же mode/provider, тот же promptSetVersion/hash; создаёт новый AiSearchRun; старые ответы не изменяются. Если provider изменился — предупреждение.
- Run comparison (Before/After): mention/recommendation/top3/citation/official source rates, competitor-only, intent-level по 10 категориям, источники (new/disappeared/repeated/official/competitor/industry), positioning (new/removed/increased/decreased phrases).
- Формулировки: «Observed change», «Observed increase in phrase frequency». НЕ «SEOFlow улучшил…», не «контент увеличил…».

## P3-3. UI
- Вкладки: Overview, Prompts, Responses, Sources, Competitors, Positioning, Gaps, Actions, Runs.
- Runs: выбор двух runs и сравнение.
- Если verification run не существует — «Verification not yet available» (ничего не выдумывается).

## P3-4. Отчёт
- Новые секции: AI Positioning, Phrase Intelligence (в составе 9.5), Competitor Positioning (9.6), Positioning Gaps (9.7), Verification Run (14.5: Before/After metrics, intent, sources, positioning — только при наличии verification run).
