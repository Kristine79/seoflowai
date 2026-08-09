# NOT_APPLICABLE — Final Audit Report

> Date: 2026-08-08
> Total platforms audited: 32
> Method: User classification criteria confirmed via site checks

## Categories

| Code | Meaning |
|---|---|
| ✅ CONFIRMED | Truly NOT_APPLICABLE — no relevant business directory listing |
| 🔄 RETURN TO WORK | Business/agency directory — can have company listing. Reclassify to NEEDS_MANUAL. |
| 🔍 PARTNER PROGRAM | Has public directory but requires partner approval. Needs separate decision. |
| ❌ KEEP NA | Company/brand profile possible, but not a business directory. Keep NOT_APPLICABLE. |
| 💰 PAID | Listing only with paid membership. Requires client budget. |

---

## A. CONFIRMED NOT_APPLICABLE — Truly not a directory (15)

| # | Platform | Reason |
|---|---|---|
| 1 | City of Plantation | Municipal website, no business directory |
| 2 | Broward County Biz | County business resources portal, no listing |
| 3 | FL DEO Business | State government employment portal |
| 4 | SBA.gov Business | Federal small business resource |
| 5 | FL SBDC Network | Business advising service, not a directory |
| 6 | SCORE Mentor Network | Government mentoring program, no listing |
| 7 | Data Axle | Enterprise data aggregator, no public listing |
| 8 | Neustar Localeze | Citation aggregator (data feed), no self-service listing |
| 9 | ActiveCampaign | Partner ecosystem, no public agency directory |
| 10 | Business2Community | Guest posting site (Aweber email capture), not a directory |
| 11 | Spoke | Pivoted to last-mile delivery SaaS, not a directory |
| 12 | n49 | Re-probe confirmed: accessible but no add-business form |
| 13 | Influencer Mkt Hub | Mailchimp subscribe page, not a directory |
| 14 | SiteInspire | Editorial design gallery, submission review only |
| 15 | Quora | Q&A platform, not a business directory |

## B. RETURN TO WORK — Business/Agency Directories (5)

These platforms offer real business/agency/company listings and should be reclassified to NEEDS_MANUAL.

| # | Platform | URL | What's needed | Evidence |
|---|---|---|---|---|
| 1 | **Trustpilot** | https://www.trustpilot.com | Claim business → domain verification | Review platform. Business CAN claim existing profile. Requires domain ownership proof. |
| 2 | **Foursquare Business** | https://business.foursquare.com | Claim venue → phone verification | Local business listing. Venue CAN be claimed. Requires phone verification. |
| 3 | **Nextdoor Business** | https://business.nextdoor.com | Create business page → postcard verification | Local neighborhood business directory. CAN create business page. Postcard PIN verification. |
| 4 | **Wellfound (AngelList)** | https://wellfound.com | Create startup/company profile | Startup directory. Company CAN create full profile with team, funding, jobs. |
| 5 | **Express Update USA** | https://www.expressupdate.com | Claim existing InfoGroup listing | InfoGroup citation aggregator. CAN claim/update existing listing. Phone/postcard verify. |

## C. KEEP NOT_APPLICABLE — Not directories (5)

These platforms offer company/brand profiles but are NOT business directories. They do not provide a public company listing in a directory format.

| # | Platform | What exists | Why keep NA |
|---|---|---|---|
| 1 | **GitHub** | Organization profile | Code platform. Has org profiles but not a business directory. |
| 2 | **Twitter / X** | Business profile | Social media. Business presence possible, not a directory. |
| 3 | **Pinterest Business** | Business account | Visual discovery. Brand account exists, not a directory. |
| 4 | **SlideShare** | Brand profile + uploads | Document sharing. Brand page exists, not a directory listing. |
| 5 | **Product Hunt** | Product/company page | Product launch platform. Maker profile exists, not a business directory. |

## D. PARTNER PROGRAMS — Needs separate decision (3)

All three have public agency directories, but require completing a partner application first.

| # | Platform | Public Directory? | Partner App Required? | Free? | Recommendation |
|---|---|---|---|---|---|
| 1 | **HubSpot Agency Dir** | ✅ YES — ecosystem.hubspot.com/marketplace/solutions/directory | ✅ Solutions Partner application | ✅ Free tier | **RETURN TO WORK** — public directory exists, partner app leads to listing |
| 2 | **Semrush Agency Partners** | ✅ YES — agencies.semrush.com with "Browse agencies" + "List your agency" | ✅ Agency Partner application | ✅ Free | **RETURN TO WORK** — self-service "List your agency" flow exists |
| 3 | **Webflow Partner** | ⚠️ webflow.com/solutions/partners — "Hire a Certified Partner" exists but no self-listing | ✅ Partner application + review | ✅ Free | **PARTNER ONLY** — no clear self-listing flow; listing is by invitation/review only |

## E. PAID — Needs client decision (1)

| # | Platform | Cost | Why |
|---|---|---|---|
| 1 | **Ft Lauderdale Chamber** | $574/yr + $50 one-time | Chamber membership. Listing only available with paid membership. Requires client approval. |

## F. NEEDS CHECK (3)

| # | Platform | What to verify | Next step |
|---|---|---|---|
| 1 | **Broward County Chamber** | Is free member directory listing available? | Visit chamber site, check membership tiers |
| 2 | **Miami Chamber** | Is free member directory listing available? | Visit chamber site, check membership tiers |
| 3 | **Find Best SEO** | Is site still alive? | Manual URL check in browser |

---

## Summary

| Category | Count | Action |
|---|---|---|
| ✅ CONFIRMED NOT_APPLICABLE | 15 | Keep as is |
| 🔄 RETURN TO WORK (directories) | 5 | Reclassify to NEEDS_MANUAL |
| ❌ KEEP NOT_APPLICABLE (not directories) | 5 | Keep as is |
| 🔍 PARTNER PROGRAMS | 3 | 2 → RETURN TO WORK, 1 → PARTNER ONLY |
| 💰 PAID | 1 | Leave NOT_APPLICABLE; inform client |
| 🔍 NEEDS CHECK | 3 | Verify before deciding |

**Total changes to human-queue.json (if confirmed):**
- 5 → NEEDS_MANUAL (Trustpilot, Foursquare, Nextdoor, Wellfound, Express Update USA)
- 1 → NOT_APPLICABLE (Ft Lauderdale Chamber — already correct)
- 2 → NEEDS_MANUAL (HubSpot, Semrush)
- 1 → NOT_APPLICABLE (Webflow — partner only, no self-listing)

**Net: 7 platforms returning to work queue.**