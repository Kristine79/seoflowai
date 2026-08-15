# BOLID Case — Data Snapshot

**AI Search Audit · «Болид — AI Search Audit (валидация)»**
Prompt set: 34 prompts · version 1 · hash `9db15516`
Verified against the production database (Neon) with the project's own
computation code (`buildRunLikes`, `computeMetrics`, `compareRuns`,
`brandPositioning`).

---

## 1. Runs

| Field | Run #1 | Run #2 | Run #3 |
|---|---|---|---|
| Id | `cmst4dajf0000sguthxqbbhic` | `cmst53ezk0000ekut1fuudt52` | `cmstat4zj0000f0utcm6h6pmx` |
| Mode | `chat` | `web_search` | `web_search` |
| Providers | `primary` (gpt-4o-mini) | `search` (perplexity/sonar) | `search` (perplexity/sonar) |
| Prompt set | v1 · `9db15516` | v1 · `9db15516` | v1 · `9db15516` |
| Success / Failed / Total | 34 / 0 / 34 | 34 / 0 / 34 | 34 / 0 / 34 |
| Date | 2026-08-14 | 2026-08-14 | 2026-08-14 |

Note: Run #1 vs Run #2 differ in mode and provider — not a before/after pair.
The verification pair is Run #2 → Run #3 (identical mode, provider, prompt set).

---

## 2. Core metrics

| Metric | Run #1 | Run #2 | Run #3 |
|---|---|---|---|
| Mention Rate | 47.1% | 67.6% | 70.6% |
| Recommendation Rate | 5.9% | 20.6% | 17.6% |
| Top-3 Rate | 2.9% | 20.6% | 17.6% |
| Citation Rate | 0% | 100% | 100% |
| Competitor presence (answers w/ competitor in position) | 32.4% | 32.4% | 44.1% |
| Competitor-only answers (competitor, no BOLID) | 4 | 2 | 0 |
| Official Source Rate | null (no sources) | 7.9% | 7.3% |
| Source data available | false | true | true |
| Total source mentions | 0 | 277 | 287 |
| Unique domains | 0 | 157 | 163 |
| Official source mentions | 0 | 22 | 21 |

---

## 3. Source intelligence (Run #2)

Total 277 mentions / 157 domains.

Source type counts (rule-based normalization):

| Type | Count |
|---|---|
| Official | 21 |
| Competitor | 10 |
| Industry | 55 |
| Documentation | 2 |
| Review | 0 |
| Community | 20 |
| Media | 12 |
| Other | 157 |

Official domains (domain-based flag): bolid.ru 19 · antares.bolid.ru 2 ·
partners.bolid.ru 1 = **22** (of which 21 classified as type «official»).

Top domains: bolid.ru(19), rusprofile.ru(9), cyclowiki.org(9),
kontragent.vbr.ru(8), t-save.ru(8), companies.rbc.ru(7), stroimprosto.mos.ru(6),
habr.com(6), unitest.ru(5), model.rubytech.ru(5), unitrex.ru(5), tbank.ru(4).

### Run #3 delta

Total 287 mentions / 163 domains. Top domains: bolid.ru(18), rusprofile.ru(9),
cyclowiki.org(8), t-save.ru(8), hh.ru(7), kontragent.vbr.ru(7),
stroimprosto.mos.ru(6), habr.com(6), companies.rbc.ru(6),
zachestnyibiznes.ru(5).

Official domains: bolid.ru 18 · antares.bolid.ru 2 · partners.bolid.ru 1 = **21**.

---

## 4. Intent-level coverage (mentions / prompts)

| Category | Prompts | Run #1 | Run #2 | Run #3 |
|---|---|---|---|---|
| BRAND | 2 | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) |
| PRODUCT | 4 | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) |
| CATEGORY | 2 | 1/2 (50%) | 2/2 (100%) | 2/2 (100%) |
| BUYER_INTENT | 3 | 0/3 (0%) | 1/3 (33.3%) | 0/3 (0%) |
| USE_CASE | 3 | 0/3 (0%) | 0/3 (0%) | 1/3 (33.3%) |
| COMPARISON | 6 | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| ALTERNATIVES | 4 | 1/4 (25%) | 3/4 (75%) | 4/4 (100%) |
| PROBLEM_SOLUTION | 3 | 0/3 (0%) | 0/3 (0%) | 0/3 (0%) |
| EXPERT_TECHNICAL | 2 | 0/2 (0%) | 0/2 (0%) | 0/2 (0%) |
| COMPETITOR | 5 | 2/5 (40%) | 5/5 (100%) | 5/5 (100%) |

---

## 5. Competitor mentions (from analysis)

