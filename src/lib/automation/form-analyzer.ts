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

export async function extractFormStructure(page: Page): Promise<FormStructure> {
  return page.evaluate((keywords: string[]) => {
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

      if (el instanceof HTMLButtonElement || tag === "button") {
        const text = (el.textContent || "").trim().toLowerCase();
        if (text && keywords.some((kw) => text.includes(kw))) {
          submitSelector = el.id
            ? `#${CSS.escape(el.id)}`
            : el.className
              ? `.${el.className.split(" ").map(c => CSS.escape(c)).join(".")}`
              : `button:has-text("${el.textContent?.trim()}")`;
          submitText = el.textContent?.trim() || null;
          return;
        }
      }

      if (el instanceof HTMLInputElement && el.type === "submit") {
        const val = (el.value || "").trim().toLowerCase();
        if (keywords.some((kw) => val.includes(kw) || kw.includes(val))) {
          submitSelector = `input[type=submit]${el.name ? `[name="${el.name}"]` : ""}`;
          submitText = el.value || null;
          return;
        }
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
          return;
        }
      }

      if (el instanceof HTMLInputElement && el.type === "submit") return;
      if (el instanceof HTMLButtonElement && el.type === "submit") return;
      if (tag === "a" && el.getAttribute("role") === "button") return;

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

      const namedEl = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const selector = id
        ? `#${CSS.escape(id)}`
        : namedEl.name
          ? `[name="${namedEl.name}"]`
          : el.className
            ? "." + el.className.trim().split(/\s+/).map(c => CSS.escape(c)).join(".")
            : "";

      results.push({
        selector,
        type:
          el instanceof HTMLInputElement ? el.type : tag,
        label,
        placeholder: (el as HTMLInputElement).placeholder || "",
        required:
          el.hasAttribute("required") ||
          el.getAttribute("aria-required") === "true",
      });
    });

    return { fields: results, submitSelector, submitText };
  }, SUBMIT_KEYWORDS);
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
