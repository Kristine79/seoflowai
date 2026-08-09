# SEOFlow AI

SEOFlow is a system for **systematically placing a business/agency in relevant online directories** and **managing the full lifecycle of each placement** — from classification and submission to public-profile verification, ongoing monitoring, and client reporting.

SEOFlow is **not** a fully-automatic "submit everywhere" tool. Real directories differ and most require at least one human step (CAPTCHA, Cloudflare, OAuth, email/phone verification, moderation, paid membership). SEOFlow:

- automates the repetitive parts (navigate, detect form, map fields, fill);
- stops safely when a human action is required and records that state;
- keeps **evidence** of what actually happened;
- keeps a **history** of every attempt to prevent duplicates;
- never reports success without proof.

> The core principle: *automate what can be automated, involve a human when necessary, and never claim a submission or a placement without evidence.*

---

## Main workflow

```
Client Data
   ↓
Directory List
   ↓
Directory Classification
   ↓
Registration / Claim
   ↓
Human Action when required   ← CAPTCHA, Cloudflare, OAuth, phone/email verification
   ↓
Submission Verification
   ↓
Public Profile Verification  ← evidence: a real, publicly accessible profile URL
   ↓
Monitoring                   ← repeatable checks over time (no re-submission)
   ↓
Client Report
```

---

## What the system actually does

### Automation
The common engine (Playwright + a stealth-aware headed browser harness) can open a submission page, detect the form structure (`src/lib/automation/form-analyzer.ts`), map company data to fields using label rules first and an LLM fallback (`src/lib/automation/field-mapper.ts`), fill the form, and detect whether a submit really happened. See `DIRECTORY_ENGINE.md`.

### Human-in-the-loop
When a step requires a human — CAPTCHA, Cloudflare challenge loop, OAuth, phone verification, payment, or an unusual flow — the workflow stops in a headed browser, waits for the human (up to 180s in `scripts/human-submit.ts`), and records the result. See `HUMAN_ACTION.md`.

> Currently, auto email-verification via IMAP exists in code (`src/lib/automation/email-verifier.ts`) but is **not operational**: the registration inbox `itllect.marketing@gmail.com` has invalid IMAP credentials, so email-verification steps are handled manually where required.

### Evidence
For every important action, evidence is saved: pre/post-submit screenshots, run logs, verification screenshots, and public profile URLs. Evidence goes into `human-submit-out/<platform>/`. Nothing is claimed as `VERIFIED_SUCCESS` without a screenshot-backed public profile URL.

### History
Every attempt is appended to the queue entry:

```json
{ "date": "...", "action": "run", "outcome": "SUBMITTED", "error": null, "evidence": ["..."] }
```

History prevents duplicate attempts, provides an audit trail, and feeds monitoring, re-probe, and client reporting. See `STATUS_MODEL.md`.

### Monitoring
`scripts/monitor-submitted.ts` re-checks SUBMITTED platforms later to see whether a public profile appeared. It never registers again, never submits again, and does not change a status without evidence. See `MONITORING.md`.

### Re-probe
`scripts/reprobe-blocked.ts` re-checks old `BLOCKED` platforms with one reasonable attempt per site — no Cloudflare bypass, no stealth hacks, no anti-captcha services. See `MONITORING.md`.

### Client reporting
`scripts/generate-client-report.ts` renders the queue into `client-report/` (CSV, XLSX, Markdown, priority TOP-10). `human-queue.json` is the operational source of truth; the client report is a human-readable presentation layer. See `CLIENT_REPORTING.md`.

---

## Current state

`human-queue.json` snapshot as of **2026-08-08** (git `361b41d`), 76 queue entries:

| Status | Count |
|---|---|
| VERIFIED_SUCCESS | 2 |
| SUBMITTED | 6 |
| REGISTERED | 4 |
| NEEDS_MANUAL | 14 |
| FORM_READY | 1 |
| BLOCKED | 12 |
| FAILED | 12 |
| NOT_APPLICABLE | 25 |

`VERIFIED_SUCCESS`: Semfirms and FindUsHere (both public profile URLs confirmed). The six SUBMITTED platforms are waiting on moderation/publication and are the monitoring targets.

---

## Documentation

| Document | Content |
|---|---|
| `ARCHITECTURE.md` | Actual repo layout and system layers |
| `DIRECTORY_ENGINE.md` | Common engine + shared flow patterns |
| `DIRECTORY_ADAPTERS.md` | Current adapter library (real adapters only) |
| `STATUS_MODEL.md` | Status semantics, evidence, retry/monitoring policy + current counts |
| `HUMAN_ACTION.md` | When and how a human is involved |
| `MONITORING.md` | Monitoring and re-probe scripts |
| `KNOWLEDGE_BASE.md` | **Roadmap**: knowledge base / RAG / flow classification (not implemented) |
| `CLIENT_REPORTING.md` | Client report files and generation |
| `AGENTS.md` | Operational rules for client-order execution |

Historical handoff documents (`SEOFlow_AI_HANDOFF.md`, `docs/SEOFlow_HANDOFF.md`, `session-report-*.md`) record earlier stages of the project and **may contain outdated claims**; do not use them as the source of truth. Current-state data lives in `human-queue.json` and this documentation set.

---

## Running the client-order pipeline

Launch **one platform at a time** (batches corrupt `human-queue.json` via zombie processes):

```bash
# show the queue
npx tsx scripts/human-submit.ts --queue

# manual assisted run for one platform
npx tsx scripts/human-submit.ts --run --only "Brownbook"

# with attempted auto-registration (requires valid IMAP creds)
npx tsx scripts/human-submit.ts --run --register --only "GoodFirms"
```

Monitoring and re-probe:

```bash
npx tsx scripts/monitor-submitted.ts
npx tsx scripts/reprobe-blocked.ts
```

Client report:

```bash
npx tsx scripts/generate-client-report.ts
```

Rules of execution (blocks, duplicates, zombie processes, company data):

- when a site blocks access (Cloudflare / "Access denied" / IP restriction) — do **not** repeat requests; record `BLOCKED`/`FAILED` with the external-block reason and move on;
- before each session, kill zombie chrome/node processes;
- old `SUCCESS` statuses are unverified — re-run before including in a report;
- registration email `itllect.marketing@gmail.com`; IMAP creds invalid — no auto email verification;
- company: ITllect / ITllect Consulting Inc. / https://itllect.com / info@itllect.com / (123) 636-4087 / 100 N University Dr, Coral Springs FL 33071 US.

See `AGENTS.md` for the authoritative operational rules.

---

## Development

```bash
npm run dev       # Next.js web app
npm run build     # production build
npm run lint      # eslint
npm run submission-agent        # web worker agent (looping)
npm run submission-agent:once   # web worker agent (single pass)
```

Environment variables (`.env`, see `.env.example`):

- `DATABASE_URL` — PostgreSQL (app DB, Prisma)
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL` — LLM for field mapping
- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_HOST`, `EMAIL_PORT` — IMAP (currently non-functional)