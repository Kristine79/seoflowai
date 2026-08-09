# SEOFlow — Directory Adapters

> This document lists the **currently implemented** adapter material. It contains only real, existing adapters — no fabricated entries.

## What an adapter is here

Adapters in SEOFlow today are **documentation + workflow notes** that capture the site-specific behavior of a platform so the flow can be reproduced reliably. There is **no runtime adapter-plugin registry**: the common engine (`scripts/human-submit.ts` + `src/lib/automation/*`) executes the generic logic, while each adapter note records the platform's unusual registration flow, dynamic fields, special URLs, special verification, and custom post-submit logic.

The adapter pattern reference (structure, field-mapping templates, common patterns, IMAP flow, error handling, checklist) lives in `directory-adapters/README.md`.

> **Note:** `directory-adapters/README.md` is a pattern reference. Its example of treating "Thank you" text as SUCCESS is **superseded** by the proof-based success check in `scripts/human-submit.ts` (see `DIRECTORY_ENGINE.md`). Treat the pattern doc as structural guidance, not as the current success-detection behavior.

## Current adapter library

| Platform | Type | Current implementation | Special cases | Status |
|---|---|---|---|---|
| **Semfirms** | Site-specific (Drupal AJAX) | `directory-adapters/semfirms.md`; account + verification done, profile filled via Playwright | Requires full legal name `Itllect LLC`; jQuery instability; silent validation | VERIFIED_SUCCESS (profile live) |
| **Brownbook** | Site-specific (guest add-business) | `directory-adapters/brownbook.md`; guest submission flow | Activation email then moderation; profile not yet public | SUBMITTED |
| **CityLocalPro** | Site-specific (add-your-business) | `directory-adapters/citylocalpro.md`; form filled, manual reCAPTCHA v2 | Moderation before publication | SUBMITTED |
| **FindUsHere** | Site-specific (register → dashboard) | handled in engine + report (see `src/lib/directories/MASTER_LIST.ts`); no dedicated note file yet | No CAPTCHA, no email-verify | VERIFIED_SUCCESS (profile live) |

`directory-adapters/brownbook.md`, `citylocalpro.md`, `semfirms.md`, and `findushere.md` contain the detailed per-site field maps and learnings. `findushere.md` currently has richer notes than the others; see the notes for field specifics.

## GENERIC / REUSABLE vs SITE-SPECIFIC

- **Generic / reusable** — the common engine mechanics in `DIRECTORY_ENGINE.md`: headed persistent browser, challenge detection, form extraction, rule+AI field mapping, proof-based submit detection, evidence, history, status management.
- **Site-specific** — adapter notes + inline special-casing for platforms that don't fit the standard flow (unusual registration, dynamic fields, special URLs/verification, custom post-submit).

This split (generic workflows + site-specific overrides) is what scales better than a single one-size-fits-all adapter.

## Adapter lifecycle / checklist

From `directory-adapters/README.md`, an adapter is considered usable when the following are recorded: registration URL, auth type, mapped form fields, email-verification flow (if any), submit button behavior, **proof-based** success/profile-URL extraction, error handling (Cloudflare/CAPTCHA/validation), persistent profile path (if login required), documentation note, and the queue status updated in `human-queue.json`.

## Running order

Follow `AGENTS.md`: launch one platform at a time with `--only Name`, kill zombie chrome/node processes before each session, and never re-submit protected/SUBMMITTED/REGISTERED/PENDING/VERIFIED platforms (duplicate guard).
