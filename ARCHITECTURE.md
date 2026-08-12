# SEOFlow AI — Architecture

> This document describes the **actual** implementation. It intentionally separates current implementation from proposed/future architecture (see `KNOWLEDGE_BASE.md`).

## Overview

SEOFlow has two distinct areas of functionality:

1. **A web application** (Next.js 16 + Prisma/PostgreSQL) — marketing site, dashboard, campaigns, directory catalog, SEO audit, company profile. Deployed publicly at https://seoflowai.vercel.app/.
2. **A client-order pipeline** — the operational engine that processes real directory campaigns. This is script-driven and uses `human-queue.json` as its source of truth.

The architecture can be summarized as:

```
Next.js Application
   │
   ├── Marketing Landing
   ├── Dashboard
   ├── Campaigns
   ├── Directory Catalog
   ├── SEO Audit
   └── Company Profile
           │
           ↓
AI-assisted Analysis & Preparation   (LLM field mapping, content preparation)
           │
           ↓
Campaign Workflow                    (status model, history, duplicate protection)
           │
           ↓
Browser Automation                  (Playwright, persistent context, form extraction)
           ├── Automated action
           └── Human action         (headed browser, human-in-the-loop)
                   │
                   ↓
Verification                        (proof-based submit check, public profile check)
           │
           ↓
Evidence + Status History           (screenshots, logs, attempt history)
           │
           ↓
Monitoring                          (re-check SUBMITTED, no re-submission)
           │
           ↓
Reporting                           (CSV / XLSX / Markdown client reports)
```

```
Web app (Next.js / Prisma)
   src/app/*                     → marketing + dashboard routes
   src/components/*              → shared UI components
   src/lib/directories/MASTER_LIST.ts → authoritative platform list (77 entries)

Automation library (shared)
   src/lib/automation/*          → browser, stealth harness, form analysis,
                                   field mapping, email verification, submission runner

Client-order pipeline (scripts)
   scripts/human-submit.ts           → assisted submission (headed, human-in-the-loop)
   scripts/monitor-submitted.ts      → re-check SUBMITTED for public profiles
   scripts/reprobe-blocked.ts        → re-check old BLOCKED
   scripts/audit-notapplicable.ts    → NOT_APPLICABLE classification audit
   scripts/generate-client-report.ts → client report files
   scripts/generate-client-report-final.ts → final client report

Data
   human-queue.json            → operational source of truth (status + history)
   probe-results.json          → live form/availability probe results
   src/lib/directories/MASTER_LIST.ts → authoritative platform list (77 entries)
   seoflowai-temp/agent-profiles/  → persistent browser profiles per platform
   human-submit-out/           → evidence (logs + screenshots) per platform
   client-report/              → generated client report files
```

---

## Automation library (`src/lib/automation/`)

| File | Purpose |
|---|---|
| `browser.ts` | Simple headless browser helpers (legacy/basic nav) |
| `stealth.ts` | Headed persistent-context harness with lightweight anti-detection init script; Cloudflare "Just a moment" detection; CAPTCHA-type detection; manual-CAPTCHA pause; screenshot helper |
| `form-analyzer.ts` | Extracts form structure from the live page; computes form quality (captcha / Cloudflare challenge / non-standard layout) |
| `field-mapper.ts` | Maps company data to form fields: label-rule mapping first, LLM fallback for the rest; social/vanity guard |
| `registration-discovery.ts` | Discovers registration/add-business entry points on a site |
| `cookie-consent.ts` | Handles cookie-consent banners before form interaction |
| `email-verifier.ts` | IMAP `ImapFlow`: waits for a verification link or 4–8 digit code |
| `submission-runner.ts` | Legacy multi-step form runner used by the web app / workers |
| `ai-client.ts` | Shared LLM client for field mapping |

> The web worker agent (`src/workers/submission-agent.ts`) and the API submission flow are driven by `submission-runner.ts`. The **client order** uses the newer `scripts/human-submit.ts`, which reuses `stealth.ts`, `form-analyzer.ts`, `field-mapper.ts`, and `email-verifier.ts`.

---

