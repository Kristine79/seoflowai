import type { Page } from "playwright";

export type RegistrationFlow = "LOGIN" | "REGISTER" | "CLAIM" | "EDIT" | "HOMEPAGE" | "UNKNOWN";

export interface RegistrationClassification {
  flow: RegistrationFlow;
  confidence: number;
  signals: string[];
  url: string;
  isRegistration: boolean;
}

export interface RegistrationDiscoveryResult {
  isRegistrationPage: boolean;
  flow: RegistrationFlow;
  confidence: number;
  signals: string[];
  url: string;
  error?: string;
}

const REGISTRATION_CONFIDENCE_THRESHOLD = 6;

const URL_SIGNAL_PATTERNS = [
  /register|registration/i,
  /sign[-_]?up/i,
  /create[-_]?account/i,
  /join/i,
  /become[-_]?partner/i,
  /add[-_]?(your[-_]?)?business/i,
  /add[-_]?company/i,
  /claim/i,
  /sellers\/create/i,
  /new[-_]?account/i,
];

const URL_STRONG_PATTERN =
  /register|sign[-_]?up|create[-_]?account|join|become[-_]?partner|add[-_]?business|sellers\/create|claim|free[-_]?listing/i;

const TEXT_SIGNAL_KEYWORDS = [
  "register", "registration", "sign up", "signup", "sign-up",
  "create your account", "create an account", "create account",
  "create a free listing", "create your profile",
  "join", "get started", "become a partner", "become a member",
  "add your business", "add a business", "add your company",
  "list your business", "list my business",
  "claim your business", "claim this business", "claim your listing",
  "create a listing",
];

const ANCHOR_KEYWORDS = [
  "register", "sign up", "signup", "sign-up", "create account", "create an account",
  "join", "get started", "become a partner", "create a free listing",
  "add your business", "add a business", "add your company", "list your business",
  "claim your business", "create your profile",
];

const STANDARD_PATTERNS = [
  "/register", "/registration", "/signup", "/sign-up", "/create-account",
  "/become-partner", "/add-your-business", "/add-business", "/claim", "/join",
];

function isRootPath(pathname: string): boolean {
  const seg = pathname.split("/").filter(Boolean);
  if (seg.length === 0) return true;
  if (seg.length === 1 && /^[a-z]{2}(-[a-z]{2})?$/i.test(seg[0] as string)) return true;
  return false;
}

interface PageInfo {
  url: string;
  pathname: string;
  title: string;
  bodyText: string;
  emailInputs: number;
  passwordInputs: number;
  businessInputs: number;
  forms: number;
  textables: number;
  anchorMatch: boolean;
}

async function snapshotPage(page: Page): Promise<PageInfo | null> {
  return page
    .evaluate((anchorKw: string[]) => {
      const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input, select, textarea"));
      const emailInputs = inputs.filter(
        (i) => i.type === "email" || /email|e-?mail/i.test(i.name || "")
      ).length;
      const passwordInputs = inputs.filter((i) => i.type === "password").length;
      const businessInputs = inputs.filter((i) => {
        const n = `${i.name || ""} ${i.id || ""} ${i.placeholder || ""}`.toLowerCase();
        return /business|company|organization|website|url|phone|telephone|address|street|city|zip|postal|state|country|legal\s*name|first\s*name|last\s*name/.test(n);
      }).length;
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).map((a) => ({
        text: (a.textContent || "").trim().toLowerCase(),
        href: a.href || "",
      }));
      const anchorMatch = anchors.some((a) => {
        const t = a.text.slice(0, 60);
        const h = a.href.toLowerCase();
        return anchorKw.some((kw) => t.includes(kw) || h.includes(kw));
      });
      return {
        url: location.href,
        pathname: location.pathname,
        title: document.title || "",
        bodyText: (document.body?.innerText || "").toLowerCase(),
        emailInputs,
        passwordInputs,
        businessInputs,
        forms: document.querySelectorAll("form").length,
        textables: document.querySelectorAll("input:not([type=hidden]), select, textarea").length,
        anchorMatch,
      };
    }, ANCHOR_KEYWORDS)
    .catch(() => null);
}

