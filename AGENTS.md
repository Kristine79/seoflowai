# SEOFlow AI — project rules

Operational rules for client-order execution (directory submission campaigns).

## Site block handling (client order execution)

When a directory blocks access — any of:
- "Sorry, you have been blocked"
- Cloudflare block / challenge loop
- "Access denied"
- IP restricted

Rules:
1. Do NOT repeat requests to that domain.
2. Fix the entry status as `FAILED` / `EXTERNAL BLOCK` with reason:
   - Cloudflare/access restriction
   - possible IP reputation block
   - automation detected
3. Never loop reopening the same site.
4. Move on to the next platforms with higher completion chances.
5. Record the block in human-queue.json and the client report.

## Execution conventions
- Launch human-submit one platform at a time via `--only Name` (batches corrupt human-queue.json via zombie processes).
- Before each session kill zombie chrome/node processes.
- Old SUCCESS statuses are unverified; re-run before including in the report.
- Registration email: itllect.marketing@gmail.com (IMAP creds invalid — no auto email verification).
- Company: name "ITllect", legalName "ITllect Consulting Inc.", https://itllect.com, info@itllect.com, (123) 636-4087, 100 N University Dr, Coral Springs FL 33071 US.

## Duplicate protection
- Never re-run platforms whose last outcome is `SUBMITTED` / `REGISTERED` / `PENDING_*` / `VERIFIED_SUCCESS` (duplicate guard in human-submit.ts).
- Never create duplicate accounts/listings without evidence the previous attempt failed.

## Evidence
- Save evidence for every important action: pre/post-submit screenshots, run logs, verification screenshots, public profile URLs.
- Never report success without proof. "Thank you" text is not proof of submission; `VERIFIED_SUCCESS` requires a proven public profile URL.

## Safe retries
- Monitoring does not re-register or re-submit — it only checks whether a public profile appeared.
- Re-probe is one reasonable attempt per previously blocked platform, with a plain browser (no stealth/proxies).

## Human action
- Human-in-the-loop is a product feature, not a failure: CAPTCHA, Cloudflare, OAuth, email/phone verification, moderation and unusual forms are handed to a human in a headed browser, and the outcome is recorded with evidence.

## No CAPTCHA bypass
- No CAPTCHA solving, no anti-CAPTCHA services, no Cloudflare bypass, no stealth hacks, no fake success, no automatic payment.
