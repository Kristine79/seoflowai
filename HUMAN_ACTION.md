# SEOFlow — Human Action

SEOFlow deliberately does not try to automate every directory. A number of steps require a human, and the system handles that by stopping safely, waiting for the human in a headed browser, and recording what happened with evidence.

## When a human action is required

- **CAPTCHA** (reCAPTCHA v2/v3, hCaptcha, Cloudflare Turnstile) — the widget is shown on screen for the human to solve; the harness does not solve it automatically.
- **Cloudflare challenge** ("Just a moment" / "Checking your browser") — shown in headed mode for the human to clear; if it does not clear, the result is `NEEDS_MANUAL` (or `BLOCKED` if it reappears during the submit poll).
- **OAuth** (LinkedIn / Google / Facebook login) — cannot be automated (e.g., TopSEOs, Crunchbase, SlideShare).
- **Phone / postcard / domain verification** (e.g., Nextdoor postcard PIN, Foursquare phone, Express Update claim) — done by the human on the platform.
- **Payment / paid membership** — never entered automatically; requires a separate client decision.
- **Unusual or unfinished steps** — e.g., a submit that does not complete within the window, partner applications, manual review.

## How it works in `scripts/human-submit.ts`

1. A **headed** persistent browser opens the platform using its stored profile (`seoflowai-temp/agent-profiles/human-<slug>`), so existing logins are preserved.
2. Cloudflare / CAPTCHA are detected; the script waits (with a timeout) for the human to solve them.
3. The form is extracted and fields are auto-filled (rule + AI mapping). An **email policy** applies:
   - registration/login/verification fields get the registration email (`itllect.marketing@gmail.com`);
   - business/company/contact fields get the public company email (`info@itllect-agency.com`).
4. A **baseline** is captured and a submit listener is attached **before** the human phase.
5. A **180-second window** is shown for the human to verify fields and click Submit/Register.
6. The result is evaluated with the **proof-based** check: a submit is only confirmed via post-submit navigation, a confirmation element, or a submit-firing plus a new success signal — never by pre-existing "thank you" text. If no proof appears in the window, the status is `NEEDS_MANUAL`.
7. **Evidence** is saved per platform under `human-submit-out/<slug>/`: `presubmit.png`, `postsubmit.png`, and `human-submit.log`.

## Email verification (current limitation)

Automated email verification exists in code (`src/lib/automation/email-verifier.ts`, using `ImapFlow`), and `human-submit.ts` has an `--register` mode that attempts it. **Currently it is not operational** because the IMAP credentials for the registration inbox (`itllect.marketing@gmail.com`) are invalid — there is no auto email verification. Email-verification steps are therefore handled manually where a platform requires them.

## Duplicate protection

Before re-running a platform, `human-submit.ts` checks the last attempt outcome. Platforms whose last outcome is `SUBMITTED`, `REGISTERED`, `PENDING_VERIFICATION`, `PENDING_MODERATION`, or `VERIFIED_SUCCESS` are **skipped** — no blind re-submission. If a known account or public profile URL already exists, a reminder is printed before running.

## Rules

- Never create test registrations on real directories.
- Never create duplicate accounts/listings without evidence the previous attempt failed.
- Never enter payment information automatically.
- Never treat generic "success" text as proof of submission.
- Never repeatedly retry a protected website; when a site blocks access, record `BLOCKED`/`FAILED` with the external-block reason and move to the next platform (see `AGENTS.md`).
- No stealth hacks / anti-captcha services to force past protections — challenges are always surfaced to the human.
