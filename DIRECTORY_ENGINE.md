# SEOFlow — Directory Engine

This document describes how the engine actually processes a directory, and how it is organized.

## Architecture: a common engine + directory-specific flows

The current architecture is **not** a single universal adapter that handles every directory. Real directories differ too much for that. Instead SEOFlow uses:

```
COMMON ENGINE  +  DIRECTORY-SPECIFIC ADAPTERS / FLOWS
```

- The **common engine** (`scripts/human-submit.ts` + `src/lib/automation/*`) handles the shared mechanics: browser/session, navigation, form detection, field mapping, filling, submit detection, evidence, history, and status management.
- **Site-specific logic** lives in per-directory adapter notes (`directory-adapters/*.md`) and as inline special-casing in the scripts for unusual flows, dynamic fields, special URLs, special verification, or custom post-submit handling.

> **Factual note:** there is currently **no** universal adapter that successfully handles all directories. Some platforms end in `SUBMITTED` or `REGISTERED`, some require a human (`NEEDS_MANUAL`), some are `BLOCKED` by Cloudflare/IP restriction, and some are `NOT_APPLICABLE`. The engine is reusable; site-specific behavior is captured in adapter notes and script logic as it is discovered.

---

## Generic logic (common engine)

### Browser / session
- **Playwright** automation with a **headed persistent browser context** per platform (`seoflowai-temp/agent-profiles/human-<slug>`) — cookies/logins survive between runs.
- A lightweight anti-detection init script (`src/lib/automation/stealth.ts`) masks common headless markers, but does **not** solve CAPTCHA or bypass Cloudflare automatically — challenges are shown in headed mode for a human.

### Navigation
- `stealthGoto` opens the submission URL and waits for `domcontentloaded` with an extended timeout for Cloudflare.

### Challenge detection
- `isCloudflareChallenge` detects the "Just a moment"/"Checking your browser" interstitial.
- `detectCaptcha` / `checkFormQuality` detect reCAPTCHA (v2/v3), hCaptcha, and Cloudflare Turnstile widgets. A real form that embeds a Turnstile widget is **not** mistaken for a challenge page (guarded by field count).

### Field detection / mapping
- `form-analyzer.extractFormStructure` reads `input/select/textarea/button` from the live page and records selector, type, label, placeholder, required.
- `field-mapper.mapFieldsWithAI` maps company data to fields: **label-rule mapping first** (name/email/phone/website/address/city/state/zip/country/description/category/social…), then an **LLM fallback** for the remainder. A strict social-field guard prevents the LLM from hallucinating social URLs.
- An **email policy** override ensures registration/login/verification fields use the registration email, while business/company/contact fields use the public company email (see `HUMAN_ACTION.md`).

### Human action
- When Cloudflare, CAPTCHA, OAuth, phone/email verification, or an unusual step appears, the engine stops in the headed browser and waits (form submit waits up to **180s**). See `HUMAN_ACTION.md`.

### PROOF-BASED VERIFICATION (submit detection)

The engine does **not** treat the mere presence of "Thank you" / "we will review" text as proof of a successful submission. Instead:

- A **baseline** is captured before any submit (URL + which "success" words are already present on the landing page).
- A **submit listener** marks when a real form submit / submit-button click fires.
- `checkSuccess` returns `SUBMITTED` only if:
  - (a) there was a post-submit navigation to a non-error URL different from baseline, **or**
  - (b) a confirmation element (`CONFIRMATION_SELECTORS`) appeared after submit, **or**
  - (c) a submit fired **and** a new "success" word appeared that was **not** present at baseline.
- If Cloudflare reappears during the poll, the result is `BLOCKED`, not `SUBMITTED`.
- A page that merely says "thank you" / "we will review" on the landing page is **not** proof of submission.

**Verification is a separate step from submission.** `SUBMITTED` only records that a form was actually sent; `VERIFIED_SUCCESS` additionally requires a publicly accessible profile URL with company-specific content, backed by evidence (see `STATUS_MODEL.md` and `MONITORING.md`).

### Evidence
- Pre-submit and post-submit screenshots plus the run log are saved per platform under `human-submit-out/<slug>/`. See `HUMAN_ACTION.md`.

### History
- Every attempt is appended to `entry.history` with `{date, action, outcome, error, evidence}`. Last-outcome duplicate guard skips protected outcomes.

### Status management
- The engine maps results to statuses defined in `STATUS_MODEL.md`. It never sets `VERIFIED_SUCCESS` without a proven public profile URL.

---

## Site-specific logic

Site-specific behavior required by unusual flows is documented in the adapter notes (`DIRECTORY_ADAPTERS.md`) and implemented, where necessary, as inline special cases. Examples observed in practice:

| Platform | Site-specific concern |
|---|---|
| Semfirms | Drupal AJAX forms; submit requires the full legal company name (`Itllect LLC`); jQuery CDN instability; silent validation failures |
| CityLocalPro | reCAPTCHA v2 must be solved manually; post-submit moderation |
| Brownbook | guest add-business form; activation via email then moderation |
| FindUsHere | register (no CAPTCHA/email verify) then fill the profile on the dashboard |
| TopSEOs | `/registration` Drupal form; login is LinkedIn-OAuth only |
| n49 | accessible but no add-business form → classified NOT_APPLICABLE |

---

## Generic directory flow patterns

The following real flow patterns have been observed across the queue:

1. **Standard registration form** — simple add-business form, no account (e.g., Brownbook, FindUsHere add).
2. **Account → Business Profile** — register an account, then create the business profile on a dashboard (e.g., Semfirms, FindUsHere).
3. **Claim existing business** — claim/verify an already-existing listing (phone/domain/postcard verification; e.g., Trustpilot, Foursquare, Express Update, Nextdoor).
4. **Login → Dashboard → Add Business** — log in to an existing account and add/submit a business.
5. **OAuth** — LinkedIn/Google sign-in only (e.g., TopSEOs, Crunchbase, SlideShare); requires a human.
6. **CAPTCHA / Cloudflare** — challenge must be solved by a human; if persistent → `BLOCKED` (e.g., Yellow Pages, Manta, Superpages, EZlocal).
7. **Email verification** — confirmation link/code required (code exists in `email-verifier.ts`; operational only when valid IMAP credentials are configured → otherwise manual).
8. **Manual identity verification** — phone/postcard/domain proof (e.g., Nextdoor postcard PIN, Foursquare phone).
9. **Moderation / pending publication** — submission accepted but not public yet (the `SUBMITTED` monitoring targets).
10. **Paid membership** — listing only with paid membership (e.g., Ft Lauderdale Chamber) → separate client decision.
11. **Partner program** — public agency directory behind a partner application (e.g., HubSpot, Semrush) → manual partner application.
12. **No business listing / NOT_APPLICABLE** — no relevant public business profile available at all.

> **Automation complexity ≠ NOT_APPLICABLE.** A platform with a working claim flow, add-business option, or public agency directory is potentially workable even if automation is hard or requires a human. `NOT_APPLICABLE` is reserved for platforms where the company genuinely cannot get a relevant public profile (see `STATUS_MODEL.md` and the classification-audit workflow).
