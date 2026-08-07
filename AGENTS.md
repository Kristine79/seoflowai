# SEOFlow AI — project rules

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
