# SEOFlow AI — Project Overview

## 1. Product

SEOFlow AI is an AI-assisted platform for managing SEO directory campaigns — from directory research through submission and verification to client reporting. It combines a Next.js web application (marketing site + campaign UI) with a Playwright-based automation pipeline and a strict human-in-the-loop model.

- **Live Demo:** https://seoflowai.vercel.app/
- **Source:** https://github.com/Kristine79/seoflowai
- **Status:** SEOFlow AI is an actively developed SaaS product/demo with a live public deployment.

## 2. Why it was built

SEOFlow AI came from a real client order: placing a company into a large number of SEO and business directories. Manually repeating the same operations — opening forms, mapping company data to fields, handling CAPTCHA, waiting for verification, checking whether a profile appeared — was slow and error-prone. Automating that process produced SEOFlow AI, which then grew into a standalone product.

## 3. Problem

Directory placement campaigns are messy in practice:

- every directory has a different registration/claim/add-business workflow;
- forms differ: field names, required data, multi-step flows, AJAX validation;
- anti-bot protections (Cloudflare, CAPTCHA) block scripted access;
- OAuth, email/phone verification and moderation require a human;
- a submitted form is not a published listing — verification is a separate step;
- without evidence, "success" is just a claim.

## 4. Solution

A managed pipeline that:

1. **researches and audits** directories (relevance, accessibility, placement path);
2. **prepares** platform-specific content from company data;
3. **automates** the repetitive mechanics (navigation, form extraction, field mapping, filling, submit detection);
4. **stops for a human** when a step cannot or should not be automated — and records the human result;
5. **verifies** outcomes with evidence (screenshots, public profile URLs);
6. **monitors** submitted platforms until a public profile appears;
7. **reports** everything to the client in a readable form.

## 5. Core workflow

```
DISCOVER → AUDIT → SELECT → PREPARE → SUBMIT → VERIFY → MONITOR → REPORT
```

## 6. Product surfaces

| Surface | Description |
|---|---|
| Marketing landing | Public product site (live at https://seoflowai.vercel.app/) |
| Dashboard | Campaign overview UI |
| Campaigns | Campaign management UI |
| Directory Catalog | Directory list with status and details |
| SEO Audit | Audit UI (`src/app/(app)/audit`) |
| Company Profile | Company data management (`src/app/(app)/company`) |
| Case study | Real 77-platform campaign walkthrough (`/case-studies/seo-agency-directory-campaign`) |

## 7. AI role

AI is used where judgment is needed, not for blind automation:

- **Field mapping** — mapping company data to form fields: label-rule mapping first, LLM fallback for remaining fields (`src/lib/automation/field-mapper.ts`);
- **Content preparation** — platform-specific descriptions and profiles;
- **Classification assistance** — deciding whether a platform is worth pursuing.

The LLM never makes success claims — verification is evidence-based and runs outside the LLM.

## 8. Automation layer

- **Playwright** browser automation with a **persistent browser context** per platform (cookies/logins survive between runs);
- **Form extraction** from the live page (`form-analyzer.ts`);
- **Field mapping** — rule-based first, LLM-assisted fallback (`field-mapper.ts`);
- **Submit detection** — proof-based, not text-based (baseline diff + submit listener + confirmation elements);
- **Evidence capture** — pre/post-submit screenshots and logs;
- **Status management** — every attempt appended to history with outcome and evidence;
- **Duplicate protection** — protected outcomes (SUBMITTED / REGISTERED / PENDING_* / VERIFIED_SUCCESS) are never re-run blindly.

## 9. Human-in-the-loop

Human-in-the-loop is a product feature, not an automation failure.

When a step requires a human — CAPTCHA, Cloudflare challenge, OAuth, email/phone verification, moderation, unusual forms, paid membership — the workflow stops safely in a headed browser with the form already filled and waits for the human (up to 180s in `scripts/human-submit.ts`). The human's result is recorded into the campaign with evidence.

Boundaries (hard rules):

- no CAPTCHA bypass;
- no anti-CAPTCHA services;
- no blind retry of protected sites;
- no fake success;
- no automatic payment.

See `HUMAN_ACTION.md`.

## 10. Evidence-first verification

- Every important action saves evidence: pre/post-submit screenshots, run logs, verification screenshots;
- `SUBMITTED` — the form was actually sent (proof-based submit check);
- `VERIFIED_SUCCESS` — a **publicly accessible profile URL** with company-specific content exists, backed by screenshots;
- "Thank you" text is not proof; a submitted listing is not automatically a verified placement.

## 11. Real-world validation

Validated on a real client campaign of **77 platforms**:

| Result | Count |
|---|---:|
| Placed | 5 |
| Submission sent | 7 |
| Requires action | 23 |
| Platform unavailable / externally blocked | 14 |
| Not suitable | 28 |
| **Total** | **77** |

77 = 5 + 7 + 23 + 14 + 28. These are the results of one specific real campaign — not a promised conversion rate. Full case study: `REAL_VALIDATION.md`.

## 12. Technical architecture

```
Next.js Application
   │
   ├── Marketing Landing
   ├── Dashboard
   ├── Campaigns
   ├── Directory Catalog
   ├── SEO Audit
   └── Company Profile
           │
           ↓
AI-assisted Analysis & Preparation   (LLM field mapping, content preparation)
           │
           ↓
Campaign Workflow                    (status model, history, duplicate protection)
           │
           ↓
Browser Automation                  (Playwright, persistent context, form extraction)
           ├── Automated action
           └── Human action         (headed browser, human-in-the-loop)
                   │
                   ↓
Verification                        (proof-based submit check, public profile check)
           │
           ↓
Evidence + Status History           (screenshots, logs, attempt history)
           │
           ↓
Monitoring                          (re-check SUBMITTED, no re-submission)
           │
           ↓
Reporting                           (CSV / XLSX / Markdown client reports)
```

Details: `ARCHITECTURE.md`, `DIRECTORY_ENGINE.md`.

## 13. Current status

- SEOFlow AI is deployed and publicly accessible (https://seoflowai.vercel.app/);
- the web application (landing, dashboard, campaigns, audit, company profile) is live;
- the automation pipeline has processed a real 77-platform directory campaign (see §11);
- `human-queue.json` is the operational source of truth for campaign statuses;
- the knowledge base / RAG architecture is documented but **not implemented** (see `KNOWLEDGE_BASE.md`).

## 14. Future direction

- **Directory Knowledge Base** — structured memory of adapter notes, flow metadata and outcomes;
- **Embeddings + RAG** — retrieve similar past flows when a new platform is encountered;
- **Flow classification** — map a new site structure to a known generic workflow;
- **Reusable workflow selection** — pick the best generic workflow with human-in-the-loop when confidence is low.

These are roadmap items, not current functionality. Nothing in `KNOWLEDGE_BASE.md` exists in the codebase yet.

---

> SEOFlow is **not** a "submit everywhere" bot. It is a controlled system that combines AI-assisted research, preparation, automation, human actions, verification and reporting.