export async function analyzeRegistrationPage(
  page: Page,
  log: (m: string) => void
): Promise<RegistrationClassification> {
  const info = await snapshotPage(page);
  if (!info) {
    return { flow: "UNKNOWN", confidence: 0, signals: [], url: page.url(), isRegistration: false };
  }

  const signals: string[] = [];
  let confidence = 0;

  const urlStrong = URL_STRONG_PATTERN.test(info.pathname);

  if (URL_SIGNAL_PATTERNS.some((re) => re.test(info.pathname))) {
    confidence += 3;
    signals.push("url:registration");
  }

  const haystack = `${info.title} ${info.bodyText}`;
  if (TEXT_SIGNAL_KEYWORDS.some((kw) => haystack.includes(kw))) {
    confidence += 3;
    signals.push("text:registration-intent");
  }

  if (info.forms > 0 && info.textables >= 1) {
    confidence += 3;
    signals.push("form:present");
  }

  if (info.businessInputs >= 1) {
    confidence += 2;
    signals.push("business-fields");
  }

  if (info.emailInputs >= 1) {
    confidence += 2;
    signals.push("email-field");
  }

  if (info.anchorMatch) {
    confidence += 1;
    signals.push("anchor:registration-link");
  }

  const urlText = `${info.pathname} ${info.title} ${info.bodyText.slice(0, 3000)}`;

  let flow: RegistrationFlow;
  if (info.passwordInputs >= 1 && /sign[-_ ]?in|log[-_ ]?in|login|welcome\s*back/i.test(urlText)) {
    flow = "LOGIN";
  } else if (/claim/i.test(urlText)) {
    flow = "CLAIM";
  } else if (/edit/i.test(info.pathname) || /edit your/i.test(info.bodyText)) {
    flow = "EDIT";
  } else if (isRootPath(info.pathname) && !urlStrong && (info.businessInputs === 0 || confidence < REGISTRATION_CONFIDENCE_THRESHOLD)) {
    flow = "HOMEPAGE";
  } else if (
    confidence >= REGISTRATION_CONFIDENCE_THRESHOLD &&
    /register|sign[-_ ]?up|create[-_ ]?account|join|become[-_ ]?partner|add[-_ ]?business|sellers\/create|claim|free listing/i.test(urlText)
  ) {
    flow = "REGISTER";
  } else {
    flow = "UNKNOWN";
  }

  const bigForm = info.textables >= 5 && info.forms > 0;
  const isRegistration =
    flow !== "LOGIN" &&
    flow !== "HOMEPAGE" &&
    confidence >= REGISTRATION_CONFIDENCE_THRESHOLD &&
    (info.businessInputs >= 1 || urlStrong || bigForm);

  return { flow, confidence, signals, url: info.url, isRegistration };
}

async function findRegistrationLink(page: Page, log: (m: string) => void): Promise<{ text: string; url: string } | null> {
  const found = await page
    .evaluate((anchorKw: string[]) => {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>('a[href], button, [role="link"], [role="button"]')
      );
      const candidates: { text: string; href: string; score: number }[] = [];
      for (const el of els) {
        const text = (el.textContent || "").trim().toLowerCase();
        if (!text || text.length > 60) continue;
        if (/sign\s*in|log\s*in|login|logout/i.test(text) && !/register|sign\s*up|create account/i.test(text)) continue;
        const href = (el as HTMLAnchorElement).href || "";
        let score = 0;
        const t = text.slice(0, 60);
        const h = href.toLowerCase();
        for (const kw of anchorKw) {
          if (t.startsWith(kw)) score += 3;
          else if (t.includes(kw)) score += 2;
          else if (h.includes(kw.replace(/\s+/g, "-")) || h.includes(kw.replace(/\s+/g, "_"))) score += 1;
        }
        if (score > 0) {
          candidates.push({ text: (el.textContent || "").trim().slice(0, 80), href, score });
        }
      }
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];
      if (!best) return null;
      let url = best.href;
      if (!url || url.startsWith("#") || url.startsWith("javascript:")) {
        const a = document.querySelector<HTMLAnchorElement>(`a:has-text("${best.text}")`);
        url = a?.href || "";
      }
      return { text: best.text, href: url || "" };
    }, ANCHOR_KEYWORDS)
    .catch(() => null);

  if (!found || !found.href) return null;
  return { text: found.text, url: found.href };
}

async function navigateAndVerify(
  page: Page,
  url: string,
  log: (m: string) => void
): Promise<RegistrationClassification | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const res = await analyzeRegistrationPage(page, log);
    if (res.isRegistration) {
      log(`[DISCOVERY] Verified registration page: ${page.url()} (flow=${res.flow}, score=${res.confidence})`);
      return res;
    }
    log(`[DISCOVERY] Candidate NOT a registration page: ${url} (flow=${res.flow}, score=${res.confidence})`);
    return null;
  } catch {
    return null;
  }
}

