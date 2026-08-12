# SEOFlow — Status Model

SEOFlow uses explicit statuses instead of a single success/failure flag. Each status defines what it means, when it is used, what counts as evidence, whether a retry is allowed, and whether monitoring applies.

## Legend

- **Retry =** may the platform be submitted again?
- **Monitor =** does the monitoring script (`scripts/monitor-submitted.ts`) act on it?

| Status | Meaning | When used | Evidence required | Retry? | Monitor? |
|---|---|---|---|---|---|
| **VERIFIED_SUCCESS** | Placement fully confirmed. A **publicly accessible profile URL** exists with company-specific content. | After monitoring or manual verification finds the live profile. | Screenshot-backed public profile URL (e.g., https://www.semfirms.com/profile/itllect-llc). | No | No (done) |
| **SUBMITTED** | The form/application was actually sent, but **publication is not confirmed**. | After the proof-based submit check in `human-submit.ts`. | Real submit proof (navigation / confirmation element / new success signal) + evidence files. | No (duplicate guard) | **Yes** |
| **REGISTERED** | An account exists, but the **public business profile may not exist yet**. | After account creation (e.g., Sitejabber). | Account evidence / login working. | No | No |
| **PENDING_VERIFICATION** | Awaiting email/phone verification to activate. | Reserved in the status type; not present in the current queue. | — | No | No |
| **PENDING_MODERATION** | Awaiting platform moderation. | Reserved in the status type; not present in the current queue. | — | No | No |
| **NEEDS_MANUAL** | The workflow stopped waiting for a human step (CAPTCHA, OAuth, phone, submit not finished in the 180s window). | After a manual-action timeout or an unreachable manual step. | Run log + screenshots; reason in `result`. | Yes (re-run with human) | No |
| **FORM_READY** | Submission form found, fill/submit not completed. | After a probe / re-probe found an actionable form. | Availability/evidence. | Yes | No |
| **NOT_STARTED** | Not yet processed. | Reserved in the status type; not present in the current queue. | — | Yes | No |
| **BLOCKED** | **External technical restriction** (Cloudflare, CAPTCHA challenge loop, IP reputation, access denied) — not "we chose not to continue". | After persistent challenge / re-probe remains blocked. | Evidence of the block (CF/403/5xx, screenshot). | Re-probe later | No (re-probe) |
| **FAILED** | Submission failed for technical reasons (unreachable, 404, no form, crash). | After a run error. | Error in `result` / log. | Yes (re-evaluate) | No |
| **NOT_APPLICABLE** | The platform genuinely cannot provide a relevant public business/agency/company profile. | After classification evidence (site has no listing/claim/add-business path, government/aggregator/social-only). | Classification reason; see audit workflow below. | No | No |

## Key distinctions

- **`SUBMITTED` ≠ `VERIFIED_SUCCESS`.** A submitted form is not a published profile. `VERIFIED_SUCCESS` additionally requires a proven public profile URL with company-specific content.
- **`REGISTERED` ≠ `VERIFIED_SUCCESS`.** An account exists, but the public business profile may not.
- **`BLOCKED` ≠ `NOT_APPLICABLE`.** `BLOCKED` is an external technical restriction (Cloudflare / CAPTCHA / IP) recorded with the reason — it says nothing about whether the platform is relevant. `NOT_APPLICABLE` means the platform is genuinely not suited for this type of placement, set only with classification evidence — not merely because a form was hard to find or automation was hard.

## Lifecycle

```
SUBMITTED
   ↓ monitoring
VERIFIED_SUCCESS           (public profile found + evidence)
```
or
```
SUBMITTED
   ↓ monitoring
SUBMITTED / PENDING        (profile not yet public → monitor again later)
```
or
```
SUBMITTED
   ↓
NEEDS_MANUAL               (human step required — CAPTCHA, OAuth, verification)
   ↓ human action
continue                   (form completed by the human, re-evaluated)
```
or
```
SUBMITTED
   ↓
BLOCKED                    (external restriction reappears)
   ↓ re-probe later
FORM_READY / still BLOCKED / NOT_APPLICABLE
```

---

## NOT_APPLICABLE classification audit workflow

A platform must **not** be marked `NOT_APPLICABLE` just because: a form wasn't found, the site is an SPA, login/claim is required, there is a CAPTCHA, or email/phone verification is needed. If a public business/company/agency profile or a claim flow exists, the platform is potentially workable.

The audit workflow is implemented by `scripts/audit-notapplicable.ts` (and `scripts/check-partner-directories.ts` for partner programs) and documented for the client in `client-report/not-applicable-*.md`:

```
NOT_APPLICABLE
   ↓ classification audit
confirmed NA            (no listing/claim/add-business path)
```
or
```
NOT_APPLICABLE
   ↓ classification audit
reclassified            (e.g., to NEEDS_MANUAL when a listing/claim path exists)
```

In the 2026-08 audit, several platforms (Trustpilot, Foursquare, Nextdoor, Wellfound/AngelList, Express Update, HubSpot, Semrush) were reclassified from NOT_APPLICABLE to a workable status because a claim / add-business / public directory path exists — illustrating exactly this principle.

---

## Current queue state (reference)

`human-queue.json` is the **operational source of truth**; counts change as the pipeline runs. As of 2026-08-11, the live queue contains 78 entries (77 unique platforms in the campaign list — one duplicate entry exists in the operational file) with statuses including: `VERIFIED_SUCCESS` (ProvenExpert, Semfirms, FindUsHere), `SUBMITTED`, `REGISTERED` (Sitejabber), `NEEDS_MANUAL`, `BLOCKED`, `FAILED`, `NOT_APPLICABLE`, `NOT_RELEVANT`, `SUCCESS` (legacy).

The client-facing final report for the 77-platform campaign (2026-08-11) maps these to: **5 Placed · 7 Submission sent · 23 Requires action · 14 Platform unavailable · 28 Not suitable** — see `REAL_VALIDATION.md`.

> Always re-derive exact counts from `human-queue.json` before reporting (see `CLIENT_REPORTING.md`). Old snapshots in historical documents (e.g., 75/76-platform counts) describe earlier stages and are not current data.