## Client-order pipeline (`scripts/`)

### `human-submit.ts` — assisted submission
- Loads `human-queue.json`.
- Runs platforms with status `NOT_STARTED`, `FORM_READY`, or `NEEDS_MANUAL` (or filtered via `--only Name[,Other]` / `--priority N`).
- Opens a **headed** persistent browser per platform (`seoflowai-temp/agent-profiles/human-<slug>`), preserves login cookies across runs.
- Detects Cloudflare and CAPTCHA; waits for a human to solve (does not auto-solve).
- Extracts the form, maps fields (rules + AI), fills, and waits up to **180s** for a human to verify and submit.
- Uses a **proof-based** success check (baseline diff + submit listener + confirmation elements) before marking `SUBMITTED`. See `DIRECTORY_ENGINE.md` / `STATUS_MODEL.md`.
- Appends an attempt to `entry.history` and **does not re-run** entries whose last outcome is `SUBMITTED` / `REGISTERED` / `PENDING_*` / `VERIFIED_SUCCESS` (duplicate guard).

### `monitor-submitted.ts` — monitoring
- One careful check per platform: tries known profile URL patterns, falls back to site search, detects CF/404/soft-404/login, saves screenshots as evidence, and only promotes to `VERIFIED_SUCCESS` when a dedicated public profile is found. Never registers or re-submits. See `MONITORING.md`.

### `reprobe-blocked.ts` — re-probe
- One reasonable attempt per previously-blocked platform using a plain headed browser (no stealth/proxies), classifies the result (`BLOCKED`, `FORM_READY`, `NOT_APPLICABLE`), and records evidence. See `MONITORING.md`.

### `audit-notapplicable.ts` — NOT_APPLICABLE classification audit
- Checks questionable NOT_APPLICABLE platforms to determine whether a public listing / claim / add-business path exists. Does not submit or change the queue. See `STATUS_MODEL.md`.

### `generate-client-report.ts` / `generate-client-report-final.ts`
- Render the queue into `client-report/` (CSV, XLSX, Markdown, priority TOP-10, changes diff). See `CLIENT_REPORTING.md`.

### Supporting lib (`scripts/lib/`)
- `client-data.ts` — client-status mapping, overrides, NA categories/comments, result text for the report.
- `client-excel.ts` — Excel summary sheet and styling helpers.

> Many one-off scripts also exist in `scripts/` (probes, previews, tests, old submissions). They are exploratory history, not part of the supported pipeline.

---

## Data model

### `human-queue.json`
An array of directory entries. Each entry:

```json
{
  "name": "Brownbook",
  "url": "https://www.brownbook.net",
  "submissionUrl": "https://www.brownbook.net/add-business",
  "type": "A",
  "priority": 1,
  "humanAction": "...",
  "notes": "...",
  "status": "SUBMITTED",
  "result": "...",
  "history": [
    { "date": "...", "action": "run", "outcome": "SUBMITTED", "error": null, "evidence": ["..."] }
  ]
}
```

`human-queue.json` is the **operational source of truth**. See `STATUS_MODEL.md` for status semantics.

### `src/lib/directories/MASTER_LIST.ts`
The authoritative platform list (77 entries — the real campaign scope). Supplies `name`, `url`, `submissionUrl`, `type` (A–E), `clientCategory`, `method`, `notes`, `priority` used by the pipeline and the report generator.

### Evidence store
`human-submit-out/<slug>/` holds per-platform `human-submit.log`, `presubmit.png`, `postsubmit.png`, plus monitor/re-probe screenshots. `seoflowai-temp/agent-profiles/` holds persistent browser profiles.

---

## Security and operational notes

- Secrets live only in `.env` (git-ignored).
- Anti-bot protections (Cloudflare / CAPTCHA) are surfaced to a human; the harness does **not** solve CAPTCHA or bypass protections automatically, and re-probe explicitly avoids stealth/proxies.
- No credentials, passwords or account tokens are committed to tracked documentation.
- `AGENTS.md` defines operational rules (single-platform runs, block handling, zombie-process hygiene, company data). Read it before running the pipeline.
