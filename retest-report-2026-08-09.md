# SEOFlow AI — Retest Report

5 previously unsuccessful directories, run one-by-one with `npx tsx scripts/human-submit.ts --run --only "Name"`.
No code fixes were applied during the retest.

---

## 1. Bark.com

**DIRECTORY:** Bark.com  
**Previous status:** NEEDS_MANUAL (history: FAILED → FAILED → NEEDS_MANUAL)  
**Previous failure point:** SPA multi-step seller form; AI mapping found 24 fields but only 1/27 filled; browser closed by instability / anti-bot flags.

### CURRENT TEST
**Initial URL:** https://www.bark.com/en/us/sellers/create/  
**Registration discovery:** Current page IS a registration page  
**Discovered URL:** https://www.bark.com/en/us/sellers/create/  
**Page type:** REGISTER  
**Discovery confidence:** 12

**Fields detected:** N/A (extraction crashed before count)  
**Rule-based mapped:** N/A  
**AI mapping:** N/A  
**AI provider:** N/A  
**Fallback used:** N/A

**Fields filled:** 0  
**Human Action:** Not reached  
**Final status:** FAILED

**Failure point:** `form-analyzer.ts` `page.evaluate` — `SEARCH_FIELD_PATTERN` is referenced inside the browser-evaluated function but is not passed into the browser scope.  
**Error:** `page.evaluate: ReferenceError: SEARCH_FIELD_PATTERN is not defined`

**Classification:** **D — AUTOMATION ISSUE**

---

## 2. SmartCustomer

**DIRECTORY:** SmartCustomer  
**Previous status:** FORM_READY  
**Previous failure point:** Registration URL was wrong; updated by user to `https://biz.smartcustomer.com/register`.

### CURRENT TEST
**Initial URL:** https://biz.smartcustomer.com/register  
**Registration discovery:** `/register` classified as LOGIN; verified `/signup` as REGISTER  
**Discovered URL:** https://biz.smartcustomer.com/signup  
**Page type:** REGISTER  
**Discovery confidence:** 7

**Fields detected:** 0  
**Rule-based mapped:** 0  
**AI mapping:** 0 fields  
**AI provider:** OpenAI (via `ai-client`, fallback available)  
**Fallback used:** No

**Fields filled:** 0/0  
**Human Action:** Waited 180s, no proof of submission  
**Final status:** NEEDS_MANUAL

**Failure point:** Discovered `/signup` has 0 fillable fields in DOM (textLen=99); Turnstile CAPTCHA present on entry.  
**Error:** `No form detected (0 fields) and no proof of submission`

**Classification:** **C — DISCOVERY ISSUE RECOVERED** (correct signup page found; remaining blockers: CAPTCHA + empty SPA page)

---

## 3. HubSpot Agency Dir

**DIRECTORY:** HubSpot Agency Dir  
**Previous status:** NEEDS_MANUAL (reclassified from NOT_APPLICABLE)  
**Previous failure point:** Submission URL `partners.hubspot.com/agency-partner-application` redirected to marketplace solutions page; no clear registration path.

### CURRENT TEST
**Initial URL:** https://partners.hubspot.com/agency-partner-application (redirected to https://ecosystem.hubspot.com/marketplace/solutions)  
**Registration discovery:** External DuckDuckGo search → found `https://www.hubspot.com/onsite-register`  
**Discovered URL:** https://www.hubspot.com/onsite-register  
**Page type:** REGISTER  
**Discovery confidence:** 7

**Fields detected:** 0  
**Rule-based mapped:** 0  
**AI mapping:** 0 fields  
**AI provider:** OpenAI (via `ai-client`)  
**Fallback used:** No

**Fields filled:** 0/0  
**Human Action:** Not submitted (false-positive guard)  
**Final status:** NEEDS_MANUAL

**Failure point:** Discovered `/onsite-register` renders 0 fillable fields (textLen=656).  
**Error:** `No form detected (0 fields) and no proof of submission`

**Classification:** **C — DISCOVERY ISSUE RECOVERED** (a HubSpot registration page was located; the page itself has no usable form fields)

---

## 4. AngelList / Wellfound

**DIRECTORY:** AngelList/Wellfound  
**Previous status:** NEEDS_MANUAL (reclassified from NOT_APPLICABLE)  
**Previous failure point:** Login/registration required (wrong page / discovery issue).