| Competitor | Run #1 | Run #2 | Run #3 |
|---|---|---|---|
| PERCo | 3 | 5 | 8 |
| Sigur | 3 | 4 | 6 |
| RusGuard | 3 | 4 | 6 |
| Parsec | 1 | 5 | 7 |
| RUBEZH | 1 | 3 | 6 |

Hint (raw analysis counts, not normalized): competitor presence per answer.

### Competitor-only evidence (Run #2)

- USE_CASE: «Какое решение для систем охранно-пожарной сигнализации и
  безопасности подходит для охраны промышленных объектов?» → RUBEZH mentioned,
  position 1, recommended — БОЛИД absent.
- ALTERNATIVES: «Какие есть альтернативы PERCo?» → Sigur (1), Parsec (2),
  RusGuard (7) — БОЛИД absent.

---

## 6. Positioning (Run #2, brand, top phrases)

- brandDescriptions: «АО НВП "Болид"»(12), «российская компания из Королёва»(1),
  «разрабатывает, производит и поставляет оборудование и программное
  обеспечение»(1), «основана в 1991 году»(1).
- productAssociations: СКУД(8), пожарная сигнализация(5), видеонаблюдения(4),
  систем безопасности(3), диспетчеризации(3), охранно-пожарной сигнализации(3),
  видеонаблюдение(3), ОПС(3), контроллеры(3), АСКУЭ(2).
- categoryAssociations: системы безопасности(8), автоматизация(5),
  систем безопасности(4), диспетчеризация(4), системы охранно-пожарной
  сигнализации(4), безопасности(4), контроль доступа(4), СКУД(3).
- useCases: контроль доступа(3), интеграция(2), охранно-пожарной
  сигнализацией(1), централизованная пультовая охрана(1), удалённый сбор
  показаний(1), внедрение крупных интегрированных систем(1).
- technicalTerms: СКУД(12), ОКВЭД(4), датчики(4), ОПС(2), пусконаладка(2),
  видеонаблюдение(2), контроллеры(2).
- buyerCriteria: цена(4), масштабируемость(3), стоимость владения(3),
  интеграции(3), требования к интеграции(2), характеристики(2),
  лицензирование(2), надежность(2).
- differentiators: интеграция с другими системами(3), более 900 сотрудников(1),
  более 400 позиций в номенклатуре(1), поддержка до 600 000 элементов(1),
  поддержка до 65 535 зон(1), контроллеры двухпроводной линии связи(1), высокая
  степень автоматизации производства(1).
- recurringPhrases: промышленных объектов(2), лучшие решения на рынке(1).

Positioning filled: 34/34 responses per run (Run #1: 34/34, 5 responses without
brand descriptors due to no brand mention).

---

## 7. Comparison Run #2 → Run #3 (verified)

### Metrics

| Metric | Before | After | Change |
|---|---|---|---|
| Mention Rate | 67.6% | 70.6% | +3 pp |
| Recommendation Rate | 20.6% | 17.6% | −3 pp |
| Top-3 Rate | 20.6% | 17.6% | −3 pp |
| Citation Rate | 100% | 100% | 0 pp |
| Official Source Rate | 7.9% | 7.3% | −0.6 pp |
| Official source mentions | 22 | 21 | −1 |
| Competitor-only responses | 2 | 0 | −2 |
| Unique domains | 157 | 163 | +6 |

### Intent-level

| Category | Before | After | Change |
|---|---|---|---|
| ALTERNATIVES | 3/4 | 4/4 | +1 |
| USE_CASE | 0/3 | 1/3 | +1 |
| BUYER_INTENT | 1/3 | 0/3 | −1 |
| BRAND | 2/2 | 2/2 | 0 |
| PRODUCT | 4/4 | 4/4 | 0 |
| CATEGORY | 2/2 | 2/2 | 0 |
| COMPARISON | 6/6 | 6/6 | 0 |
| COMPETITOR | 5/5 | 5/5 | 0 |
| PROBLEM_SOLUTION | 0/3 | 0/3 | 0 |
| EXPERT_TECHNICAL | 0/2 | 0/2 | 0 |

### Sources & positioning diffusion

- New domains: 22 · Disappeared: 16 · Repeated: 141.
- Positioning phrases (top-25/top-20 lists): new 25 · removed 25 ·
  increased 20 · decreased 20.

---

## 8. Fixed client data (used in prompts / profiles)

- Brand: АО НВП «Болид»; site: bolid.ru.
- Products: Орион, С2000, Стрелец-Интеграл, С2000-КДЛ.
- Market: Россия / СНГ.
- Competitors: PERCo, Sigur, RusGuard, Parsec, RUBEZH.

---

*Snapshot generated 2026-08-15 from the production database; all numbers
recomputed with the project's own code, not copied from reports.*