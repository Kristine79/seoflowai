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
const SPA_POLL_TIMEOUT_MS = 8000;
const SPECULATIVE_CANDIDATE_TIMEOUT_MS = 1500;
const SPA_POLL_INTERVAL_MS = 300;

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
  visibleEmailInputs: number;
  visiblePasswordInputs: number;
  visibleBusinessInputs: number;
  forms: number;
  visibleForms: number;
  textables: number;
  visibleTextables: number;
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
      const visibleInputs = inputs.filter((i) => {
        const rect = i.getBoundingClientRect();
        const style = window.getComputedStyle(i);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      });
      const visibleEmailInputs = visibleInputs.filter(
        (i) => i.type === "email" || /email|e-?mail/i.test(i.name || "")
      ).length;
      const visiblePasswordInputs = visibleInputs.filter((i) => i.type === "password").length;
      const visibleBusinessInputs = visibleInputs.filter((i) => {
        const n = `${i.name || ""} ${i.id || ""} ${i.placeholder || ""}`.toLowerCase();
        return /business|company|organization|website|url|phone|telephone|address|street|city|zip|postal|state|country|legal\s*name|first\s*name|last\s*name/.test(n);
      }).length;
      const visibleForms = Array.from(document.querySelectorAll("form")).filter((form) => {
        const rect = form.getBoundingClientRect();
        const style = window.getComputedStyle(form);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
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
        visibleEmailInputs,
        visiblePasswordInputs,
        visibleBusinessInputs,
        forms: document.querySelectorAll("form").length,
        visibleForms,
        textables: document.querySelectorAll("input:not([type=hidden]), select, textarea").length,
        visibleTextables: visibleInputs.filter((i) => i.type !== "hidden").length,
        anchorMatch,
      };
    }, ANCHOR_KEYWORDS)
    .catch(() => null);
}

