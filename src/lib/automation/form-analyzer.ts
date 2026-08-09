import { Page } from "playwright";
import OpenAI from "openai";

export type FormField = {
  selector: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
};

export type FormStructure = {
  fields: FormField[];
  submitSelector: string | null;
  submitText: string | null;
};

export type FormQuality = {
  hasCaptcha: boolean;
  hasCloudflareChallenge: boolean;
  hasNonStandardLayout: boolean;
  totalFields: number;
  requiredFields: number;
};

const SUBMIT_KEYWORDS = [
  "submit", "register", "create account", "send", "add company",
  "add listing", "continue", "sign up", "join", "get started",
  "add business", "list my business", "add my business",
];

/** Cookie-consent containers / controls that must never be treated as form fields. */
const COOKIE_CONSENT_SELECTOR = [
  "#CybotCookiebotDialog",
  "[id*='Cybot']",
  "[class*='Cookiebot']",
  "#onetrust-banner-sdk",
  "[id*='onetrust']",
  "#cookie-law-info-bar",
  ".cookie-consent",
  ".cookie-banner",
  ".cookie-notice",
  "#cookiebanner",
  "[id*='cookie-banner']",
  "[id*='cookie-consent']",
  "[class*='cookie-banner']",
  "[class*='cookie-consent']",
  ".cc-window",
].join(", ");

/** Control types that cannot be text-filled and should not be mapped as business fields. */
const NON_FILLABLE_INPUT_TYPES = [
  "checkbox", "radio", "hidden", "file", "image", "button", "submit", "reset",
];

const SEARCH_FIELD_PATTERN =
  /search|navigation|nav-search|site-search|filter|keywords.*search/i;

export async function extractFormStructure(page: Page): Promise<FormStructure> {
  return page.evaluate(
    ({ keywords, cookieSel, nonFillable, searchPattern }: { keywords: string[]; cookieSel: string; nonFillable: string[]; searchPattern: { source: string; flags: string } }) => {
      const searchRe = new RegExp(searchPattern.source, searchPattern.flags);
      const formElements = document.querySelectorAll(
        "input, select, textarea, button, a[role=button]"
      );
      const results: {
        selector: string; type: string; label: string;
        placeholder: string; required: boolean;
      }[] = [];
      let submitSelector: string | null = null;
      let submitText: string | null = null;

      formElements.forEach((el) => {
        const tag = el.tagName.toLowerCase();
        const idLower = (el.id || "").toLowerCase();
        const clsLower = ((el.className as string) || "").toLowerCase();
        const nameLower = ((el as HTMLInputElement).name || "").toLowerCase();

        // Never treat cookie-consent containers/controls as form fields.
        if (el.closest(cookieSel)) return;
        if (idLower.includes("cookiebot") || idLower.includes("cybot")) return;
        if (clsLower.includes("cookiebot") || clsLower.includes("cookie-consent")) return;
        if (nameLower.includes("cookiebot")) return;

        // Submit buttons / links
        if (el instanceof HTMLButtonElement || tag === "button") {
          const text = (el.textContent || "").trim().toLowerCase();
          if (text && keywords.some((kw) => text.includes(kw))) {
            submitSelector = el.id
              ? `#${CSS.escape(el.id)}`
              : el.className
                ? `.${el.className.split(" ").map(c => CSS.escape(c)).join(".")}`
                : `button:has-text("${el.textContent?.trim()}")`;
            submitText = el.textContent?.trim() || null;
          }
          return;
        }

        if (el instanceof HTMLInputElement && el.type === "submit") {
          const val = (el.value || "").trim().toLowerCase();
          if (keywords.some((kw) => val.includes(kw) || kw.includes(val))) {
            submitSelector = `input[type=submit]${el.name ? `[name="${el.name}"]` : ""}`;
            submitText = el.value || null;
          }
          return;
        }

        if (
          tag === "a" &&
          el.getAttribute("role") === "button" &&
          el.textContent
        ) {
          const text = el.textContent.trim().toLowerCase();
          if (keywords.some((kw) => text.includes(kw))) {
            submitSelector = el.id
              ? `#${el.id}`
              : `a:has-text("${el.textContent.trim()}")`;
            submitText = el.textContent.trim();
          }
          return;
        }

        // Fillable controls only
        if (tag !== "input" && tag !== "select" && tag !== "textarea") return;

        const inputEl = el as HTMLInputElement;

        // Exclude non-fillable control types (checkbox/radio/hidden/file/button/etc.)
        if (inputEl.type && nonFillable.includes(inputEl.type.toLowerCase())) return;

        // Exclude hidden / invisible elements (0x0). SPA multi-step fields that
        // are not visible yet get picked up by the next extraction pass after
        // the step navigation.
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        const isDisplayNone =
          window.getComputedStyle(el).display === "none" ||
          window.getComputedStyle(el).visibility === "hidden";
        if (isDisplayNone) return;

        // In-form fields are always candidates. Out-of-form fields (SPA custom
        // containers) must pass stricter checks: meaningful selector + not a
        // navigation/search/system control.
        const inForm = !!el.closest("form");
        const namedEl = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const elId = el.id;
        let selector = "";
        if (elId) selector = `#${CSS.escape(elId)}`;
        else if (namedEl.name) selector = `[name="${namedEl.name}"]`;
        else if (el.className) {
          const cls = String(el.className).trim();
          if (cls) selector = "." + cls.split(/\s+/).map((c) => CSS.escape(c)).join(".");
        }

        if (!inForm) {
          const placeholder = inputEl.placeholder || "";
          const name = inputEl.name || "";
          const ariaLabel = el.getAttribute("aria-label") || "";
          const combined = `${name} ${placeholder} ${ariaLabel}`.toLowerCase();

          const isSearch = searchRe.test(combined) || inputEl.type === "search";
          const hasMeaning = Boolean(
            (el.id && el.id.trim()) ||
            (inputEl.name && inputEl.name.trim()) ||
            (inputEl.placeholder && inputEl.placeholder.trim()) ||
            ariaLabel.trim()
          );
          if (isSearch || !hasMeaning) return;
        }

        let label = "";
        const id = el.id;
        if (id) {
          const labelEl = document.querySelector(`label[for="${id}"]`);
          if (labelEl) label = labelEl.textContent?.trim() || "";
        }
        if (!label) {
          const parent = el.closest("label");
          if (parent) label = parent.textContent?.trim() || "";
        }
        if (!label) {
          const wrapper = el.closest("div, fieldset, .form-group, .field");
          if (wrapper) {
            const preceding = wrapper.querySelector(
              "label, span, .label, .field-label, .form-label"
            );
            if (preceding) label = preceding.textContent?.trim() || "";
          }
        }

        results.push({
          selector,
          type: inputEl.type || tag,
          label,
          placeholder: inputEl.placeholder || "",
          required:
            el.hasAttribute("required") ||
            el.getAttribute("aria-required") === "true",
        });
      });

      return { fields: results, submitSelector, submitText };
    },
    { keywords: SUBMIT_KEYWORDS, cookieSel: COOKIE_CONSENT_SELECTOR, nonFillable: NON_FILLABLE_INPUT_TYPES, searchPattern: { source: SEARCH_FIELD_PATTERN.source, flags: SEARCH_FIELD_PATTERN.flags } }
  );
}

