# AI SEARCH VISIBILITY AUDIT · АО НВП «БОЛИД»

**AI Search Intelligence case study**

_34 prompts · 10 intent categories · 3 measurement runs_

---

## Screen 1 — What does AI know about BOLID?

**Summary of the observed AI knowledge about the brand** within this prompt set
(baseline runs, before any content actions):

- **Brand identity** — АО НВП «Болид» describes itself as a Russian company from
  Korolyov that **develops, manufactures and supplies equipment and software** for
  security, automation and dispatch systems. The most frequent brand description in
  answers: **«АО НВП "Болид"»** (12 of 34 answers in the web-search run).
- **Product associations** — СКУД (8), fire alarm systems (5), video surveillance (4),
  dispatch systems (3), controllers (3), АСКУЭ (2).
- **Category belonging** — security systems (8), automation (5), dispatch (4),
  access control (4), fire-and-security alarm systems (4).
- **Scale facts echoed by AI** — founded in 1991, 900+ employees, 400+ product items,
  support for up to 600 000 elements and 65 535 zones in Orion architecture,
  аutomated production.
- **Place in comparisons** — in the «Comparison» intent БОЛИД was mentioned in all
  6 prompts; in the «Competitor» intent (prompts about PERCo, Sigur, RusGuard) —
  in all 5 prompts of the web-search runs.

> Observed AI knowledge — как AI описывает бренд в рамках данного набора промптов.
> This is an observation of model answers, not an official brand positioning.

---

## Screen 2 — Methodology

**Measurement setup:** 34 prompts · 10 intent categories · 3 runs.

| Run | Mode | Providers | Prompt set | Success | Date |
|---|---|---|---|---|---|
| Run #1 | `chat` | `primary` (gpt-4o-mini) | v1 · hash `9db15516` | 34/34 | 2026-08-14 |
| Run #2 | `web_search` | `search` (perplexity/sonar) | v1 · hash `9db15516` | 34/34 | 2026-08-14 |
| Run #3 | `web_search` | `search` (perplexity/sonar) | v1 · hash `9db15516` | 34/34 | 2026-08-14 |

- Same 34 prompts, same prompt set version and hash in all runs — runs are comparable.
- **Run #1 → Run #2 is NOT a before/after measurement**: different execution modes
  (chat vs web search) and providers. Only the repeated Runs #2 → #3 (same mode,
  same provider, same prompts) form a verification loop.
- Analysis of each answer is done by a separate AI request which extracts
  structured fields: brand mention, recommendation, position (top-3), competitors,
  claims, sources, citations. Source classification (official/competitor/industry/…)
  is rule-based and deterministic.
- Metrics: Mention Rate, Recommendation Rate, Top-3 Rate, Citation Rate,
  Official Source Rate, Intent coverage, Source Intelligence, Positioning,
  Competitor Intelligence.

**Observation vocabulary used in this study:**

- «Observed intent-level gap» — category of prompts where the brand was mentioned
  in fewer prompts than it could have been, based on measured runs.
- «Observed change» — difference between two runs; causality is not claimed.
- «Observed source share» — share of mentions coming from official BOLID domains.

> Limitations: это экспериментальный замер на фиксированном наборе промптов и
> провайдеров — не статистическое исследование рынка. Ответы AI нестабильны:
> повторные запуски могут отличаться без изменений бренда. Sources фиксируются
> только если провайдер вернул citations.

---

## Screen 3 — Key Finding

**Observed intent-level gaps:** the brand is consistently present in answers to
brand/product/comparison prompts, while in practical-shopper intents it is
often absent.

