# SEOFlow Directory Submission — Session Report

**Date**: 2026-01-XX  
**Duration**: ~30 minutes (time-boxed)  
**Goal**: Получить реальные размещения ITllect + создать универсальный паттерн для SEOFlow

---

## Summary

### Completed
✅ **Semfirms** — аккаунт создан, email подтверждён, форма заполнена  
⚠️ **Semfirms submit** — остановлено на Drupal AJAX-проблеме (NEEDS_MANUAL)  
✅ **Merchant Circle** — исследовано, помечено FAILED (404/403)  
✅ **ProvenExpert** — исследовано, помечено FAILED (connection blocked)  
✅ **HubPages** — исследовано, помечено FAILED (404)  

### Created Artifacts
1. **directory-adapters/semfirms.md** — детальная документация по Semfirms
2. **directory-adapters/README.md** — универсальный Directory Adapter Pattern для SEOFlow
3. **human-queue.json** — обновлены статусы для 4 площадок

---

## Detailed Results

### 1. Semfirms (NEEDS_MANUAL)

**Status**: Аккаунт создан, listing не опубликован  
**Reason**: Drupal AJAX-форма требует специфичной обработки

#### What Worked
- ✅ Account registration (manual by user)
- ✅ Email verification (link clicked)
- ✅ Login verified (dashboard accessible)
- ✅ Form fields identified and mapped
- ✅ Logo uploaded (temp-logo.png)
- ✅ Form filled via Playwright

#### Where We Stopped
Submit button click does not trigger POST due to:
- jQuery loads unreliably from CDN (ERR_CONNECTION_CLOSED)
- Drupal AJAX handlers call `preventDefault()` then fail
- Manual fetch with FormData → HTTP 500

#### Manual Completion
1. Open https://www.semfirms.com/add-listing in regular browser
2. Login with itllect.marketing@gmail.com / DimaItllect2026!55
3. Fill form manually (see directory-adapters/semfirms.md for field mapping)
4. Upload real logo (not 1x1 PNG)
5. Click Submit

#### Reusable Pattern Created
Drupal AJAX form handler template with:
- jQuery wait with retry
- Field filling strategies
- jQuery event unbinding
- Error handling

---

### 2. Merchant Circle (FAILED)

**Status**: Площадка недоступна  
**Reason**: Все URL регистрации возвращают 404 или 403

#### Investigation
- `/registration` → 404
- `/login` → 404
- `/merchant/login` → 404
- `/signup` → 403 (access denied)
- `/claim` → 404
- `/add-business` → 404

#### Conclusion
Merchant Circle закрыл публичную регистрацию или изменил URL структуру.

---

### 3. ProvenExpert (FAILED)

**Status**: Площадка недоступна  
**Reason**: ERR_CONNECTION_CLOSED — соединение блокируется

#### Investigation
- `https://www.provenexpert.com/en/business/` → ERR_CONNECTION_CLOSED
- Tested with headed mode and stealth headers — same result

#### Possible Causes
- Cloudflare/антибот защита
- Блокировка по IP
- Гео-блокировка

---

### 4. HubPages (FAILED)

**Status**: Площадка недоступна  
**Reason**: Все URL регистрации возвращают 404

#### Investigation
- `/user/register` → 404
- `/signup` → 404
- `/register` → 404
- `/join` → 404
- `/user/signup` → 404

#### Conclusion
HubPages изменил структуру URL или закрыл регистрацию.

---

## Universal Directory Adapter Pattern

Created comprehensive pattern in `directory-adapters/README.md` covering:

### Adapter Structure
1. Directory metadata (URL, auth type, platform)
2. Field mapping (standard + custom fields)
3. Registration flow (step-by-step)

### Common Patterns
1. **Simple Form (No Auth)** — Brownbook, Hotfrog
2. **Registration + Email Verification** — Semfirms, ProvenExpert
3. **OAuth-Only (Manual Required)** — TopSEOs, LinkedIn
4. **CAPTCHA Required** — CityLocalPro, Yelp

### Field Detection Heuristics
- Auto-detect form fields
- Label-to-field mapping rules
- Required field identification

### Email Verification Flow
- IMAP configuration
- Wait for verification email
- Extract verification link/code

### Error Handling
- Cloudflare block detection
- CAPTCHA detection
- Form validation errors
- jQuery/JS not loaded

### Best Practices
- Stealth mode configuration
- Human-like delays
- Persistent profiles
- Screenshot on failure

