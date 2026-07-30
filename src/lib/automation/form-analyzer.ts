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
            ? `#${el.id}`
            : el.className
              ? `.${el.className.split(" ").join(".")}`
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
        ? `#${id}`
        : namedEl.name
          ? `[name="${namedEl.name}"]`
          : el.className
            ? "." + el.className.trim().split(/\s+/).join(".")
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
    const html = document.body.innerHTML.toLowerCase();

    const captchaKeywords = [
      "recaptcha", "g-recaptcha", "hcaptcha", "cf-turnstile",
      "captcha", "i am not a robot", "verify you are human",
    ];
    const hasCaptcha = captchaKeywords.some((kw) => html.includes(kw)) ||
      !!document.querySelector(
        "iframe[src*='recaptcha'], iframe[src*='hcaptcha'], .g-recaptcha, .h-captcha, [cf-turnstile]"
      );

    const formElements = document.querySelectorAll("input, select, textarea");
    let iframes = 0;
    let hiddenLayers = 0;

    document.querySelectorAll("iframe, .modal, [class*=overlay], [class*=popup]").forEach(() => iframes++);

    const totalFields = formElements.length;
    const requiredFields = Array.from(formElements).filter(
      (el) =>
        el.hasAttribute("required") ||
        el.getAttribute("aria-required") === "true"
    ).length;

    const hasNonStandardLayout = totalFields === 0 || iframes > 2 || hiddenLayers > 1 || hasCaptcha;

    return { hasCaptcha, hasNonStandardLayout, totalFields, requiredFields };
  });
}