Intent coverage (mentioned prompts / total prompts), web-search run (Run #2):

| Intent category | Prompts | BOLID mentioned | Observed gap |
|---|---|---|---|
| Brand | 2 | 2/2 | — |
| Product | 4 | 4/4 | — |
| Category | 2 | 2/2 | — |
| Buyer Intent | 3 | 1/3 | 2 prompts |
| **Use Case** | **3** | **0/3** | **3 prompts** |
| Comparison | 6 | 6/6 | — |
| Alternatives | 4 | 3/4 | 1 prompt |
| **Problem / Solution** | **3** | **0/3** | **3 prompts** |
| **Expert / Technical** | **2** | **0/2** | **2 prompts** |
| Competitor | 5 | 5/5 | — |

- **Observation, not verdict:** the «Use Case», «Problem / Solution» and
  «Expert / Technical» intents show a gap **in all three runs** — this is not a
  measurement fluctuation of a single run, it is a stable observed pattern.
- The finding is a fact about the prompt set + providers used, **not** a claim
  that "AI doesn't know БОЛИД" — brand/product/comparison intents are solid.

---

## Screen 4 — Source Intelligence

**What sources does AI use when describing БОЛИД?** (Run #2, web search,
perplexity/sonar)

- **277 source mentions, 157 unique domains** across 34 prompts.
- **Official BOLID domains: 22 mentions of 277 (Official Source Rate 7.9%):**
  - `bolid.ru` — 19 mentions
  - `antares.bolid.ru` — 2 mentions
  - `partners.bolid.ru` — 1 mention
  - (*21 entries classified as type «official» by rule-based normalization; one
    official-domain entry fell under another type — domain-based flag = 22.*)

Sources by classification (Run #2):

| Source type | Mentions | Share |
|---|---|---|
| Official (BOLID domains) | 21 | 7.6% |
| Industry | 55 | 19.9% |
| Community | 20 | 7.2% |
| Media | 12 | 4.3% |
| Competitor domains | 10 | 3.6% |
| Documentation | 2 | 0.7% |
| Review platforms | 0 | 0% |
| Other | 157 | 56.7% |

**Top domains besides bolid.ru:** rusprofile.ru (9), cyclowiki.org (9),
kontragent.vbr.ru (8), t-save.ru (8), companies.rbc.ru (7),
stroimprosto.mos.ru (6), habr.com (6).

**Observed pattern:** more than half of the sources fall into the heterogeneous
«Other» category; review platforms produced zero mentions; official domains share
is under 8% of all cited sources.

---

## Screen 5 — Competitor Intelligence

**Observed competitor presence** — brands mentioned in competitor positions
(analysis-level, Run #2):

| Competitor | Mentions (Run #2) | Mentions (Run #3) |
|---|---|---|
| PERCo | 5 | 8 |
| Parsec | 5 | 7 |
| Sigur | 4 | 6 |
| RusGuard | 4 | 6 |
| RUBEZH | 3 | 6 |

**Cases where a competitor was mentioned but БОЛИД was absent** (Run #2):

1. **Use Case prompt** — «Какое решение для систем охранно-пожарной сигнализации
   и безопасности подходит для охраны промышленных объектов?» → **RUBEZH was
   mentioned and recommended, БОЛИД was not mentioned.**
2. **Alternatives prompt** — «Какие есть альтернативы PERCo?» → Sigur, Parsec,
   RusGuard listed; БОЛИД absent.

> «Observed competitor presence» — как AI упоминает конкурентов в рамках данного
> набора промптов. Не официальное позиционирование и не заявление о «главном
> конкуренте».

---

## Screen 6 — AI Positioning

**How AI describes БОЛИД vs competitors** (Run #2, positioning extraction)

BOLID positioning (top phrases by frequency):

- **Brand descriptions:** «АО НВП "Болид"» (12), «российская компания из
  Королёва» (1), «разрабатывает, производит и поставляет оборудование и
  программное обеспечение» (1).
- **Product associations:** СКУД (8), пожарная сигнализация (5),
  видеонаблюдение (4), диспетчеризация (3), контроллеры (3).
- **Category associations:** системы безопасности (8), автоматизация (5),
  диспетчеризация (4), контроль доступа (4).
- **Differentiators mentioned by AI:** интеграция с другими системами (3),
  900+ сотрудников, 400+ позиций номенклатуры, поддержка до 600 000 элементов
  и 65 535 зон, контроллеры двухпроводной линии связи.
- **Buyer criteria mentioned in BOLID context:** цена (4), масштабируемость (3),
  стоимость владения (3), интеграции (3).

**Observed positioning contrast:** in «Use Case» / «Problem / Solution» prompts
AI fills the answer with competitors (RUBEZH was recommended in a use-case prompt)
because the factual basis about БОЛИД's use cases is not present in the sources AI
retrieves — while in direct brand prompts the positioning is rich and consistent.

---

## Screen 7 — From Gap to Action

**Observed intent-level gaps → hypothesis → action plan (все действия — гипотезы,
требующие проверки, не установленные причины).**

### GAP 1 — Use Case prompts (0/3 in all runs)

- **Evidence:** «Какое решение … подходит для охраны промышленных объектов?»,
  «…для пожарной безопасности торговых центров», «Как компании на практике
  внедряют…?» — no БОЛИД mention; RUBEZH recommended in the first prompt.
- **Hypothesis:** potential information / content opportunity — AI lacks
  retrievable content describing БОЛИД solutions for specific object types.
- **Action:** publish content covering БОЛИД solutions by object type
  (промышленные объекты, торговые центры, офисы, ЖКХ) with use-case descriptions
  and implementation cases on official domains; make it visible in indexed pages,
  not only in catalogs.
- **Verification:** repeat the same 34-prompt run (Run #4) after 2–4 weeks and
  compare the Use Case intent coverage.

### GAP 2 — Problem / Solution prompts (0/3 in all runs)

- **Evidence:** «Как решить проблему: противопожарная защита объектов…»,
  «…организация контроля доступа…», «Какие типовые проблемы возникают…» — no
  БОЛИД mention in any run.
- **Hypothesis:** AI cannot connect БОЛИД to problem-solution narratives
  (integration, protection specifics) because such content is not retrievable.
- **Action:** create problem/solution-style materials (integration guides,
  retrofit scenarios, compliance cases) with БОЛИД as the answer, published on
  official domains and industry platforms (habr.com, профильные порталы),
  which were among the top cited sources.
- **Verification:** repeated measurement Run #4.

### GAP 3 — Expert / Technical prompts (0/2 in all runs)

- **Evidence:** «Какие технические требования предъявляются…», «Какие технические
  характеристики наиболее важны…» — no БОЛИД mention; only general technical
  answers.
- **Hypothesis:** a documentation/technical gap — AI cites documentation sources
  sparsely (документация: только 2 упоминания).
- **Action:** publish technical requirements & characteristic materials
  (spectra of line parameters, certifications, ГОСТ-based compliance tables)
  on bolid.ru/antares.bolid.ru so they can be cited.
- **Verification:** repeated measurement Run #4.

---

## Screen 8 — Verification Run

**Run #2 → Run #3** — same provider, same mode, same prompt set (hash `9db15516`).
No content actions were performed between the runs; the observed change reflects
AI answer variability.

| Metric | Before (Run #2) | After (Run #3) | Observed change |
|---|---|---|---|
| Mention Rate | 67.6% | 70.6% | +3 pp |
| Recommendation Rate | 20.6% | 17.6% | −3 pp |
| Top-3 Rate | 20.6% | 17.6% | −3 pp |
| Citation Rate | 100% | 100% | 0 pp |
| Official Source Rate | 7.9% | 7.3% | −0.6 pp |
| Official source mentions | 22 → 21 | | −1 |
| Competitor-only responses | 2 | 0 | −2 |

Intent-level (observed change):

| Category | Before | After | Change |
|---|---|---|---|
| Alternatives | 3/4 | 4/4 | +1 |
| Use Case | 0/3 | 1/3 | +1 |
| Buyer Intent | 1/3 | 0/3 | −1 |
| Brand / Product / Category / Comparison / Competitor | stable | stable | 0 |
| Problem / Solution | 0/3 | 0/3 | 0 |
| Expert / Technical | 0/2 | 0/2 | 0 |

Sources & positioning changes:

- Unique domains: 157 → 163 (new 22, disappeared 16, repeated 141).
- Positioning phrases (top lists): 25 new, 25 removed, 20 increased, 20 decreased —
  normal volatility of AI phrasing between runs.

**Conclusion of the verification run:** gaps in «Use Case» / «Problem / Solution» /
«Expert / Technical» intents remained stable across both web-search runs —
the observed intent-level gaps are not artifacts of one run. Recommendation and
Top-3 rates moved within ±3 pp — within the observed variability band.

---

## Screen 9 — What the workflow enables

**OBSERVE → EVIDENCE → DIAGNOSE → ACTION → VERIFY → COMPARE**

This case demonstrates the full AI Search Intelligence workflow applied to АО НВП
«БОЛИД»:

- **OBSERVE** — 34 prompts × 10 intent categories, 3 runs, 34/34 successful each.
- **EVIDENCE** — every number is backed by run data and citations; official source
  mentions, positioning phrases, competitor mentions are extracted per-answer.
- **DIAGNOSE** — observed intent-level gaps identified (Use Case, Problem/Solution,
  Expert/Technical), stable across runs.
- **ACTION** — hypotheses and content actions per gap, with explicit «requires
  verification» framing.
- **VERIFY** — Run #3 confirms the gaps; the same prompt set is the repeatable
  verification instrument (re-run after 2–4 weeks produces a comparable baseline).
- **COMPARE** — source intelligence (277 mentions / 157 domains), competitor
  intelligence (PERCo, Sigur, RusGuard, Parsec, RUBEZH), and AI positioning are
  compared between runs in one place.

> AI Search visibility is not a single number. It is a combination of intent
> coverage, recommendations, sources, positioning, competitors and repeated
> measurements.

---

## Appendix — Reproducibility

- Audit: **«Болид — AI Search Audit (валидация)»** (id `cmst1p1gk0000dwutci61bh6b`),
  prompt set version 1, hash `9db15516`.
- Runs: Run #1 `cmst4dajf0000sguthxqbbhic` (chat, gpt-4o-mini) ·
  Run #2 `cmst53ezk0000ekut1fuudt52` (web_search, perplexity/sonar) ·
  Run #3 `cmstat4zj0000f0utcm6h6pmx` (web_search, perplexity/sonar).
- Audit report (full data): `AI_SEARCH_AUDIT_REPORT.md`; source intelligence:
  `AI_SEARCH_SOURCE_INTELLIGENCE.md`; data snapshot: `BOLID_CASE_DATA_SNAPSHOT.md`.
- Live workspace view of this audit requires access to the SEOFlow workspace
  (deep link `/ai-search/cmst1p1gk0000dwutci61bh6b?tab=overview` is only available
  to authorized users of the application).