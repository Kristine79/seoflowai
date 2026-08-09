# SEOFlow — Monitoring & Re-probe

## Monitoring: `scripts/monitor-submitted.ts`

### Purpose
After a form/application is submitted, the public profile may take time to appear (moderation, publication). Monitoring re-checks a submitted platform later to determine whether a public profile now exists.

Monitoring **must not**:

- re-register or re-submit;
- create duplicate accounts/listings;
- change a status without evidence.

### How it works
For each target platform, one careful check is performed:

1. Try known public-profile URL patterns first.
2. Fall back to a site search if needed.
3. Detect and ignore Cloudflare interstitials, hard 404s, soft-404 pages, thin/no-result pages, and login pages.
4. A profile is only confirmed when the page shows **company-specific content** and, where possible, a dedicated profile link or `h1` heading — not merely an HTTP 200 or a search page mentioning the name.
5. Save evidence screenshots under `human-submit-out/<slug>/`.
6. Append a `history` entry (`action: "verify"`).
7. Only promote to `VERIFIED_SUCCESS` when a dedicated public profile is found; otherwise keep the previous status.

### Lifecycle

```
SUBMITTED
   ↓ monitoring
VERIFIED_SUCCESS         (public profile found + evidence)
```
or
```
SUBMITTED
   ↓ monitoring
SUBMITTED / PENDING      (not public yet → monitor again later)
```

### Target set
The current TARGETS are the six `SUBMITTED` platforms: Brownbook, CityLocalPro, DesignRush, GoodFirms, Digital Agency Net, Plantation Chamber.

### Run
```bash
npx tsx scripts/monitor-submitted.ts
```

Monitoring is repeatable (e.g., weekly or bi-weekly) without creating duplicates. 2 platforms are already `VERIFIED_SUCCESS` (Semfirms, FindUsHere) and are not in the monitoring target set.

---

## Re-probe: `scripts/reprobe-blocked.ts`

### Purpose
Some older `BLOCKED` platforms may become accessible later (protection rules change, IP reputation recovers). Re-probe re-checks them so they can be re-queued when appropriate.

### Rules
- **Do not bypass Cloudflare** and do not use stealth / anti-captcha services. Re-probe uses a plain headed browser.
- **Do not spam the site** — one reasonable attempt per platform.
- Classify the result: still `BLOCKED`, new `FORM_READY` (actionable), or `NOT_APPLICABLE` (accessible but no listing form).
- **Save evidence** (screenshot + access notes) for each attempt.
- After a short wait for Cloudflare to self-clear, if it remains blocked, keep it `BLOCKED` with the reason.

### Run
```bash
npx tsx scripts/reprobe-blocked.ts
```

### Current re-probe outcomes
In the 2026-08-08 pass, most previously-blocked platforms stayed `BLOCKED` (Cloudflare / 403 / IP restriction) and are documented in `CLIENT_REPORTING.md`. Two platforms improved and were re-classified (e.g., to `NEEDS_MANUAL`), and `n49` was confirmed `NOT_APPLICABLE` (accessible but no add-business form).

---

## Related classification audit

`scripts/audit-notapplicable.ts` is a separate, non-destructive check of questionable `NOT_APPLICABLE` platforms (does a public listing / claim / add-business path exist?). It does not submit or modify the queue. See `STATUS_MODEL.md`.