export async function analyzeRegistrationPage(
  page: Page,
  log: (m: string) => void
): Promise<RegistrationClassification> {
  void log;
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

  if (info.visibleForms > 0 && info.visibleTextables >= 1) {
    confidence += 3;
    signals.push("form:present");
  }

  if (info.visibleBusinessInputs >= 1) {
    confidence += 2;
    signals.push("business-fields");
  }

  if (info.visibleEmailInputs >= 1) {
    confidence += 2;
    signals.push("email-field");
  }

  if (info.anchorMatch) {
    confidence += 1;
    signals.push("anchor:registration-link");
  }

  const urlText = `${info.pathname} ${info.title} ${info.bodyText.slice(0, 3000)}`;

  let flow: RegistrationFlow;
  if (info.visiblePasswordInputs >= 1 && /sign[-_ ]?in|log[-_ ]?in|login|welcome\s*back/i.test(urlText)) {
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

  const bigForm = info.visibleTextables >= 5 && info.visibleForms > 0;
  const strongRegistrationState =
    flow === "REGISTER" &&
    confidence >= REGISTRATION_CONFIDENCE_THRESHOLD &&
    (info.visibleBusinessInputs >= 1 || info.visibleEmailInputs >= 1 || urlStrong || bigForm);
  const strongClaimState =
    flow === "CLAIM" &&
    confidence >= REGISTRATION_CONFIDENCE_THRESHOLD &&
    (urlStrong || info.visibleBusinessInputs >= 1 || info.visibleEmailInputs >= 1 || bigForm);
  const isRegistration = strongRegistrationState || strongClaimState;

  return { flow, confidence, signals, url: info.url, isRegistration };
}

function normalizeVisitedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

interface CandidateContext {
  sourceUrl: string;
  source: RegistrationClassification;
  anchorText: string;
}

const EXPLICIT_REGISTRATION_CTA_PATTERN =
  /register|registration|sign\s*up|signup|create\s+(an?\s+)?account|become\s+a\s+partner|add\s+(your\s+)?(business|company)|list\s+(your|my)\s+business|claim\s+(your\s+)?(business|listing)/i;
const GENERIC_REGISTRATION_CTA_PATTERN =
  /get\s+started|join\s+(as|now|today|free|for\s+free)|become\s+a\s+member|create\s+(a\s+)?profile/i;

function isTrustedExternalCandidate(
  sourceUrl: string,
  targetUrl: string,
  anchorText: string,
  source: RegistrationClassification,
  target: RegistrationClassification
): boolean {
  let sourceOrigin: string;
  let targetOrigin: string;
  let targetPathname: string;
  try {
    sourceOrigin = new URL(sourceUrl).origin;
    const targetUrlObject = new URL(targetUrl);
    targetOrigin = targetUrlObject.origin;
    targetPathname = targetUrlObject.pathname;
  } catch {
    return false;
  }

  if (sourceOrigin === targetOrigin) return true;

  const sourceIntent =
    source.flow === "REGISTER" ||
    source.flow === "CLAIM" ||
    (source.confidence >= REGISTRATION_CONFIDENCE_THRESHOLD - 2 &&
      source.signals.includes("text:registration-intent") &&
      source.signals.includes("anchor:registration-link"));
  const targetEvidence =
    target.flow === "REGISTER" &&
    target.isRegistration &&
    (URL_STRONG_PATTERN.test(targetPathname) ||
      target.signals.includes("form:present") ||
      target.signals.includes("email-field") ||
      target.signals.includes("business-fields"));
  const ctaEvidence =
    EXPLICIT_REGISTRATION_CTA_PATTERN.test(anchorText) ||
    GENERIC_REGISTRATION_CTA_PATTERN.test(anchorText) ||
    URL_STRONG_PATTERN.test(targetPathname);

  return sourceIntent && targetEvidence && ctaEvidence;
}

async function findRegistrationLink(
  page: Page,
  log: (m: string) => void,
  visitedUrls: Set<string> = new Set()
): Promise<{ text: string; url: string } | null> {
  const found = await page
    .evaluate(({ anchorKw, visited }: { anchorKw: string[]; visited: string[] }) => {
      const visitedSet = new Set(visited);
      const registrationUrlPattern = /register|registration|sign[-_]?up|create[-_]?account|join|become[-_]?partner|add[-_]?business|claim|free[-_]?listing/i;
      const explicitRegistrationText = /register|registration|sign\s*up|signup|create\s+(an?\s+)?account|become\s+a\s+partner|add\s+(your\s+)?(business|company)|list\s+(your|my)\s+business|claim\s+(your\s+)?(business|listing)/i;
      const genericRegistrationText = /get\s+started|join\s+(as|now|today|free|for\s+free)|become\s+a\s+member|create\s+(a\s+)?profile/i;
      const els = Array.from(
        document.querySelectorAll<HTMLElement>('a[href], button, [role="link"], [role="button"]')
      );
      const candidates: {
        text: string;
        href: string;
        visible: boolean;
        inViewport: boolean;
        urlScore: number;
        textScore: number;
        externalRegistration: boolean;
      }[] = [];
      for (const el of els) {
        const text = (el.textContent || "").trim().toLowerCase();
        if (!text || text.length > 60) continue;
        if (/sign\s*in|log\s*in|login|logout/i.test(text) && !/register|sign\s*up|create account/i.test(text)) continue;
        const href = (el as HTMLAnchorElement).href || el.getAttribute("data-href") || el.getAttribute("data-url") || "";
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;
        const parsedHref = new URL(href, location.href);
        parsedHref.hash = "";
        if (visitedSet.has(parsedHref.toString())) continue;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const visible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden";
        const inViewport =
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth;
        const urlScore = registrationUrlPattern.test(parsedHref.pathname) ? 100 : 0;
        const keywordMatch = anchorKw.some(
          (kw) => kw !== "join" && kw !== "get started" && text.includes(kw)
        );
        const textScore = explicitRegistrationText.test(text)
          ? 100
          : genericRegistrationText.test(text) || keywordMatch
            ? 30
            : 0;
        if (urlScore === 0 && textScore === 0) continue;
        candidates.push({
          text: (el.textContent || "").trim().slice(0, 80),
          href,
          visible,
          inViewport,
          urlScore,
          textScore,
          externalRegistration: parsedHref.origin !== location.origin && urlScore > 0,
        });
      }
      candidates.sort((a, b) => {
        const aSemanticScore = a.urlScore + a.textScore;
        const bSemanticScore = b.urlScore + b.textScore;
        if (aSemanticScore !== bSemanticScore) return bSemanticScore - aSemanticScore;
        if (a.visible !== b.visible) return Number(b.visible) - Number(a.visible);
        if (a.inViewport !== b.inViewport) return Number(b.inViewport) - Number(a.inViewport);
        if (a.urlScore !== b.urlScore) return b.urlScore - a.urlScore;
        if (a.textScore !== b.textScore) return b.textScore - a.textScore;
        if (a.externalRegistration !== b.externalRegistration) {
          return Number(b.externalRegistration) - Number(a.externalRegistration);
        }
        return a.href.localeCompare(b.href);
      });
      const best = candidates[0];
      return best ? { text: best.text, href: best.href } : null;
    }, { anchorKw: ANCHOR_KEYWORDS, visited: Array.from(visitedUrls).map(normalizeVisitedUrl) })
    .catch(() => null);

  if (!found || !found.href) return null;
  return { text: found.text, url: found.href };
}

async function waitForMeaningfulRegistrationState(
  page: Page,
  log: (m: string) => void,
  timeoutMs = SPA_POLL_TIMEOUT_MS
): Promise<RegistrationClassification> {
  const deadline = Date.now() + timeoutMs;
  let classification = await analyzeRegistrationPage(page, log);

  while (true) {
    if (classification.isRegistration) return classification;

    const cta = await findRegistrationLink(page, log);
    const hasActiveEvidence = classification.signals.some((signal) =>
      signal === "form:present" || signal === "email-field" || signal === "business-fields"
    );
    if (cta || hasActiveEvidence || Date.now() >= deadline) return classification;

    await page.waitForTimeout(Math.min(SPA_POLL_INTERVAL_MS, deadline - Date.now()));
    classification = await analyzeRegistrationPage(page, log);
  }
}

async function navigateAndVerify(
  page: Page,
  url: string,
  log: (m: string) => void,
  candidateContext?: CandidateContext,
  timeoutMs = SPA_POLL_TIMEOUT_MS
): Promise<RegistrationClassification | null> {
  try {
    const sourceUrl = candidateContext?.sourceUrl || page.url();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    const res = await waitForMeaningfulRegistrationState(page, log, timeoutMs);
    let isExternalCandidate = false;
    if (candidateContext) {
      try {
        isExternalCandidate = new URL(sourceUrl).origin !== new URL(page.url()).origin;
      } catch {
        isExternalCandidate = true;
      }
    }
    if (candidateContext && isExternalCandidate && !res.isRegistration) {
      log(`[DISCOVERY] External candidate did not verify as registration: ${page.url()}`);
      await page.goBack({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
      return null;
    }
    if (res.isRegistration) {
      if (
        candidateContext &&
        !isTrustedExternalCandidate(
          sourceUrl,
          page.url(),
          candidateContext.anchorText,
          candidateContext.source,
          res
        )
      ) {
        log(`[DISCOVERY] Rejected untrusted external registration candidate: ${page.url()}`);
        await page.goBack({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
        return null;
      }
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
  log: (m: string) => void,
  visitedUrls: Set<string>
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
    const normalizedUrl = normalizeVisitedUrl(url);
    if (visitedUrls.has(normalizedUrl)) continue;
    visitedUrls.add(normalizedUrl);
    log(`[DISCOVERY] STEP 3 trying pattern: ${url}`);
    const res = await navigateAndVerify(page, url, log, undefined, SPECULATIVE_CANDIDATE_TIMEOUT_MS);
    if (res) return res;
  }
  return null;
}

async function tryExternalSearch(
  page: Page,
  log: (m: string) => void,
  visitedUrls: Set<string>,
  sourceContext: CandidateContext
): Promise<RegistrationClassification | null> {
  let host: string;
  try {
    host = new URL(page.url()).hostname;
  } catch {
    return null;
  }
  const q = `site:${host} register business`;
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  const normalizedSearchUrl = normalizeVisitedUrl(searchUrl);
  if (visitedUrls.has(normalizedSearchUrl)) return null;
  visitedUrls.add(normalizedSearchUrl);
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
      const normalizedUrl = normalizeVisitedUrl(u);
      if (visitedUrls.has(normalizedUrl)) continue;
      visitedUrls.add(normalizedUrl);
      const res = await navigateAndVerify(
        page,
        u,
        log,
        { ...sourceContext, anchorText: "external search result" },
        SPECULATIVE_CANDIDATE_TIMEOUT_MS
      );
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
    const retry = await waitForMeaningfulRegistrationState(page, log);
    log(`[DISCOVERY] Re-analysis: flow=${retry.flow}, confidence=${retry.confidence}, signals=${retry.signals.join(", ") || "none"}`);
    if (retry.isRegistration) {
      log(`[DISCOVERY] After re-render current page IS a registration page — proceed to mapping/fill`);
      return { isRegistrationPage: true, flow: retry.flow, confidence: retry.confidence, signals: retry.signals, url: retry.url };
    }
  }

  if (current.flow === "HOMEPAGE") {
    log(`[DISCOVERY] HOMEPAGE GUARD: homepage detected (${current.url}) — will NOT map/fill/submit on homepage`);
  }

  const visitedUrls = new Set<string>([normalizeVisitedUrl(page.url())]);
  const maxLinkHops = 5;
  let linkHops = 0;
  let link: { text: string; url: string } | null = null;
  while (linkHops < maxLinkHops) {
    const sourceUrl = page.url();
    const source = await analyzeRegistrationPage(page, log);
    link = await findRegistrationLink(page, log, visitedUrls);
    if (!link) break;
    const normalizedLinkUrl = normalizeVisitedUrl(link.url);
    visitedUrls.add(normalizedLinkUrl);
    linkHops++;
    log(`[DISCOVERY] STEP 2 link hop ${linkHops}/${maxLinkHops}: "${link.text}" → ${link.url}`);
    const res = await navigateAndVerify(page, link.url, log, {
      sourceUrl,
      source,
      anchorText: link.text,
    });
    if (res) {
      return { isRegistrationPage: true, flow: res.flow, confidence: res.confidence, signals: res.signals, url: res.url };
    }
  }
  if (!link) {
    log(`[DISCOVERY] STEP 2 no registration link found`);
  } else if (linkHops >= maxLinkHops) {
    log(`[DISCOVERY] STEP 2 link traversal limit reached (${maxLinkHops})`);
  }

  const patternRes = await tryStandardPatterns(page, log, visitedUrls);
  if (patternRes) {
    return { isRegistrationPage: true, flow: patternRes.flow, confidence: patternRes.confidence, signals: patternRes.signals, url: patternRes.url };
  }

  const searchSourceUrl = page.url();
  const searchSource = await analyzeRegistrationPage(page, log);
  const searchRes = await tryExternalSearch(page, log, visitedUrls, {
    sourceUrl: searchSourceUrl,
    source: searchSource,
    anchorText: "external search result",
  });
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
