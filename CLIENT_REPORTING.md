# SEOFlow — Client Reporting

The client report is a **presentation layer** over the operational data.

- `human-queue.json` = **operational source of truth** (status + history for every platform).
- Client report = **human-readable result** for the client.

## Files produced

`scripts/generate-client-report.ts` writes into `client-report/`:

| File | Purpose |
|---|---|
| `client-directory-report.csv` | Flat table of every platform with client-facing columns (Каталог, URL, Категория, Тип, Приоритет, Статус, Результат, Следующий шаг, Причина статуса, Ссылка на профиль). |
| `client-directory-report.xlsx` | Excel workbook with 5 sheets: **Сводка** (summary), **Все площадки** (all platforms), **Требуется действие** (needs action), **Не подходит для размещения** (NOT_APPLICABLE detail), **Технические данные** (system status, queue status, technical result/reason/notes). |
| `client-directory-report.md` | Markdown report: summary counters table + full platform table + service-row note. |
| `client-priority-top10.md` | Prioritization of directories for fastest results (P1/P2/P3) with reasons and expected outcomes. |
| `client-report-changes.md` | Diff between report snapshots (old vs new date) — status movement. |
| `not-applicable-audit.md`, `not-applicable-final-audit.md` | NOT_APPLICABLE classification audit documentation (confirmed / reclassify / partner / paid / needs-check). |

## Generation

```bash
npx tsx scripts/generate-client-report.ts
```

### Sources (does not re-run audits)
- `src/lib/directories/MASTER_LIST.ts` — authoritative client list (76 entries = 75 client platforms + FindUsHere).
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

## Known limitation

The report generator iterates `MASTER_LIST` and looks up each name in `human-queue.json`. As of 2026-08-08:
- `Sitejabber` is present in `MASTER_LIST` but no longer in the queue (replaced), while
- `SmartCustomer` is in the queue but not in `MASTER_LIST`.

As a result the generated report currently emits **75 rows**, while the queue has **76 entries**. This is a known source/target id mismatch, not a data-loss bug; reconcile the two lists before the next report run if it matters for the client.

> Current counts and the six SUBMITTED monitoring targets are maintained in `STATUS_MODEL.md`; always re-derive from `human-queue.json` before reporting.