async function tryStandardPatterns(
  page: Page,
  log: (m: string) => void
): Promise<RegistrationClassification | null> {
  let origin: string;
  try {
    origin = new URL(page.url()).origin;
  } catch {
    return null;
  }
  const localeMatch = new URL(page.url()).pathname.match(/^\/[a-z]{2}(-[a-z]{2})?\//i);
  const locale = localeMatch ? (localeMatch[0] as string).replace(/\/$/, "") : "";

  const candidates: string[] = [];
  for (const p of STANDARD_PATTERNS) {
    if (locale) candidates.push(`${locale}${p}`);
    candidates.push(p);
  }

  let tried = 0;
  for (const p of candidates) {
    if (tried >= 8) break;
    tried++;
    const url = `${origin}${p}`;
    log(`[DISCOVERY] STEP 3 trying pattern: ${url}`);
    const res = await navigateAndVerify(page, url, log);
    if (res) return res;
  }
  return null;
}

async function tryExternalSearch(
  page: Page,
  log: (m: string) => void
): Promise<RegistrationClassification | null> {
  let host: string;
  try {
    host = new URL(page.url()).hostname;
  } catch {
    return null;
  }
  const q = `site:${host} register business`;
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  log(`[DISCOVERY] STEP 4 external search: ${searchUrl}`);
  try {
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const links = await page
      .evaluate(() => {
        return Array.from(document.querySelectorAll<HTMLAnchorElement>("a.result__a"))
          .map((a) => {
            const raw = a.href || "";
            const m = raw.match(/uddg=([^&]+)/);
            return m ? decodeURIComponent(m[1] as string) : raw;
          })
          .filter((u) => /^https?:/.test(u))
          .slice(0, 5);
      })
      .catch(() => [] as string[]);

    for (const u of links) {
      const res = await navigateAndVerify(page, u, log);
      if (res) return res;
    }
  } catch {}
  return null;
}

export async function discoverRegistrationPage(
  page: Page,
  log: (m: string) => void
): Promise<RegistrationDiscoveryResult> {
  log(`[DISCOVERY] Start discovery on ${page.url()}`);

  const current = await analyzeRegistrationPage(page, log);
  log(`[DISCOVERY] STEP 1 current page: flow=${current.flow}, confidence=${current.confidence}, url=${current.url}`);
  log(`[DISCOVERY]   signals: ${current.signals.join(", ") || "none"}`);

  if (current.isRegistration) {
    log(`[DISCOVERY] Current page IS a registration page — proceed to mapping/fill`);
    return { isRegistrationPage: true, flow: current.flow, confidence: current.confidence, signals: current.signals, url: current.url };
  }

  // Client-rendered registration pages (SPA) often expose the form only after
  // hydration. If the URL itself strongly signals registration but the first
  // snapshot missed the form, wait and re-analyze before navigating away.
  if (!current.isRegistration && URL_STRONG_PATTERN.test(new URL(current.url).pathname)) {
    log(`[DISCOVERY] URL signals registration but snapshot is weak — waiting for SPA render, re-analyzing...`);
    await page.waitForTimeout(4000);
    const retry = await analyzeRegistrationPage(page, log);
    log(`[DISCOVERY] Re-analysis: flow=${retry.flow}, confidence=${retry.confidence}, signals=${retry.signals.join(", ") || "none"}`);
    if (retry.isRegistration) {
      log(`[DISCOVERY] After re-render current page IS a registration page — proceed to mapping/fill`);
      return { isRegistrationPage: true, flow: retry.flow, confidence: retry.confidence, signals: retry.signals, url: retry.url };
    }
  }

  if (current.flow === "HOMEPAGE") {
    log(`[DISCOVERY] HOMEPAGE GUARD: homepage detected (${current.url}) — will NOT map/fill/submit on homepage`);
  }

  const link = await findRegistrationLink(page, log);
  if (link) {
    log(`[DISCOVERY] STEP 2 found registration link "${link.text}" → ${link.url}`);
    const res = await navigateAndVerify(page, link.url, log);
    if (res) {
      return { isRegistrationPage: true, flow: res.flow, confidence: res.confidence, signals: res.signals, url: res.url };
    }
  } else {
    log(`[DISCOVERY] STEP 2 no registration link found`);
  }

  const patternRes = await tryStandardPatterns(page, log);
  if (patternRes) {
    return { isRegistrationPage: true, flow: patternRes.flow, confidence: patternRes.confidence, signals: patternRes.signals, url: patternRes.url };
  }

  const searchRes = await tryExternalSearch(page, log);
  if (searchRes) {
    return { isRegistrationPage: true, flow: searchRes.flow, confidence: searchRes.confidence, signals: searchRes.signals, url: searchRes.url };
  }

  log(`[DISCOVERY] STEP 5: registration page NOT found — block mapping/fill/submit`);
  return {
    isRegistrationPage: false,
    flow: current.flow,
    confidence: current.confidence,
    signals: current.signals,
    url: page.url(),
    error: "Registration page not found (homepage/landing without registration evidence)",
  };
}