export async function checkFormQuality(page: Page): Promise<FormQuality> {
  return page.evaluate(() => {
    const titleLower = (document.title || "").toLowerCase();
    const html = document.documentElement.innerHTML.toLowerCase();
    const bodyText = (document.body?.innerText || "").toLowerCase();

    // Form fields (computed early — used to disambiguate CF challenge from
    // a real form that merely embeds a Cloudflare Turnstile widget).
    const formElements = document.querySelectorAll("input, select, textarea");
    const totalFields = formElements.length;
    const requiredFields = Array.from(formElements).filter(
      (el) =>
        el.hasAttribute("required") ||
        el.getAttribute("aria-required") === "true"
    ).length;

    // --- Cloudflare / anti-bot CHALLENGE PAGE detection ---
    // A CF challenge page replaces the entire page with a "Just a moment..."
    // or "Attention Required" interstitial. It has a distinctive title and
    // almost no form fields. A real form that embeds a Turnstile widget keeps
    // its own page title and has many fields — that is NOT a challenge page.
    const cfTitleMarkers = ["just a moment", "attention required", "cloudflare"];
    const hasCfTitle = cfTitleMarkers.some((m) => titleLower.includes(m));
    const cfBodyMarkers = [
      "performing security verification",
      "this website uses a security service to protect against malicious bots",
      "checking your browser before accessing",
    ];
    const hasCfBody = cfBodyMarkers.some((m) => bodyText.includes(m));
    const hasCfRay = html.includes("cf-ray") || html.includes("_cf_chl_opt");
    // Challenge page: distinctive title OR (body markers + very few fields + short text).
    // The totalFields <= 1 guard prevents false positives on real forms with Turnstile.
    const hasCloudflareChallenge =
      (hasCfTitle && totalFields <= 1) ||
      (hasCfBody && totalFields <= 1 && bodyText.length < 800) ||
      (hasCfTitle && hasCfBody);

    // --- Real captcha widget detection (visible only) ---
    // Catches reCAPTCHA, hCaptcha, and Cloudflare Turnstile widgets that are
    // embedded in an otherwise-visible form. Does NOT trigger on text mentions.
    let hasCaptcha = false;
    const widgetSelectors = ".g-recaptcha, .h-captcha, .cf-turnstile, [cf-turnstile], [data-sitekey], #cf-turnstile-container";
    const widget = document.querySelector(widgetSelectors);
    if (widget) {
      const rect = widget.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) hasCaptcha = true;
    }
    if (!hasCaptcha) {
      const captchaIframe = Array.from(document.querySelectorAll("iframe")).find((f) => {
        const src = (f.src || "").toLowerCase();
        return src.includes("recaptcha") || src.includes("hcaptcha") || src.includes("turnstile");
      });
      if (captchaIframe) {
        const rect = captchaIframe.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) hasCaptcha = true;
      }
    }

    let iframes = 0;
    document.querySelectorAll("iframe, .modal, [class*=overlay], [class*=popup]").forEach(() => iframes++);

    const hasNonStandardLayout = totalFields === 0 || iframes > 2 || hasCaptcha;

    return { hasCaptcha, hasCloudflareChallenge, hasNonStandardLayout, totalFields, requiredFields };
  });
}
