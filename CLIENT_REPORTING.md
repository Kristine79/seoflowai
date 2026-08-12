# SEOFlow — Client Reporting

The client report is a **presentation layer** over the operational data.

- `human-queue.json` = **operational source of truth** (status + history for every platform).
- Client report = **human-readable result** for the client.

## Files produced

`scripts/generate-client-report.ts` / `scripts/generate-client-report-final.ts` write into `client-report/`:

| File | Purpose |
|---|---|
| `client-directory-report.csv` | Flat table of every platform with client-facing columns (Каталог, URL, Категория, Тип, Приоритет, Статус, Результат, Следующий шаг, Причина статуса, Ссылка на профиль). |
| `client-directory-report.xlsx` | Excel workbook with 5 sheets: **Сводка** (summary), **Все площадки** (all platforms), **Требуется действие** (needs action), **Не подходит для размещения** (NOT_APPLICABLE detail), **Технические данные** (system status, queue status, technical result/reason/notes). |
| `client-directory-report.md` | Markdown report: summary counters table + full platform table + service-row note. |
| `client-priority-top10.md` | Prioritization of directories for fastest results (P1/P2/P3) with reasons and expected outcomes. |
| `client-report-changes.md` | Diff between report snapshots (old vs new date) — status movement. |
| `not-applicable-audit.md`, `not-applicable-final-audit.md` | NOT_APPLICABLE classification audit documentation (confirmed / reclassify / partner / paid / needs-check). |

The published campaign report `public/SEOFlow-77-Platform-Campaign-Report.xlsx` is the client-facing Excel export for the 77-platform campaign.

## Generation

```bash
npx tsx scripts/generate-client-report.ts
npx tsx scripts/generate-client-report-final.ts
```

### Sources (does not re-run audits)
- `src/lib/directories/MASTER_LIST.ts` — authoritative platform list (77 entries).
- `human-queue.json` — final statuses after the runs.
- `probe-results.json` — live form/availability probe results.
- `scripts/lib/client-data.ts` — client-status mapping, per-platform overrides, result text, NA categories/comments, profile URLs.

### Client status mapping
Technical statuses are rendered to plain-language client statuses (Russian):

| Technical | Client |
|---|---|
| VERIFIED_SUCCESS | Размещено (подтверждено) |
| SUBMITTED | Заявка отправлена |
| REGISTERED | Аккаунт создан |
| PENDING_MODERATION | Ожидает модерации |
| PENDING_VERIFICATION | Требуется подтверждение |
| NEEDS_MANUAL / FORM_READY / NOT_STARTED | Требуется ручное действие |
| BLOCKED | Заблокировано защитой сайта |
| FAILED | Не удалось выполнить |
| NOT_APPLICABLE | Не подходит для размещения |

Each client status maps to a reason and a next-step, so the report explains *why* and *what next* for every platform.

## Reference numbers: the real 77-platform campaign

The reference campaign (final report dated 2026-08-11) produced:

| Client status | Count |
|---|---:|
| Всего площадок (Total) | **77** |
| Размещено (подтверждено) — Placed | **5** |
| Заявка отправлена / ожидает модерации — Submission sent | **7** |
| Требуется действие клиента — Requires action | **23** |
| Площадка недоступна — Platform unavailable / externally blocked | **14** |
| Не подходит для текущей задачи — Not suitable | **28** |

77 = 5 + 7 + 23 + 14 + 28. See `REAL_VALIDATION.md` for the full case study.

> Historical reports (`final-report-75.md`, `client-directory-report.md` 2026-08-08 snapshot, etc.) contain older 75/76-platform snapshots from earlier stages of the campaign. They are retained as history; the current reference is the **77-platform** campaign report.

## Known limitation

The report generator iterates `MASTER_LIST` and looks up each name in `human-queue.json`. Source/target mismatches between the two lists can cause row-count differences between the report and the queue. Before delivering a report, reconcile the lists and re-derive counts from `human-queue.json` (the operational source of truth).
