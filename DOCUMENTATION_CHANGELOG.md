# SEOFlow AI — Documentation Changelog

> Date: 2026-08-12
> Scope: documentation refresh for the public product release. No application code, UI, database schema, or product behavior was changed.

## What was done

- **README refreshed** — rewritten as public, production-oriented documentation: product origin story, core principle, DISCOVER→REPORT workflow, capabilities, human-in-the-loop, evidence-first verification, live demo + GitHub links, development guide.
- **Production deployment documented** — SEOFlow AI is documented as deployed and publicly accessible (https://seoflowai.vercel.app/), positioned as "an actively developed SaaS product/demo with a live public deployment".
- **77-platform validation documented** — new `REAL_VALIDATION.md` case study with the verified campaign breakdown (5 Placed / 7 Submission sent / 23 Requires action / 14 Unavailable / 28 Not suitable = 77), plus a validation summary in README and PROJECT_OVERVIEW.
- **Project overview created** — new `PROJECT_OVERVIEW.md` (product, why, problem, solution, workflow, surfaces, AI role, automation layer, human-in-the-loop, evidence-first verification, real-world validation, architecture, current status, future direction).
- **Architecture updated** — `ARCHITECTURE.md` refreshed against the actual implementation (Next.js app surfaces, automation library files, client-order pipeline scripts, data model); the layer diagram now reflects only real layers.
- **Workflow documentation updated** — `DIRECTORY_ENGINE.md` (common engine + directory-specific flows, Playwright, persistent context, form extraction, rule/LLM mapping, submit detection, evidence, status management, duplicate protection) and `DIRECTORY_ADAPTERS.md` (generic engine + adapter notes; no claims beyond implemented functionality).
- **Status model updated** — `STATUS_MODEL.md` keeps the actual project statuses, sharpens the distinctions (SUBMITTED ≠ VERIFIED_SUCCESS, REGISTERED ≠ VERIFIED_SUCCESS, BLOCKED ≠ NOT_APPLICABLE) and documents the lifecycle paths (SUBMITTED → monitoring → VERIFIED_SUCCESS / → NEEDS_MANUAL → human action / → BLOCKED → re-probe).
- **Human-in-the-loop clarified** — `HUMAN_ACTION.md` presents human-in-the-loop as a product feature, lists all human scenarios, and fixes the boundaries (no CAPTCHA bypass, no anti-CAPTCHA services, no blind retry, no fake success, no automatic payment).
- **Evidence-first verification documented** — proof-based submit detection and public-profile verification are described in `DIRECTORY_ENGINE.md`, `STATUS_MODEL.md`, and `REAL_VALIDATION.md`; "Thank you" text is explicitly not proof.
- **Monitoring updated** — `MONITORING.md` states that monitoring never re-registers and never blindly re-submits; it only checks for a public result and may promote to VERIFIED_SUCCESS with evidence.
- **Client reporting updated** — `CLIENT_REPORTING.md` documents report files (CSV / XLSX / Markdown, priority, changes, NA audits) and uses the real 77-platform campaign as the reference numbers.
- **Stale snapshots separated from current documentation** — historical handoff/session/test documents (`SEOFlow_AI_HANDOFF.md`, `docs/SEOFlow_HANDOFF.md`, `docs/directory-submission-report.md`, `docs/production-tests/brownbook-submission-report.md`, `final-report-75.md`, `retest-report-2026-08-09.md`, `pool-preview-report.md`, `session-report-2026-01*.md`) are marked **HISTORICAL DOCUMENT** and are no longer presented as the source of truth.
- **Roadmap separated from implemented functionality** — `KNOWLEDGE_BASE.md` is explicitly `STATUS: ROADMAP — NOT IMPLEMENTED`; no RAG/embeddings claims are made for the current implementation.
- **Public documentation security audit completed** — real account passwords and one-time verification tokens scrubbed from tracked documentation (`directory-adapters/findushere.md`, `directory-adapters/semfirms.md`, `session-report-2026-01*.md`); internal DB/job IDs removed from historical docs.

## Security audit — findings and action items

Completed for tracked documentation:
- Passwords in `directory-adapters/findushere.md`, `directory-adapters/semfirms.md`, `session-report-2026-01.md`, `session-report-2026-01-updated.md` → replaced with placeholders.
- One-time email-verification link token (Semfirms) → removed.
- Internal DB/job IDs in `docs/SEOFlow_HANDOFF.md`, `SEOFlow_AI_HANDOFF.md`, `docs/production-tests/brownbook-submission-report.md` → removed/redacted.

**Action items (outside documentation — not changed in this pass):**
- `human-queue.json` (operational data file) contains an account credential in `notes` fields. It is the operational source of truth, so it was not modified here; rotate the credential and scrub the data file in a separate, deliberate step.
- Scratch scripts under `seoflowai-temp/` and evidence under `human-submit-out/` may contain credentials and personal data; they are operational artifacts, not documentation — keep them out of public sharing.
- `.env` / `.env.local` are git-ignored; never commit them.

## Files changed (documentation only)

- `README.md` — rewritten
- `PROJECT_OVERVIEW.md` — new
- `REAL_VALIDATION.md` — new
- `DOCUMENTATION_CHANGELOG.md` — new (this file)
- `ARCHITECTURE.md` — updated
- `DIRECTORY_ENGINE.md` — updated
- `DIRECTORY_ADAPTERS.md` — updated
- `STATUS_MODEL.md` — updated
- `HUMAN_ACTION.md` — updated
- `MONITORING.md` — updated
- `CLIENT_REPORTING.md` — updated
- `KNOWLEDGE_BASE.md` — updated (roadmap status made explicit)
- `AGENTS.md` — public-safe operational rules
- Historical markers added: `SEOFlow_AI_HANDOFF.md`, `docs/SEOFlow_HANDOFF.md`, `docs/directory-submission-report.md`, `docs/production-tests/brownbook-submission-report.md`, `final-report-75.md`, `retest-report-2026-08-09.md`, `pool-preview-report.md`, `session-report-2026-01.md`, `session-report-2026-01-updated.md`
- Secret scrubbing: `directory-adapters/findushere.md`, `directory-adapters/semfirms.md`, `session-report-2026-01.md`, `session-report-2026-01-updated.md`, `docs/SEOFlow_HANDOFF.md`, `SEOFlow_AI_HANDOFF.md`, `docs/production-tests/brownbook-submission-report.md`
