import { Page } from "playwright";
import OpenAI from "openai";

export type FormField = {
  selector: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  name?: string;
  id?: string;
  ariaLabel?: string;
  autocomplete?: string;
  visible?: boolean;
  inViewport?: boolean;
  disabled?: boolean;
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
      const __name = Function("fn", "return fn");
      void __name;
      const searchRe = new RegExp(searchPattern.source, searchPattern.flags);
      const formElements = document.querySelectorAll(
        "input, select, textarea, button, a[role=button]"
      );
      const results: {
        selector: string; type: string; label: string;
        placeholder: string; required: boolean;
        name?: string; id?: string; ariaLabel?: string;
        autocomplete?: string; visible?: boolean; inViewport?: boolean;
        disabled?: boolean;
      }[] = [];
      let submitSelector: string | null = null;
      let submitText: string | null = null;
      const actionCandidates: {
        selector: string;
        text: string;
        visible: boolean;
        enabled: boolean;
        hasRect: boolean;
        inViewport: boolean;
        sameCurrentStep: boolean;
        sameForm: boolean;
        textScore: number;
        roleScore: number;
        selectorScore: number;
      }[] = [];

      const stepMarker = /step|page|slide|stage|panel|wizard/i;

      // Use the first visible fillable control as a generic active-step anchor.
      // Hidden future-step controls remain in the DOM but do not define this step.
      const activeField = Array.from(
        document.querySelectorAll("input, select, textarea")
      ).find((el) => {
        const inputEl = el as HTMLInputElement;
        const type = inputEl.type || el.tagName.toLowerCase();
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0" &&
          !nonFillable.includes(type.toLowerCase()) &&
          !el.closest(cookieSel)
        );
      }) || null;
      const activeForm = activeField?.closest("form") || null;
      let activeStep: Element | null = null;
      let activeAncestor: Element | null = activeField;
      while (activeAncestor) {
        const activeHtml = activeAncestor as HTMLElement;
        const activeMarker = [
          activeHtml.id,
          String(activeHtml.className || ""),
          activeAncestor.getAttribute("data-step"),
          activeAncestor.getAttribute("data-testid"),
        ].filter(Boolean).join(" ");
        if (stepMarker.test(activeMarker)) {
          activeStep = activeAncestor;
          break;
        }
        activeAncestor = activeAncestor.parentElement;
      }

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

        // Submit buttons / links. Collect matching actions first; visibility and
        // active-step ranking is applied after the full DOM pass.
        let isActionElement = false;
        let actionText: string | null = null;
        let actionSelector: string | null = null;

        if (el instanceof HTMLButtonElement || tag === "button") {
          isActionElement = true;
          const rawText = (el.textContent || "").trim();
          const text = rawText.toLowerCase();
          if (text && keywords.some((kw) => text.includes(kw))) {
            const htmlEl = el as HTMLElement;
            const className = String(htmlEl.className || "").trim();
            actionText = rawText;
            actionSelector = htmlEl.id
              ? `#${CSS.escape(htmlEl.id)}`
              : className
                ? `.${className.split(/\s+/).map((c) => CSS.escape(c)).join(".")}`
                : `button:has-text("${rawText}")`;
          }
        } else if (el instanceof HTMLInputElement && el.type === "submit") {
          isActionElement = true;
          const rawText = (el.value || "").trim();
          const text = rawText.toLowerCase();
          if (keywords.some((kw) => text.includes(kw) || kw.includes(text))) {
            actionText = rawText;
            actionSelector = `input[type=submit]${el.name ? `[name="${el.name}"]` : ""}`;
          }
        } else if (
          tag === "a" &&
          el.getAttribute("role") === "button" &&
          el.textContent
        ) {
          isActionElement = true;
          const rawText = el.textContent.trim();
          const text = rawText.toLowerCase();
          if (keywords.some((kw) => text.includes(kw))) {
            actionText = rawText;
            actionSelector = el.id
              ? `#${CSS.escape(el.id)}`
              : `a:has-text("${rawText}")`;
          }
        }

        if (isActionElement) {
          if (actionText && actionSelector) {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            const htmlEl = el as HTMLElement;
            const inputEl = el as HTMLInputElement;
            const visible =
              rect.width > 0 &&
              rect.height > 0 &&
              rect.bottom > 0 &&
              rect.right > 0 &&
              rect.top < window.innerHeight &&
              rect.left < window.innerWidth &&
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              style.opacity !== "0";
            const candidateForm = el.closest("form");
            let candidateStep: Element | null = null;
            let candidateAncestor: Element | null = el;
            while (candidateAncestor) {
              const candidateHtml = candidateAncestor as HTMLElement;
              const candidateMarker = [
                candidateHtml.id,
                String(candidateHtml.className || ""),
                candidateAncestor.getAttribute("data-step"),
                candidateAncestor.getAttribute("data-testid"),
              ].filter(Boolean).join(" ");
              if (stepMarker.test(candidateMarker)) {
                candidateStep = candidateAncestor;
                break;
              }
              candidateAncestor = candidateAncestor.parentElement;
            }

            const normalizedText = actionText.toLowerCase();
            let actionTextScore = 0;
            for (const keyword of keywords) {
              const normalizedKeyword = keyword.toLowerCase();
              if (normalizedText === normalizedKeyword) actionTextScore = Math.max(actionTextScore, 100);
              else if (normalizedText.startsWith(normalizedKeyword)) actionTextScore = Math.max(actionTextScore, 80);
              else if (normalizedText.includes(normalizedKeyword)) actionTextScore = Math.max(actionTextScore, 60);
              else if (normalizedKeyword.includes(normalizedText) && normalizedText) actionTextScore = Math.max(actionTextScore, 40);
            }

            actionCandidates.push({
              selector: actionSelector,
              text: actionText,
              visible,
              enabled: !(
                el.hasAttribute("disabled") ||
                el.getAttribute("aria-disabled") === "true" ||
                htmlEl.classList.contains("disabled") ||
                inputEl.disabled
              ),
              hasRect: rect.width > 0 && rect.height > 0,
              inViewport:
                rect.width > 0 &&
                rect.height > 0 &&
                rect.bottom > 0 &&
                rect.right > 0 &&
                rect.top < window.innerHeight &&
                rect.left < window.innerWidth,
              sameCurrentStep: !!(
                activeStep &&
                candidateStep &&
                (activeStep === candidateStep ||
                  activeStep.contains(candidateStep) ||
                  candidateStep.contains(activeStep))
              ),
              sameForm: !!activeForm && candidateForm === activeForm,
              textScore: actionTextScore,
              roleScore:
                tag === "button" || el.getAttribute("role") === "button" ? 1 : 0,
              selectorScore: /submit|continue|register|signup|sign-up|create|add|get-started/i.test(
                `${htmlEl.id || ""} ${String(htmlEl.className || "")}`
              )
                ? 1
                : 0,
            });
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
        if (
          rect.width === 0 ||
          rect.height === 0 ||
          rect.bottom <= 0 ||
          rect.right <= 0 ||
          rect.top >= window.innerHeight ||
          rect.left >= window.innerWidth
        ) return;
        const style = window.getComputedStyle(el);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.opacity === "0"
        ) return;

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
          name: namedEl.name || "",
          id: el.id || "",
          ariaLabel: el.getAttribute("aria-label") || "",
          autocomplete: el.getAttribute("autocomplete") || "",
          visible: true,
          inViewport: true,
          disabled: el.hasAttribute("disabled"),
        });
      });

      actionCandidates.sort((a, b) => {
        const priorities: (keyof typeof actionCandidates[number])[] = [
          "visible",
          "enabled",
          "inViewport",
          "hasRect",
          "sameCurrentStep",
          "sameForm",
          "textScore",
          "roleScore",
          "selectorScore",
        ];
        for (const priority of priorities) {
          const aValue = a[priority] as number | boolean;
          const bValue = b[priority] as number | boolean;
          if (aValue !== bValue) return Number(bValue) - Number(aValue);
        }
        return a.selector.localeCompare(b.selector);
      });

      const selectedAction = actionCandidates[0];
      if (selectedAction) {
        submitSelector = selectedAction.selector;
        submitText = selectedAction.text || null;
      }

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