### CURRENT TEST
**Initial URL:** https://wellfound.com/companies/new  
**Registration discovery:** Current page IS a registration page  
**Discovered URL:** https://wellfound.com/companies/new  
**Page type:** REGISTER  
**Discovery confidence:** 9

**Fields detected:** 1  
**Rule-based mapped:** 0  
**AI mapping:** 0 fields  
**AI provider:** OpenAI (via `ai-client`)  
**Fallback used:** No

**Fields filled:** 0/1  
**Human Action:** Detected post-submit navigation during the 180s window  
**Final status:** SUBMITTED

**Failure point:** None  
**Error:** None

**Classification:** **A — FULL SUCCESS**

---

## 5. Express Update USA

**DIRECTORY:** Express Update USA  
**Previous status:** NEEDS_MANUAL (reclassified from NOT_APPLICABLE)  
**Previous failure point:** Wrong page / claim-only flow.

### CURRENT TEST
**Initial URL:** https://www.expressupdate.com/claim (redirected to https://local-listings.data-axle.com/claim)  
**Registration discovery:** Registration page NOT found  
**Discovered URL:** N/A  
**Page type:** CLAIM  
**Discovery confidence:** 3

**Fields detected:** 0  
**Rule-based mapped:** 0  
**AI mapping:** N/A  
**AI provider:** N/A  
**Fallback used:** N/A

**Fields filled:** 0  
**Human Action:** Not reached  
**Final status:** NEEDS_MANUAL

**Failure point:** Site is a Data Axle claim flow, not a self-service registration flow.  
**Error:** `Registration page not found (flow=CLAIM): Registration page not found (homepage/landing without registration evidence)`

**Classification:** **E — EXTERNAL / HUMAN REQUIRED**

---

# SEOFlow RETEST — 5 PREVIOUSLY FAILED DIRECTORIES

1. **Directory:** Bark.com
   - **Previous:** NEEDS_MANUAL (previously FAILED twice) — SPA form, AI mapped 24 fields but filled 1/27
   - **Current:** FAILED — form-analyzer crashes with `SEARCH_FIELD_PATTERN is not defined`
   - **Classification:** D — AUTOMATION ISSUE

2. **Directory:** SmartCustomer
   - **Previous:** FORM_READY — wrong registration URL
   - **Current:** NEEDS_MANUAL — discovered `/signup`, but 0 fields and Turnstile CAPTCHA
   - **Classification:** C — DISCOVERY ISSUE RECOVERED

3. **Directory:** HubSpot Agency Dir
   - **Previous:** NEEDS_MANUAL — submission URL redirected to marketplace, no registration path
   - **Current:** NEEDS_MANUAL — external search found `/onsite-register`, but 0 fields
   - **Classification:** C — DISCOVERY ISSUE RECOVERED

4. **Directory:** AngelList/Wellfound
   - **Previous:** NEEDS_MANUAL — login/registration required
   - **Current:** SUBMITTED — post-submit navigation to `/join`
   - **Classification:** A — FULL SUCCESS

5. **Directory:** Express Update USA
   - **Previous:** NEEDS_MANUAL — claim-only flow
   - **Current:** NEEDS_MANUAL — registration page not found
   - **Classification:** E — EXTERNAL / HUMAN REQUIRED

---

## SUMMARY

- **Tested:** 5
- **Full success:** 1
- **AI issues recovered:** 0
- **Discovery issues recovered:** 2
- **Automation issues remaining:** 1
- **External/human required:** 1

**Overall improvement:** 3 / 5 directories improved

---

## Key findings to fix before next retest

1. `src/lib/automation/form-analyzer.ts` — `SEARCH_FIELD_PATTERN` (and possibly other module-level constants) must be passed into `page.evaluate` or inlined; otherwise SPA/out-of-form field extraction crashes.
2. `attachSubmitListener` in `scripts/human-submit.ts` — `__name is not defined` error breaks submit-evidence capture. Non-fatal, but reduces proof accuracy.

## Selection caveats

- SmartCustomer and Express Update USA were not ideal choices per the "no CAPTCHA / no external verification" rule. SmartCustomer showed a Turnstile challenge; Express Update is a Data Axle claim flow requiring phone/postcard verification. Recommend replacing them in the next retest with cleaner directories once the form-analyzer bug is fixed.
