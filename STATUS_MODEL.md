# SEOFlow — Status Model

SEOFlow uses explicit statuses instead of a single success/failure flag. Each status defines what it means, when it is used, what counts as evidence, whether a retry is allowed, and whether monitoring applies.

## Legend

- **Retry =** may the platform be submitted again?
- **Monitor =** does the monitoring script (`scripts/monitor-submitted.ts`) act on it?

| Status | Meaning | When used | Evidence required | Retry? | Monitor? |
|---|---|---|---|---|---|
| **VERIFIED_SUCCESS** | Placement fully confirmed. A **publicly accessible profile URL** exists with company-specific content. | After monitoring or manual verification finds the live profile. | Screenshot-backed public profile URL (e.g., `https://www.semfirms.com/profile/itllect-llc`). | No | No (done) |
| **SUBMITTED** | The form/application was actually sent, but **publication is not confirmed**. | After the proof-based submit check in `human-submit.ts`. | Real submit proof (navigation / confirmation element / new success signal) + evidence files. | No (duplicate guard) | **Yes** |
| **REGISTERED** | An account exists, but the **public business profile may not exist yet**. | After account creation (e.g., Crunchbase, Medium, Shopify, YouTube). | Account evidence / login working. | No | No |
| **PENDING_VERIFICATION** | Awaiting email/phone verification to activate. | Reserved in the status type; not present in the current queue. | — | No | No |
| **PENDING_MODERATION** | Awaiting platform moderation. | Reserved in the status type; not present in the current queue. | — | No | No |
| **NEEDS_MANUAL** | The workflow stopped waiting for a human step (CAPTCHA, OAuth, phone, submit not finished in the 180s window). | After a manual-action timeout or an unreachable manual step. | Run log + screenshots; reason in `result`. | Yes (re-run with human) | No |
| **FORM_READY** | Submission form found, fill/submit not completed. | After a probe / re-probe found an actionable form. | Availability/evidence. | Yes | No |
| **NOT_STARTED** | Not yet processed. | Reserved in the status type; not present in the current queue. | — | Yes | No |
| **BLOCKED** | **External technical restriction** (Cloudflare, CAPTCHA challenge loop, IP reputation, access denied) — not "we chose not to continue". | After persistent challenge / re-probe remains blocked. | Evidence of the block (CF/403/5xx, screenshot). | Re-probe later | No (re-probe) |
| **FAILED** | Submission failed for technical reasons (unreachable, 404, no form, crash). | After a run error. | Error in `result` / log. | Yes (re-evaluate) | No |
| **NOT_APPLICABLE** | The platform genuinely cannot provide a relevant public business/agency/company profile. | After classification evidence (site has no listing/claim/add-business path, government/aggregator/social-only). | Classification reason; see audit workflow below. | No | No |

## Key distinctions

- **VERIFIED_SUCCESS requires a proven public profile URL.** `SUBMITTED` is *not* a published profile, and `REGISTERED` is *not* a published profile.
- **BLOCKED** means an external technical block (Cloudflare / CAPTCHA / IP), recorded with the reason — it is not a judgment about whether the platform is relevant.
- **NOT_APPLICABLE** means the platform is really not suited for this type of placement — set only with classification evidence, not merely because a form was hard to find or automation was hard.

### Example lifecycle

```
SUBMITTED
   ↓ monitoring
VERIFIED_SUCCESS           (profile appears)
```
or
```
SUBMITTED
   ↓ monitoring
SUBMITTED / PENDING        (profile not yet public → monitor again later)
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

In the most recent audit (2026-08-08), several platforms (Trustpilot, Foursquare, Nextdoor, Wellfound/AngelList, Express Update, HubSpot, Semrush) were reclassified from NOT_APPLICABLE to a workable status because a claim / add-business / public directory path exists — illustrating exactly this principle.

---

## Current queue state

Snapshot of `human-queue.json` as of **2026-08-08** (git `361b41d`), 76 entries:

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

`VERIFIED_SUCCESS`: **Semfirms** (`https://www.semfirms.com/profile/itllect-llc`) and **FindUsHere** (`https://www.find-us-here.com/businesses/Itllect-LLC-Plantation-Florida-USA/34578398/`).

The six `SUBMITTED` entries are the monitoring targets: Brownbook, CityLocalPro, DesignRush, GoodFirms, Digital Agency Net, Plantation Chamber.

> These counts come from the live queue and will change; re-derive them from `human-queue.json` before reporting (see `CLIENT_REPORTING.md`).