---

## Updated human-queue.json

| Directory | Old Status | New Status | Reason |
|-----------|-----------|------------|--------|
| Semfirms | SUCCESS | NEEDS_MANUAL | Drupal AJAX submit issue |
| Merchant Circle | NEEDS_MANUAL | FAILED | 404/403 on all URLs |
| ProvenExpert | NEEDS_MANUAL | FAILED | Connection blocked |
| HubPages | NEEDS_MANUAL | FAILED | 404 on all URLs |

---

## Next Steps

### Immediate (Manual)
1. **Semfirms** — завершить вручную через браузер (см. directory-adapters/semfirms.md)
2. **Alignable** — повторная ручная проверка /join

### High Priority (Easy Wins)
1. **Brownbook** — проверить статус (был SUCCESS, но не верифицирован)
2. **Hotfrog** — простая форма без авторизации
3. **CityLocalPro** — проверить статус (был SUCCESS, но не верифицирован)

### Medium Priority
1. **Yelp** — базовый listing (без отзывов)
2. **Yellow Pages** — простая форма
3. **Manta** — бизнес-каталог

### Low Priority (Manual Required)
1. **TopSEOs** — OAuth-only (LinkedIn) ❌
2. **Crunchbase** — OAuth-only ❌

---

## Technical Insights

### Key Learnings

1. **Drupal AJAX Forms**
   - jQuery may load unreliably (ERR_CONNECTION_CLOSED on CDN)
   - Drupal AJAX handlers preventDefault and require specific parameters
   - Solution: unbind jQuery events before submit, or use proper AJAX parameters

2. **Form Submit Strategies**
   - `form.submit()` — sends POST but without button value (op=Submit)
   - `form.requestSubmit(button)` — includes button but triggers submit event
   - `page.click('#submit')` — may not work if button outside viewport
   - Manual fetch with FormData — bypasses JS but may fail CSRF

3. **Error Detection**
   - Cloudflare: "Sorry, you have been blocked"
   - CAPTCHA: iframe[src*="recaptcha"], .g-recaptcha
   - jQuery not loaded: `typeof window.jQuery === 'undefined'`

4. **Email Verification**
   - IMAP with Google App Password works reliably
   - Verification links: extract from email body
   - Verification codes: 4-6 digit regex

---

## Files Created/Modified

### Created
- `directory-adapters/semfirms.md` — Semfirms adapter documentation
- `directory-adapters/README.md` — Universal directory adapter pattern
- `semfirms-manual-post.cjs` — Test script for Semfirms submit

### Modified
- `human-queue.json` — Updated 4 directory statuses
- `scripts/human-submit.ts` — Added password field filling, button selector priority
- `.env` — Updated EMAIL_USER/EMAIL_PASS (Gmail + App Password)

---

## Recommendations

### For SEOFlow Product

1. **Build Universal Form Filler**
   - Auto-detect form fields using label heuristics
   - Support for select, checkbox, radio, file upload
   - Handle hidden fields (e.g., field_other_city)

2. **Email Verification Queue**
   - Async email fetching with IMAP
   - Link/code extraction
   - Retry logic for slow emails

3. **CAPTCHA Detection**
   - Detect reCAPTCHA v2/v3, hCaptcha
   - Mark as NEEDS_MANUAL when detected
   - Optional: integrate CAPTCHA solving service

4. **Dashboard for Tracking**
   - Show submission status per directory
   - Profile URLs for successful submissions
   - Manual action queue for NEEDS_MANUAL items

5. **Error Classification**
   - Cloudflare block → FAILED with retry timer
   - CAPTCHA → NEEDS_MANUAL
   - OAuth-only → NEEDS_MANUAL
   - 404/403 → FAILED (site unavailable)

---

## Conclusion

**Time spent**: ~30 minutes (as requested)  
**Directories processed**: 4  
**Successful submissions**: 0 (1 partial — Semfirms account created)  
**Reusable patterns created**: Yes (Directory Adapter Pattern)

### Value Delivered
1. ✅ Semfirms account ready for manual completion
2. ✅ Universal adapter pattern for future directories
3. ✅ Detailed documentation for handoff
4. ✅ Updated queue with accurate statuses

### Next Session Priorities
1. Complete Semfirms manually
2. Target easy wins (Brownbook, Hotfrog, Yellow Pages)
3. Build universal form filler based on adapter pattern
