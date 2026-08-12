# SEOFlow AI — Real-World Validation

> A technical case study of the first real client campaign processed with SEOFlow AI.
> These numbers describe **one specific real campaign** — they are not a promised or typical conversion rate of the product.

## Campaign summary

A client order to place a company (ITllect, https://itllect.com) into SEO and business directories resulted in a campaign of **77 platforms**.

| Result | Count |
|---|---:|
| Placed | 5 |
| Submission sent | 7 |
| Requires action | 23 |
| Platform unavailable / externally blocked | 14 |
| Not suitable | 28 |
| **Total** | **77** |

77 = 5 + 7 + 23 + 14 + 28.

The machine-readable campaign report is published at [`public/SEOFlow-77-Platform-Campaign-Report.xlsx`](public/SEOFlow-77-Platform-Campaign-Report.xlsx). The operational data lives in `human-queue.json`.

## Workflow used

```
DISCOVER
   ↓
ANALYZE
   ↓
PREPARE
   ↓
SUBMIT
   ↓
VERIFY
   ↓
REPORT
```

1. **DISCOVER** — the target list of 77 platforms was assembled from the client's directory list plus platforms identified during research.
2. **ANALYZE** — every platform was classified: business directory, agency marketplace, review platform, social/content platform, partner program, government resource, etc. Each class maps to a workflow type (A–E) and a placement path.
3. **PREPARE** — platform-specific content was prepared from the company data (name, legal name, description, contacts, NAP).
4. **SUBMIT** — the common engine automated the repetitive mechanics; where a human step was required (CAPTCHA, Cloudflare, OAuth, verification), the workflow stopped and handed over to a human in a headed browser.
5. **VERIFY** — outcomes were verified with evidence. `VERIFIED_SUCCESS` required a publicly accessible profile URL with company-specific content.
6. **REPORT** — the client received a structured report: summary counters, per-platform status, reason, next action, profile URLs (CSV / XLSX / Markdown).

## Result breakdown (verified data)

### 5 — Placed (`VERIFIED_SUCCESS`)

Public profiles confirmed with evidence (screenshots + profile URLs), including:

- **Semfirms** — https://www.semfirms.com/profile/itllect-llc
- **FindUsHere** — https://www.find-us-here.com/businesses/Itllect-LLC-Plantation-Florida-USA/34578398/
- **ProvenExpert** — https://www.provenexpert.com/itllect/ (verified via monitoring after publication)

### 7 — Submission sent (`SUBMITTED`)

The form/application was actually sent (proof-based submit check), but the public profile is **not yet confirmed** — the platforms are in moderation or awaiting publication. These are the monitoring targets: Brownbook, CityLocalPro, DesignRush, GoodFirms, Digital Agency Net, Plantation Chamber and other `SUBMITTED` entries (the exact set evolves; the final report snapshot lists 7 in this category).

### 23 — Requires action (`NEEDS_MANUAL` / human step)

The workflow stopped safely waiting for a human step: OAuth login (LinkedIn/Google), CAPTCHA, account verification, partner application, or a submit that did not complete within the window. Examples: TopSEOs, Trustpilot, Foursquare Business, Nextdoor Business, Shopify Partners, Semrush Agency Partners, Stripe Partner, Alignable.

### 14 — Platform unavailable / externally blocked (`BLOCKED` / `FAILED`)

External technical restrictions prevented access: Cloudflare challenges, WAF/bot protection, IP reputation blocks, "Access denied", unreachable or broken submission pages. Examples: Yellow Pages, Manta, Hotfrog, Superpages, EZlocal, Sortlist, The Manifest, Crunchbase, Medium, G2. Per operational rules, blocked platforms are **not** retried in a loop — they are recorded with the block reason and re-probed later.

### 28 — Not suitable (`NOT_APPLICABLE`)

The platform genuinely cannot provide a relevant public profile for this company: government/municipal resources, SaaS marketplaces with no agency profile, social platforms without business listing relevance, aggregators without free listings, etc. `NOT_APPLICABLE` is set only with classification evidence — never because a form was hard to find or automation was hard.

## Representative scenarios

### Automated submission

A directory with a standard add-business form and no external protection: the engine navigated, extracted the form, mapped fields (rule-based first, LLM fallback), filled the form, detected the actual submit, and recorded evidence. Result: `SUBMITTED`.

### Human action

A form with reCAPTCHA v2 or an OAuth-only login (e.g., TopSEOs LinkedIn sign-in): the engine stopped in a headed browser, pre-filled what it could, and handed over. The human solved the challenge or completed the flow; the result was recorded back into the campaign. Human-in-the-loop is a product feature, not a failure.

### External blocking

Cloudflare "Just a moment" or an IP-reputation block: the engine recorded the block with evidence and **did not** loop re-requests. The platform was classified `BLOCKED` and scheduled for a later re-probe. No CAPTCHA bypass, no anti-captcha services.

### Moderation

A submission was accepted but the listing was not public yet (e.g., Brownbook activation email, CityLocalPro moderation). Status: `SUBMITTED` — the monitoring step re-checks later whether a public profile appeared.

### Verification

`VERIFIED_SUCCESS` was set only when a dedicated public profile URL with company-specific content was found and captured in screenshots (e.g., Semfirms, FindUsHere). "Thank you" text or a generic success page is **not** evidence.

### Unavailable platform

A directory that is reachable but has no add-business/claim path for this company type (e.g., n49) was classified `NOT_APPLICABLE` with the classification reason recorded — not `FAILED`, not `BLOCKED`.

## What the validation demonstrated

- **Directory workflows are heterogeneous.** Every platform differs in form structure, validation, auth, and post-submit behavior. A single universal "submit everywhere" flow does not exist in practice.
- **Generic automation alone is insufficient.** Many platforms require registration, OAuth, verification or moderation steps that a script cannot and should not force.
- **Human-in-the-loop is necessary.** The campaigns only progressed where the system stopped safely and handed the sensitive step to a human, then recorded the outcome.
- **Evidence is required for reliable reporting.** Without screenshots and proof-based checks, "submitted" and "verified" are indistinguishable from guesses.
- **Automation must stop safely when external restrictions occur.** Blocked platforms were recorded once with the reason and left alone, avoiding repeated requests, IP-reputation damage and wasted time.

## Key principle

**A submitted listing is not automatically a verified placement. `VERIFIED_SUCCESS` requires evidence.**
