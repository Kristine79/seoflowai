# SEOFlow AI

AI-assisted platform for managing SEO directory campaigns from research to verified results.

🚀 **Live Demo:** https://seoflowai.vercel.app/

**GitHub:** https://github.com/Kristine79/seoflowai

## Origin story

SEOFlow AI was born from a real problem. A client placed an order to list their company across a large number of SEO and business directories. Instead of doing the same repetitive operations by hand, the project owner automated the process — and the result grew into a dedicated AI tool, which later became a standalone SaaS product.

## Core principle

> "Automate the repetitive work, stop when a human is required, and never claim success without evidence."

SEOFlow is **not** a "submit everywhere" bot. Real directories differ too much for blind automation: CAPTCHA, Cloudflare, OAuth, email/phone verification, moderation, paid memberships. SEOFlow automates what can be automated safely, stops when a human is required, records every state with evidence, and reports nothing as verified without proof.

## Main workflow

```
DISCOVER
   ↓
AUDIT
   ↓
SELECT
   ↓
PREPARE
   ↓
SUBMIT
   ↓
VERIFY
   ↓
MONITOR
   ↓
REPORT
```

## Key capabilities

| Capability | What it does |
|---|---|
| **Directory research** | Build and maintain a target directory list from client data. |
| **SEO audit** | Evaluate directories for relevance, accessibility and placement feasibility. |
| **Platform prioritization** | Rank platforms by expected effort-to-result ratio (see `CLIENT_REPORTING.md`). |
| **AI-assisted content preparation** | Prepare platform-specific company profiles and descriptions. |
| **Platform-specific content** | Tailor the same company data to each platform's fields and requirements. |
| **Campaign management** | Track every platform through its full lifecycle with a complete status model. |
| **Browser automation** | Playwright-based engine: navigation, form extraction, field mapping, filling, submit detection. |
| **Human-in-the-loop** | Stop safely when a human action is required; record the outcome in the campaign. |
| **Evidence capture** | Screenshots and logs for every important action — nothing is claimed without proof. |
| **Status history** | Append-only attempt history per platform; duplicate protection. |
| **Monitoring** | Re-check submitted platforms later for a public profile (never re-submits). |
| **Reporting** | Client-facing reports: CSV, XLSX, Markdown, priority lists. |

## Human-in-the-loop

SEOFlow does **not** try to automatically bypass CAPTCHA, Cloudflare, OAuth, email/phone verification or other external restrictions.

When automation is impossible or unsafe, the system hands the action to a human — in a headed browser with the form already filled — and records the human's result back into the campaign with evidence.

> **AI-assisted automation, not blind automation.**

Human-in-the-loop is a product feature, not an automation failure. See `HUMAN_ACTION.md`.

## Evidence-first verification

A submitted listing is not automatically a verified placement. `VERIFIED_SUCCESS` requires a proven, publicly accessible profile URL with company-specific content, backed by evidence (screenshots). "Thank you" text on a landing page is **not** proof. See `STATUS_MODEL.md` and `DIRECTORY_ENGINE.md`.

## Real-world validation

SEOFlow has been validated on a **real SEO directory campaign of 77 platforms** (a client order, not a synthetic benchmark):

| Result | Count |
|---|---:|
| Placed | 5 |
| Submission sent | 7 |
| Requires action | 23 |
| Platform unavailable / externally blocked | 14 |
| Not suitable | 28 |
| **Total** | **77** |

77 = 5 + 7 + 23 + 14 + 28.

These numbers describe one specific real campaign — they are **not** a promised conversion rate of the product. The campaign encountered registration flows, moderation, CAPTCHA, Cloudflare, OAuth, manual verification, external blocking, unsuitable platforms, and directory-specific workflows. The main lesson: **a submitted listing is not automatically a verified placement — `VERIFIED_SUCCESS` requires evidence.**

Detailed case study: [`REAL_VALIDATION.md`](REAL_VALIDATION.md) · Machine-readable campaign report: [`public/SEOFlow-77-Platform-Campaign-Report.xlsx`](public/SEOFlow-77-Platform-Campaign-Report.xlsx)

## Documentation

| Document | Content |
|---|---|
| [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) | Product, problem, solution, architecture and current status |
| [`REAL_VALIDATION.md`](REAL_VALIDATION.md) | Real-world 77-platform campaign case study |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Actual repo layout and system layers |
| [`DIRECTORY_ENGINE.md`](DIRECTORY_ENGINE.md) | Common engine: Playwright, mapping, proof-based submit detection |
| [`DIRECTORY_ADAPTERS.md`](DIRECTORY_ADAPTERS.md) | Generic engine + directory-specific logic |
| [`STATUS_MODEL.md`](STATUS_MODEL.md) | Status semantics, evidence, lifecycle, retry/monitoring policy |
| [`HUMAN_ACTION.md`](HUMAN_ACTION.md) | When and how a human is involved |
| [`MONITORING.md`](MONITORING.md) | Post-submission monitoring and re-probe |
| [`CLIENT_REPORTING.md`](CLIENT_REPORTING.md) | Client report files and generation |
| [`KNOWLEDGE_BASE.md`](KNOWLEDGE_BASE.md) | **Roadmap only** — knowledge base / RAG (not implemented) |
| [`AGENTS.md`](AGENTS.md) | Operational rules for client-order execution |
| [`DOCUMENTATION_CHANGELOG.md`](DOCUMENTATION_CHANGELOG.md) | History of this documentation set |

Historical handoff documents (`SEOFlow_AI_HANDOFF.md`, `docs/SEOFlow_HANDOFF.md`, `session-report-*.md`, `final-report-75.md`, etc.) describe earlier development stages and are explicitly marked **HISTORICAL** — they are retained for project history, not as the current source of truth. Current-state data lives in `human-queue.json` and the current documentation set.

## Repo layout (short)

```
src/app/                 → Next.js web application (marketing site + dashboard UI)
src/components/          → shared UI components
src/lib/automation/      → browser automation library (Playwright, forms, mapping)
src/lib/directories/     → authoritative platform list (MASTER_LIST.ts)
src/workers/             → background submission agent
scripts/                 → client-order pipeline (human-submit, monitor, reprobe, report)
directory-adapters/      → per-directory workflow notes
human-queue.json         → operational source of truth (status + history)
client-report/           → generated client report files
```

## Development

```bash
npm install
npm run dev       # Next.js web app
npm run build     # production build
npm run lint      # eslint
npm run submission-agent        # web worker agent (looping)
npm run submission-agent:once   # web worker agent (single pass)
```

Environment variables (see `.env.example`):

- `DATABASE_URL` — PostgreSQL (app DB, Prisma)
- `OPENAI_API_KEY`, `OPENAI_MODEL` — LLM for field mapping and content preparation

## Production status

SEOFlow AI is deployed and publicly accessible: **https://seoflowai.vercel.app/**

It is an actively developed SaaS product/demo with a live public deployment — the web application (landing, dashboard, campaigns, audit, company profile) and the automation pipeline that processes real directory campaigns.
