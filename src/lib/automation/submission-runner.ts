import OpenAI from "openai";
import { navigateTo, takeScreenshot, closePage } from "./browser";
import { extractFormStructure, checkFormQuality } from "./form-analyzer";
import { mapFieldsWithAI } from "./field-mapper";
import type { Page } from "playwright";
import type { FormField, FormStructure } from "./form-analyzer";

export type SubmissionMode = "PREVIEW" | "SUBMIT";

export type TemplateData = {
  fieldMapping: Record<string, string>;
  formStructure: { fields: FormField[]; submitSelector: string | null; submitText: string | null };
  submitSelector: string | null;
};

export type SubmissionResult = {
  success: boolean;
  screenshot?: string;
  error?: string;
  logs: string[];
  fieldMapping?: Record<string, string>;
  formStructure?: { fields: FormField[]; submitSelector: string | null; submitText: string | null };
  submitSelector?: string | null;
};

export type FormStepResult = {
  fields: FormField[];
  fieldMapping: Record<string, string>;
  filledCount: number;
  logs: string[];
};

const SUBMIT_KEYWORDS = [
  "submit", "register", "create account", "send", "add company",
  "add listing", "sign up", "join", "get started",
  "add business", "list my business", "add my business",
  "отправить", "зарегистрироваться", "создать", "добавить",
];

const NEXT_STEP_KEYWORDS = [
  "next", "continue", "proceed", "step 2", "step 3", "step 4", "step 5",
  "далее", "продолжить", "дальше", "weiter",
];

const LOGIN_KEYWORDS = ["login", "sign in", "log in", "войти", "вход"];

const CRITICAL_FIELDS = ["name", "email", "phone", "website", "address"];

const MAX_STEPS = 5;

const EXCLUDE_KEYWORDS = ["sign in", "log in", "login"];

async function findSubmitButton(page: Page): Promise<{ selector: string; text: string } | null> {
  return page.evaluate(({ submit, exclude }: { submit: string[]; exclude: string[] }) => {
    const buttons = document.querySelectorAll(
      "button, input[type=submit], a[role=button], [class*=btn], [class*=button]"
    );

    for (const el of buttons) {
      const text = (el.textContent || (el as HTMLInputElement).value || "").trim().toLowerCase();
      if (!text) continue;
      if (exclude.some((kw) => text.includes(kw))) continue;
      if (submit.some((kw) => text.includes(kw))) {
        const escapedClass = el.className.split(" ").filter(Boolean)
          .map((c) => c.replace(/[/:()[\]!@#$%^&*,;=+]/g, "\\$&"))
          .join(".");
        const selector = el.id
          ? `#${el.id}`
          : el.className
            ? `.${escapedClass}`
            : el.tagName.toLowerCase() === "button"
              ? `button:has-text("${el.textContent?.trim()}")`
              : `input[type=submit][value="${(el as HTMLInputElement).value}"]`;
        return { selector, text: el.textContent?.trim() || (el as HTMLInputElement).value || "" };
      }
    }
    return null;
  }, { submit: SUBMIT_KEYWORDS, exclude: EXCLUDE_KEYWORDS });
}

async function findNextStepButton(page: Page): Promise<{ selector: string; text: string } | null> {
  // Wait for React render to complete after select interactions
  await page.waitForTimeout(1500);

  // Wait for any loading indicators to disappear
  try {
    await page.waitForSelector('[class*="loading"], [class*="spinner"], [aria-busy="true"]', {
      state: "hidden",
      timeout: 5000,
    }).catch(() => {});
  } catch {
    // ignore timeout
  }

  const btnText = await page.evaluate(({ next, submit }) => {
    const buttons = document.querySelectorAll(
      "button, input[type=submit], a[role=button]"
    );

    for (const el of buttons) {
      const text = (el.textContent || (el as HTMLInputElement).value || "").trim().toLowerCase();
      if (!text) continue;

      const matchesNext = next.some((kw: string) => text.includes(kw));
      const matchesSubmit = submit.some((kw: string) => text.includes(kw));

      if (matchesNext && !matchesSubmit) {
        return el.textContent?.trim() || (el as HTMLInputElement).value || "";
      }
    }

    return null;
  }, { next: NEXT_STEP_KEYWORDS, submit: SUBMIT_KEYWORDS });

  if (!btnText) {
    // Log what buttons ARE visible for debugging
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, input[type=submit], a[role=button]"));
      return buttons.map(b => ({
        text: (b.textContent || (b as HTMLInputElement).value || "").trim().slice(0, 50),
        textLower: (b.textContent || (b as HTMLInputElement).value || "").trim().toLowerCase(),
        disabled: b.hasAttribute("disabled") || b.getAttribute("aria-disabled") === "true",
        visible: b.checkVisibility?.() ?? true,
        tag: b.tagName,
      })).filter(b => b.text);
    });
    console.log(`[NextButton Debug] All buttons on page: ${JSON.stringify(allButtons)}`);
    console.log(`[NextButton Debug] NEXT_KEYWORDS: ${JSON.stringify(NEXT_STEP_KEYWORDS)}`);

    // Check if any button matches "next"
    const nextMatches = allButtons.filter(b => b.textLower.includes("next"));
    console.log(`[NextButton Debug] Buttons matching "next": ${JSON.stringify(nextMatches)}`);

    return null;
  }

  return { selector: `button:has-text("${btnText}")`, text: btnText };
}

async function detectLoginRequired(page: Page): Promise<boolean> {
  return page.evaluate((keywords: string[]) => {
    const hasPasswordField = !!document.querySelector('input[type="password"]');
    if (!hasPasswordField) return false;
    const html = document.body.innerText.toLowerCase();
    return keywords.some((kw) => html.includes(kw));
  }, LOGIN_KEYWORDS);
}

async function detectEmailVerification(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const html = document.body.innerText.toLowerCase();
    return (
      html.includes("verify your email") ||
      html.includes("confirm your email") ||
      html.includes("check your email") ||
      html.includes("we sent a verification") ||
      html.includes("please verify") ||
      html.includes("подтвердите email") ||
      html.includes("подтвердите почту")
    );
  });
}

async function handleSelectField(
  page: Page,
  selector: string,
  value: string,
  log: (msg: string) => void
): Promise<boolean> {
  let selectEl: import("playwright").ElementHandle<Element> | null;
  try {
    selectEl = await page.$(selector);
  } catch {
    return false;
  }
  if (!selectEl) return false;

  const tagName = await selectEl.evaluate((el) => el.tagName.toLowerCase());

  if (tagName === "select") {
    try {
      const optionExists = await page.evaluate(
        ({ sel, val }) => {
          const el = document.querySelector(sel) as HTMLSelectElement;
          if (!el) return false;
          return Array.from(el.options).some((o) =>
            o.text.toLowerCase().includes(val.toLowerCase()) ||
            o.value.toLowerCase().includes(val.toLowerCase())
          );
        },
        { sel: selector, val: value }
      );

      if (optionExists) {
        log(`Select detected: selecting option matching "${value.slice(0, 40)}"`);
        await page.selectOption(selector, { label: new RegExp(value, "i") as unknown as string });
        log(`  ✓ Selected option for "${value.slice(0, 40)}"`);
        return true;
      }

      const firstOption = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel) as HTMLSelectElement;
        return el?.options?.[0]?.text || null;
      }, selector);

      if (firstOption && !firstOption.includes("Select")) {
        await page.selectOption(selector, { index: 0 });
        log(`Select detected: no exact match, selected first option "${firstOption.slice(0, 40)}"`);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  const isReadOnly = await page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    return !!(el && el.hasAttribute("readonly"));
  }, selector);

  if (isReadOnly) {
    log(`ReadOnly input detected — MUI Autocomplete / custom dropdown for "${selector}"`);
    try {
      await page.click(selector);
      await page.waitForTimeout(500);
    } catch {
      await page.waitForTimeout(200);
    }

    const popupSearchInfo = await page.evaluate(() => {
      const popover = document.querySelector(".MuiPopover-paper, [class*='popper'], [class*='popup']");
      if (!popover) return null;
      const searchInput = popover.querySelector("input[type=text]:not([readonly])");
      return searchInput ? "found" : null;
    });

    if (popupSearchInfo) {
      log(`Popup with search field detected — typing value`);
      const searchInput = page.locator(".MuiPopover-paper input[type=text]:not([readonly])").first();

      const inputVisible = await searchInput.isVisible().catch(() => false);
      if (!inputVisible) {
        log(`Search popup not visible — input may already have value, skipping`);
        return true;
      }

      if (await searchInput.count() > 0) {
        const searchTerms = [value, value.split(" ")[0], value.slice(0, Math.min(8, value.length))];
        let selected = false;

        for (const term of [...new Set(searchTerms)]) {
          if (selected) break;
          if (!term || term.length < 2) continue;

          await searchInput.click();
          await page.waitForTimeout(100);
          await searchInput.fill("");
          await page.waitForTimeout(200);
          await searchInput.type(term, { delay: 25 });

          try {
            await page.waitForSelector('.MuiList-root [role="button"]', { timeout: 6000 });
            const optionEls = page.locator('.MuiList-root [role="button"]');
            const optCount = await optionEls.count();

            if (optCount > 0) {
              const optTexts = await optionEls.allTextContents();
              const searchWords = value.toLowerCase().split(/\s+/).filter(Boolean);
              const wordCount = searchWords.length;
              const scored = optTexts.map((t, i) => {
                const tl = t.toLowerCase();
                if (tl === value.toLowerCase()) return { idx: i, score: 100 };
                if (tl.startsWith(value.toLowerCase())) return { idx: i, score: 50 };
                const matchCount = searchWords.filter(w => tl.includes(w)).length;
                return { idx: i, score: matchCount };
              });
              const bestResult = scored.reduce((a, b) => a.score >= b.score ? a : b);
              if (bestResult.score >= Math.min(2, wordCount)) {
                const bestIdx = bestResult.idx;
                const best = optTexts[bestIdx];
                log(`Options after search "${term}": ${optCount}, best: "${best.slice(0, 40)}"`);
                await optionEls.nth(bestIdx).click();
                await page.waitForTimeout(300);
                await page.keyboard.press("Escape");
                await page.waitForTimeout(200);
                selected = true;
              }
            }
          } catch {
            log(`No results for search term "${term}"`);
          }
        }

        if (selected) return true;

        log(`No matching option found for "${value.slice(0, 30)}", skipping`);
        await searchInput.fill("");
        await page.waitForTimeout(100);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
        return false;
      }
    }

    log(`No popup found for readOnly input, pressing Escape`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
    return false;
  }

  const isReactSelect = await page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const parent = el.closest("[class*='select'], [class*='dropdown'], [class*='autocomplete'], [class*='react-select']");
    const grandparent = el.closest("div")?.parentElement;
    const hasDropdown = !!parent ||
      !!grandparent?.querySelector("[class*='menu'], [class*='option'], [class*='dropdown'], [role='listbox'], [role='combobox']");
    return hasDropdown || el.getAttribute("role") === "combobox";
  }, selector);

  if (!isReactSelect) return false;

  log(`React-select / autocomplete detected for "${selector}"`);

  try {
    await page.click(selector);
    await page.waitForTimeout(400);

    // Always type the search value to filter options
    await page.keyboard.type(value, { delay: 40 });
    await page.waitForTimeout(1000);

    const options = await page.evaluate(() => {
      const allItems = document.querySelectorAll("[role='option']");
      const results: { text: string; index: number }[] = [];
      const seen = new Set<string>();
      allItems.forEach((el, i) => {
        const text = el.textContent?.trim() || "";
        if (text && text.length < 120 && !seen.has(text)) {
          seen.add(text);
          results.push({ text, index: i });
        }
      });
      return results;
    });

    log(`Options found: ${options.length}`);

    if (options.length === 0) {
      log(`No options found for "${value.slice(0, 30)}", trying shorter term`);
      const shortTerm = value.split(" ")[0];
      if (shortTerm && shortTerm !== value) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
        await page.click(selector);
        await page.waitForTimeout(300);
        await page.fill(selector, "");
        await page.waitForTimeout(200);
        await page.keyboard.type(shortTerm, { delay: 30 });
        await page.waitForTimeout(1500);
        const retryOptions = await page.evaluate(() => {
          const items = document.querySelectorAll("[role='option']");
          const results: { text: string; index: number }[] = [];
          const seen = new Set<string>();
          items.forEach((el, i) => {
            const text = el.textContent?.trim() || "";
            if (text && text.length < 120 && !seen.has(text)) {
              seen.add(text);
              results.push({ text, index: i });
            }
          });
          return results;
        });
        if (retryOptions.length > 0) {
          options.length = 0;
          options.push(...retryOptions);
          log(`Retry with "${shortTerm}": ${retryOptions.length} options`);
        }
      }
      if (options.length === 0) {
        await page.keyboard.press("Enter");
        await page.waitForTimeout(400);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
        return true;
      }
    }

    const optionEls = await page.$$("[role='option']");

    // Prefer exact match, then starts-with, then includes, then first non-empty
    const v = value.toLowerCase();
    const bestMatch = options.find(o => o.text.toLowerCase() === v) ||
      options.find(o => o.text.toLowerCase().startsWith(v)) ||
      options.find(o => o.text.toLowerCase().includes(v)) ||
      options.find(o => {
        const t = o.text.toLowerCase();
        if (v.length <= 4 && (t.includes(`(${v})`) || t.includes(` ${v} `) || t.endsWith(` ${v}`))) return true;
        const words = v.split(/\s+/);
        return words.every(w => t.includes(w));
      }) ||
      options.find(o => o.text && o.text.length > 0) ||
      options[0];

    if (bestMatch) {
      try {
        const optionLocator = page.locator(`[role='option']:has-text("${bestMatch.text}")`).first();
        await optionLocator.click({ timeout: 5000 });
        await page.waitForTimeout(500);
        log(`Selected option: "${bestMatch.text.slice(0, 50)}"`);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
        return true;
      } catch {
        log(`Failed to click option "${bestMatch.text.slice(0, 40)}", pressing Enter`);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(400);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
        return true;
      }
    }

    log(`No match for "${value.slice(0, 30)}", skipping`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    return false;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message.slice(0, 80) : "unknown";
    log(`Select handler error: ${errMsg}, returning false`);
    try {
      await page.keyboard.press("Escape");
    } catch {
      // ignore
    }
    return false;
  }
}

async function handleSearchPage(
  page: Page,
  companyData: Record<string, string>,
  log: (msg: string) => void
): Promise<boolean> {
  // Detect search page by URL or by content
  const url = page.url().toLowerCase();
  const isSearchByURL = url.includes("/country-selector/");

  // Also detect by content: presence of "Search" button and minimal inputs
  const contentCheck = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button, a[role=button]")).map(b => b.textContent?.trim().toLowerCase());
    const hasSearchBtn = buttons.some(b => b === "search");
    const hasAddBusinessBtn = buttons.some(b => b?.includes("add") && b?.includes("business"));
    const inputCount = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea").length;
    return { hasSearchBtn, hasAddBusinessBtn, inputCount };
  });

  const isSearchByContent = contentCheck.hasSearchBtn && contentCheck.hasAddBusinessBtn && contentCheck.inputCount <= 5;

  if (!isSearchByURL && !isSearchByContent) return false;

  if (isSearchByURL) {
    log(`Search page detected by URL: ${page.url()}`);
  } else {
    log(`Search page detected by content: ${JSON.stringify(contentCheck)}`);
  }

  const inputInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input, textarea"));
    return inputs.map(el => ({
      placeholder: (el as HTMLInputElement).placeholder || "",
      id: el.id,
      name: (el as HTMLInputElement).name || "",
      className: el.className.slice(0, 60),
      ariaLabel: el.getAttribute("aria-label") || "",
      label: el.closest("div, fieldset")?.querySelector("label, span, .label")?.textContent?.trim() || "",
      tag: el.tagName.toLowerCase(),
    }));
  });
  log(`Available inputs on search page: ${JSON.stringify(inputInfo)}`);

  const businessInfo = inputInfo.find(i =>
    i.placeholder.toLowerCase().includes("business") ||
    i.placeholder.toLowerCase().includes("name") ||
    i.ariaLabel.toLowerCase().includes("business") ||
    i.label.toLowerCase().includes("business")
  );
  const cityInfo = inputInfo.find(i =>
    i.placeholder.toLowerCase().includes("city") ||
    i.placeholder.toLowerCase().includes("select") ||
    i.ariaLabel.toLowerCase().includes("city") ||
    i.label.toLowerCase().includes("city")
  );

  let filled = 0;
  if (businessInfo && companyData.name) {
    const sel = businessInfo.id ? `#${businessInfo.id}` :
      businessInfo.name ? `[name="${businessInfo.name}"]` :
      businessInfo.placeholder ? `[placeholder="${businessInfo.placeholder}"]` : "";
    log(`Filling "${businessInfo.placeholder || businessInfo.label || businessInfo.id}" → "${companyData.name}" via ${sel}`);
    if (sel.length > 3) {
      try {
        const el = await page.$(sel);
        if (el) {
          const readonly = await el.evaluate(e => (e as HTMLInputElement).readOnly);
          if (readonly) {
            await page.click(sel);
            await page.waitForTimeout(300);
            await page.keyboard.type(companyData.name, { delay: 20 });
            filled++;
          } else {
            // Use click + type for React inputs to trigger proper state updates
            await page.click(sel);
            await page.waitForTimeout(200);
            await page.keyboard.type(companyData.name, { delay: 30 });
            filled++;
          }
        }
      } catch (e) {
        const ok = await handleSelectField(page, sel, companyData.name, log);
        if (ok) filled++;
      }
      await page.waitForTimeout(500);
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
  if (cityInfo && companyData.city) {
    const sel = cityInfo.id ? `#${cityInfo.id}` :
      cityInfo.name ? `[name="${cityInfo.name}"]` :
      cityInfo.placeholder ? `[placeholder="${cityInfo.placeholder}"]` : "";
    log(`Filling "${cityInfo.placeholder || cityInfo.label || cityInfo.id}" → "${companyData.city}" via ${sel}`);
    if (sel.length > 3) {
      try {
        const el = await page.$(sel);
        if (el) {
          const readonly = await el.evaluate(e => (e as HTMLInputElement).readOnly);
          if (readonly) {
            await page.click(sel, { force: true });
            await page.waitForTimeout(300);
            await page.keyboard.type(companyData.city, { delay: 20 });
          } else {
            // Use click + type for React inputs
            await page.click(sel);
            await page.waitForTimeout(200);
            await page.keyboard.type(companyData.city, { delay: 30 });
          }
          filled++;
        }
      } catch {
        const ok = await handleSelectField(page, sel, companyData.city, log);
        if (ok) filled++;
      }
      await page.waitForTimeout(500);
    }
  }

  log(`Search fields filled: ${filled}`);
  if (filled === 0) return false;

  // Wait for Search button to be enabled
  await page.waitForTimeout(1000);

  // Try clicking Search button first, then fallback to Enter
  const searchBtn = page.locator('button:has-text("Search")').first();
  if (await searchBtn.isVisible().catch(() => false)) {
    // Wait for button to be enabled (not disabled)
    try {
      await searchBtn.waitFor({ state: "visible", timeout: 5000 });
      const isEnabled = await searchBtn.evaluate(el => !el.hasAttribute("disabled")).catch(() => false);
      if (isEnabled) {
        log("Clicking Search button");
        await searchBtn.click({ timeout: 5000 });
      } else {
        log("Search button is disabled, pressing Enter");
        await page.keyboard.press("Enter");
      }
    } catch {
      log("Search button not interactable, pressing Enter");
      await page.keyboard.press("Enter");
    }
  } else {
    log("No Search button found, pressing Enter");
    await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(3000);

  // Check if search results appeared
  const pageAfterSearch = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a[role=button]')).map(b => b.textContent?.trim().slice(0, 50));
    const inputs = Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')).length;
    const hasAddBusiness = buttons.some(b => b?.toLowerCase().includes("add") && b?.toLowerCase().includes("business"));
    return { inputCount: inputs, buttonCount: buttons.length, hasAddBusiness, buttons: buttons.filter(b => b).slice(0, 10) };
  });
  log(`Page after search: ${JSON.stringify(pageAfterSearch)}`);

  // If we already have a full form (not just search page), return early
  if (pageAfterSearch.inputCount > 5 && !pageAfterSearch.hasAddBusiness) {
    log(`Final form detected directly (${pageAfterSearch.inputCount} fields) — skipping search flow`);
    return false;
  }

  // --- Overlay detection and dismissal ---
  // Brownbook uses a fixed z-[999] overlay inside #brownbook-toolbar that intercepts all clicks.
  // Strategy: 1) dismiss overlay via body click, 2) JS click on #add-business-link
  const overlayState = await page.evaluate(() => {
    const z999 = document.querySelectorAll('[class*="z-[999]"]');
    const visibleOverlays: { tag: string; className: string; rect: { w: number; h: number } }[] = [];
    for (const el of z999) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 100) {
        visibleOverlays.push({
          tag: el.tagName,
          className: el.className.slice(0, 80),
          rect: { w: rect.width, h: rect.height },
        });
      }
    }
    return { count: visibleOverlays.length, overlays: visibleOverlays };
  });

  if (overlayState.count > 0) {
    log(`Overlay detected: ${overlayState.count} z-[999] elements covering the page`);
    log(`Overlay close attempted: clicking body to dismiss`);
    await page.click("body", { position: { x: 50, y: 50 }, force: true });
    await page.waitForTimeout(1000);

    const afterDismiss = await page.evaluate(() => {
      const z999 = document.querySelectorAll('[class*="z-[999]"]');
      let visible = 0;
      for (const el of z999) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 100) visible++;
      }
      return visible;
    });
    log(`Overlay after dismiss: ${afterDismiss} z-[999] elements remaining`);

    if (afterDismiss > 0) {
      log(`Overlay still present, removing via DOM...`);
      await page.evaluate(() => {
        const toolbar = document.querySelector('#brownbook-toolbar');
        if (toolbar) {
          const z999 = toolbar.querySelectorAll('[class*="z-[999]"]');
          z999.forEach(el => el.remove());
        }
      });
      await page.waitForTimeout(500);
    }
  }

  // --- Add Business button click ---
  const addBtnExists = await page.evaluate(() => {
    const btn = document.querySelector('#add-business-link');
    if (!btn) {
      const altBtns = Array.from(document.querySelectorAll('button, a[role=button]'))
        .filter(b => b.textContent?.toLowerCase().includes('add') && b.textContent?.toLowerCase().includes('business'));
      return { found: false, altCount: altBtns.length, altTexts: altBtns.map(b => b.textContent?.trim().slice(0, 40)) };
    }
    const rect = btn.getBoundingClientRect();
    return { found: true, id: btn.id, text: btn.textContent?.trim().slice(0, 60), visible: rect.height > 0 && rect.width > 0 };
  });
  log(`Add business button found: ${JSON.stringify(addBtnExists)}`);

  if (addBtnExists.found) {
    const beforeUrl = page.url();
    log(`Add business click method: JS click on #add-business-link`);

    await page.evaluate(() => {
      const btn = document.querySelector('#add-business-link');
      if (btn) btn.click();
    });

    await page.waitForTimeout(2000);
    const urlAfterJsClick = page.url();
    log(`URL after JS click: ${urlAfterJsClick}`);

    if (urlAfterJsClick === beforeUrl) {
      log(`JS click didn't navigate, trying dispatchEvent...`);
      await page.evaluate(() => {
        const btn = document.querySelector('#add-business-link');
        if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      await page.waitForTimeout(3000);
      log(`URL after dispatch: ${page.url()}`);
    }

    if (page.url() === beforeUrl) {
      log(`Neither JS click nor dispatch navigated. Trying Playwright force-click...`);
      const addBtn = page.locator('#add-business-link');
      if (await addBtn.count() > 0) {
        try {
          await addBtn.click({ force: true, timeout: 8000 });
          await page.waitForTimeout(3000);
          log(`URL after force-click: ${page.url()}`);
        } catch (e) {
          log(`Force-click failed: ${e.message.slice(0, 80)}`);
        }
      }
    }

    // Verify final form
    const finalCheck = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea").length;
      const buttons = Array.from(document.querySelectorAll("button, a[role=button]")).map(b => b.textContent?.trim().slice(0, 40)).filter(Boolean);
      return { inputCount: inputs, buttons: buttons.slice(0, 10), url: window.location.href };
    });
    log(`Final form check: ${finalCheck.inputCount} inputs, URL: ${finalCheck.url}`);
    log(`Buttons: ${finalCheck.buttons.join(", ")}`);

    if (finalCheck.inputCount > 10) {
      log(`Final form detected with ${finalCheck.inputCount} fields — ready for filling`);
    } else {
      log(`Warning: only ${finalCheck.inputCount} inputs after Add click — may not be final form`);
    }
  } else if (addBtnExists.altCount > 0) {
    log(`No #add-business-link, but found ${addBtnExists.altCount} alt buttons: ${addBtnExists.altTexts.join(", ")}`);
    const addBtn = page.locator('button:has-text("Add a New Business")')
      .or(page.locator('button:has-text("Add your business")'))
      .first();
    if (await addBtn.count() > 0) {
      log(`Add business click method: Playwright force-click on alt button`);
      await addBtn.click({ force: true, timeout: 8000 });
      await page.waitForTimeout(3000);
      log(`URL after alt click: ${page.url()}`);
    }
  } else {
    log("No 'Add your business' button found after search");
  }

  return true;
}

async function processFormStep(
  page: Page,
  companyData: Record<string, string>,
  openai: OpenAI,
  stepIndex: number,
  existingTemplate: TemplateData | null,
  accumulatedFields: FormField[],
  log: (msg: string) => void,
  mode: SubmissionMode,
  stepLabelValues?: Record<string, string>,
  lastMapping?: Record<string, string>
): Promise<{
  fieldMapping: Record<string, string>;
  filledCount: number;
  failedSelects: number;
  newCount: number;
  previewScreenshot?: string;
}> {
  log(`\n--- Step ${stepIndex + 1}: extracting form fields ---`);
  const formStructure = await extractFormStructure(page);
  log(`Found ${formStructure.fields.length} form fields on step ${stepIndex + 1}`);

  const newFields = formStructure.fields.filter(
    (f) => !accumulatedFields.some((af) => af.selector === f.selector)
  );
  log(`${newFields.length} new fields detected (${accumulatedFields.length + newFields.length} total)`);

  const fieldDetails = formStructure.fields.map(
    (f, i) => `  ${i + 1}. "${f.label || f.placeholder}" (${f.type})${f.required ? " *required" : ""}`
  ).join("\n");
  log(`Fields on step ${stepIndex + 1}:\n${fieldDetails}`);

  let fieldMapping: Record<string, string>;
  let carryoverMap: Record<string, string> = {};

  if (existingTemplate && stepIndex === 0) {
    log("Using saved template mapping (AI skipped)");
    fieldMapping = existingTemplate.fieldMapping;
  } else if (newFields.length === 0 && lastMapping && Object.keys(lastMapping).length > 0) {
    log("No new fields — reusing previous step mapping (AI skipped)");
    fieldMapping = { ...lastMapping };
  } else {
    for (const field of formStructure.fields) {
      const labelKey = (field.label || field.placeholder || "").trim().toLowerCase();
      if (labelKey && stepLabelValues?.[labelKey]) {
        carryoverMap[field.selector] = stepLabelValues[labelKey];
      }
    }

    const unmatchedFields = formStructure.fields.filter((f) => {
      const labelKey = (f.label || f.placeholder || "").trim().toLowerCase();
      return !labelKey || !stepLabelValues?.[labelKey];
    });

    const carryoverCount = Object.keys(carryoverMap).length;
    if (carryoverCount > 0) {
      log(`Label carryover: ${carryoverCount} fields matched by label`);
    }

    fieldMapping = {};

    if (existingTemplate) {
      const currentSelectors = new Set(formStructure.fields.map(f => f.selector));
      for (const [sel, val] of Object.entries(existingTemplate.fieldMapping)) {
        if (currentSelectors.has(sel) && val && !carryoverMap[sel]) {
          fieldMapping[sel] = val;
        }
      }
    }

    if (unmatchedFields.length > 0) {
      log(`Running AI mapping for ${unmatchedFields.length} unmatched fields...`);
      const aiMapping = await mapFieldsWithAI(openai, companyData, unmatchedFields);
      for (const [sel, val] of Object.entries(aiMapping)) {
        if (val && !carryoverMap[sel]) {
          fieldMapping[sel] = val;
        }
      }

      if (stepLabelValues) {
        for (const field of unmatchedFields) {
          const labelKey = (field.label || field.placeholder || "").trim().toLowerCase();
          if (labelKey && aiMapping[field.selector]) {
            stepLabelValues[labelKey] = aiMapping[field.selector];
          }
        }
      }
    } else {
      log("All fields matched by label — reusing values from previous steps");
    }

    Object.assign(fieldMapping, carryoverMap);
  }

  if (stepLabelValues) {
    for (const field of formStructure.fields) {
      const labelKey = (field.label || field.placeholder || "").trim().toLowerCase();
      if (labelKey && fieldMapping[field.selector]) {
        stepLabelValues[labelKey] = fieldMapping[field.selector];
      }
    }
  }

  const currentSelectors = new Set(formStructure.fields.map(f => f.selector));
  const fillableFields = Object.entries(fieldMapping).filter(([sel, v]) => v && v.length > 0 && currentSelectors.has(sel));
  const skippedStale = Object.keys(fieldMapping).length - fillableFields.length;
  log(`Mapping result: ${fillableFields.length} of ${formStructure.fields.length} fields mapped${skippedStale > 0 ? ` (${skippedStale} stale selectors filtered)` : ""}`);

  const mappingDetails = fillableFields.map(([sel, val]) => `  ${sel} → "${val.slice(0, 60)}"`).join("\n");
  if (mappingDetails) log(`Mapped fields:\n${mappingDetails}`);

  // Log label-based step mapping for human readability
  const labelMappingLog = fillableFields.map(([sel, val]) => {
    const field = formStructure.fields.find(f => f.selector === sel);
    const name = field?.label || field?.placeholder || sel;
    return `"${name}" → "${val.slice(0, 40)}"`;
  }).join(", ");
  log(`Step ${stepIndex + 1} mapping: ${labelMappingLog}`);

  if (fillableFields.length === 0) {
    log("No fields mapped on this step");
    return { fieldMapping, filledCount: 0, failedSelects: 0, newCount: newFields.length };
  }

  log(`Filling ${fillableFields.length} form fields...`);
  let filledCount = 0;
  let failedSelects = 0;
  let previewScreenshot: string | undefined;

  for (const [selector, value] of fillableFields) {
    const fieldLabel = formStructure.fields.find((f) => f.selector === selector)?.label || selector;

    const needsSelectHandler = await page.evaluate((sel) => {
      try {
        const el = document.querySelector(sel);
        if (!el) return false;
        const role = el.getAttribute("role");
        const input = el as HTMLInputElement;
        return input.readOnly || role === "combobox" || el.className.includes("react-select");
      } catch { return false; }
    }, selector);

    if (mode === "PREVIEW" && !previewScreenshot && needsSelectHandler && (
      selector.includes("react-select-country") ||
      selector.toLowerCase().includes("country_select")
    )) {
      previewScreenshot = await takeScreenshot(page);
      log(`Preview mode: captured screenshot before Country navigation`);
    }

    let selectOk = false;
    if (needsSelectHandler) {
      selectOk = await handleSelectField(page, selector, value, log);
    } else {
      try {
        await page.fill(selector, value);
        filledCount++;
        log(`  ✓ [${filledCount}/${fillableFields.length}] "${fieldLabel}" → "${value.slice(0, 60)}" (${selector})`);
        continue;
      } catch {
        selectOk = await handleSelectField(page, selector, value, log);
      }
    }

    if (selectOk) {
      filledCount++;
      log(`  ✓ [${filledCount}/${fillableFields.length}] "${fieldLabel}" → "${value.slice(0, 40)}" (${selector})`);
    } else {
      failedSelects++;
      log(`  ✗ [${filledCount + failedSelects}/${fillableFields.length}] "${fieldLabel}" не заполнено`);
    }
  }

  log(`Step ${stepIndex + 1} fill result: ${filledCount} filled, ${failedSelects} failed`);

  return { fieldMapping, filledCount, failedSelects, newCount: newFields.length, previewScreenshot };
}

async function validateBeforeSubmit(
  page: Page,
  allFields: FormField[],
  fieldMapping: Record<string, string>,
  mode: SubmissionMode,
  log: (msg: string) => void,
  companyData?: Record<string, string>,
  formFields?: FormField[]
): Promise<string | null> {
  log("\n--- Pre-submit validation ---");

  const requiredUnfilled = allFields.filter(
    (f) => f.required && (!fieldMapping[f.selector] || fieldMapping[f.selector].length === 0)
  );

  if (requiredUnfilled.length > 0) {
    const names = requiredUnfilled.map((f) => `"${f.label || f.placeholder}"`).join(", ");
    log(`Required fields not filled: ${names}`);
    if (mode === "SUBMIT") {
      return `Не заполнено обязательное поле: ${names}`;
    }
  }

  const filledFieldKeys = Object.entries(fieldMapping)
    .filter(([, v]) => v && v.length > 0)
    .map(([k]) => k);

  const filledLabels = allFields
    .filter((f) => filledFieldKeys.includes(f.selector))
    .map((f) => (f.label || f.placeholder || f.selector).toLowerCase());

  const missingCritical = CRITICAL_FIELDS.filter((cf) =>
    !filledLabels.some((fl) => fl.includes(cf))
  );

  if (missingCritical.length > 0) {
    log(`Critical fields missing: ${missingCritical.join(", ")}`);
    if (mode === "SUBMIT" && !missingCritical.every((f) => f === "website" || f === "address")) {
      return `Не заполнено критичное поле: ${missingCritical.join(", ")}`;
    }
  } else {
    log("All critical fields filled ✓");
  }

  if (mode === "SUBMIT") {
    let submitBtn = await findSubmitButton(page);
    if (!submitBtn) {
      log("No submit button with keywords — checking for Next button as submit...");
      const nextBtn = await findNextStepButton(page);
      if (nextBtn) {
        log(`Using Next button as submit: "${nextBtn.text}" (${nextBtn.selector}) ✓`);
        submitBtn = nextBtn;
      }
    }
    if (submitBtn) {
      log(`Submit button found: "${submitBtn.text}" ✓`);
    } else {
      log("Submit button not found!");
      return "Кнопка отправки не найдена";
    }
  }

  if (mode === "SUBMIT" && companyData && formFields) {
    log("\n--- Semantic value validation ---");
    const criticalLabelMap: Record<string, string[]> = {
      name: ["business name", "company name", "name"],
      address: ["address"],
      city: ["city"],
      phone: ["phone"],
      email: ["email"],
      website: ["website"],
    };

    const valueWarnings: string[] = [];
    for (const [key, labelPatterns] of Object.entries(criticalLabelMap)) {
      const expected = companyData[key];
      if (!expected) continue;

      const matchedFields = formFields.filter((f) => {
        const label = (f.label || f.placeholder || "").toLowerCase();
        return labelPatterns.some((p) => label.includes(p));
      });

      let fieldOk = false;
      for (const field of matchedFields) {
        const mappedValue = fieldMapping[field.selector];
        if (mappedValue) {
          const cleanExpected = expected.toLowerCase().trim().slice(0, 30);
          const cleanActual = mappedValue.toLowerCase().trim().slice(0, 30);
          if (cleanActual.includes(cleanExpected) || cleanExpected.includes(cleanActual)) {
            fieldOk = true;
            break;
          }
        }
      }

      if (!fieldOk) {
        valueWarnings.push(`${key}: expected "${expected.slice(0, 30)}"`);
      }
    }

    if (valueWarnings.length > 0) {
      log(`Value mismatches:\n  ${valueWarnings.join("\n  ")}`);
    } else {
      log("All critical field values match ✓");
    }
  }

  return null;
}

export async function runSubmission(
  directoryUrl: string,
  companyData: Record<string, string>,
  openai: OpenAI,
  mode: SubmissionMode = "PREVIEW",
  existingTemplate: TemplateData | null = null,
  onLog?: (msg: string) => void
): Promise<SubmissionResult> {
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    onLog?.(msg);
  };

  const startedAt = new Date().toISOString();
  log(`=== Submission started ===`);
  log(`URL: ${directoryUrl}`);
  log(`Mode: ${mode}`);
  log(`Start time: ${startedAt}`);
  log(`Template: ${existingTemplate ? `v${existingTemplate.formStructure ? "exists" : "partial"}` : "none"}`);

  let previewScreenshot: string | undefined;

  try {
    log("Browser started");
    log(`Navigating to ${directoryUrl}...`);
    const page = await navigateTo(directoryUrl);
    const openedAt = new Date().toISOString();
    log(`Page opened at: ${openedAt}`);
    log(`Page title: ${await page.title()}`);

    const loginRequired = await detectLoginRequired(page);
    if (loginRequired && mode === "SUBMIT") {
      log("Login form detected — requires authentication");
      const screenshot = await takeScreenshot(page);
      await closePage(page);
      return {
        success: false, logs, screenshot,
        error: "Требуется авторизация: обнаружена форма входа",
      };
    }

    const quality = await checkFormQuality(page);
    log(`Form analysis: ${quality.totalFields} input fields, ${quality.requiredFields} required`);

    if (quality.hasCaptcha) {
      log("CAPTCHA detected — needs manual action");
      const screenshot = await takeScreenshot(page);
      await closePage(page);
      return {
        success: false, logs, screenshot,
        error: "Обнаружена captcha: требуется ручное подтверждение",
      };
    }

    if (quality.totalFields === 0) {
      log("No form fields found on page");
      const screenshot = await takeScreenshot(page);
      await closePage(page);
      return {
        success: false, logs, screenshot,
        error: "Форма не найдена: на странице нет полей ввода",
      };
    }

    let allFields: FormField[] = [];
    let combinedMapping: Record<string, string> = {};
    let totalFilled = 0;
    let totalFailed = 0;
    let reachedStep = 0;
    let currentUrl = page.url();
    let noNewFieldSteps = 0;
    let lastMapping: Record<string, string> = {};
    let stepLabelValues: Record<string, string> = {};

    for (let step = 0; step < MAX_STEPS; step++) {
      reachedStep = step;

      const stepResult = await processFormStep(
        page, companyData, openai, step, existingTemplate, allFields, log, mode, stepLabelValues, lastMapping
      );

      if (stepResult.previewScreenshot) {
        previewScreenshot = stepResult.previewScreenshot;
      }
      lastMapping = { ...stepResult.fieldMapping };

      allFields = [...allFields, ...await extractFormStructure(page).then((s) => s.fields)];
      const uniqueFields = new Map<string, FormField>();
      allFields.forEach((f) => uniqueFields.set(f.selector, f));
      allFields = Array.from(uniqueFields.values());

      Object.assign(combinedMapping, stepResult.fieldMapping);

      totalFilled += stepResult.filledCount;
      totalFailed += stepResult.failedSelects;

      if (stepResult.newCount === 0) {
        noNewFieldSteps++;
        if (noNewFieldSteps >= 2) {
          log(`\nNo new fields for 2 consecutive steps — stopping step navigation`);
          break;
        }
      } else {
        noNewFieldSteps = 0;
      }

      const newUrl = page.url();
      log(`Current URL: ${newUrl}`);

      // Check if we navigated to search page (by URL or content)
      if (newUrl !== currentUrl) {
        log(`URL changed during field filling: ${currentUrl} → ${newUrl}`);
        currentUrl = newUrl;
        const searchHandled = await handleSearchPage(page, companyData, log);
        if (searchHandled) {
          log(`Search page was handled — continuing to next step`);
          // Check if a new page was opened (target="_blank")
          const newPage = (page as any).__newPage;
          if (newPage) {
            log(`New page context available: ${newPage.url()}`);
          }
        }
        continue;
      }

      // Also check for search page by content even if URL didn't change
      // Wait for page to settle after field filling (especially Country select)
      await page.waitForTimeout(2000);

      const searchCheck = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button, a[role=button]")).map(b => b.textContent?.trim().toLowerCase());
        const hasSearchBtn = buttons.some(b => b === "search");
        const hasAddBusinessBtn = buttons.some(b => b?.includes("add") && b?.includes("business"));
        const inputCount = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea").length;
        return { hasSearchBtn, hasAddBusinessBtn, inputCount, buttons: buttons.filter(Boolean).slice(0, 10) };
      });

      log(`Search page content check: ${JSON.stringify(searchCheck)}`);

      // Search page has "Search" button, "Add business" button, and few inputs (2-3)
      // OR it has "Search" button and very few inputs
      const isSearchPage = (searchCheck.hasSearchBtn && searchCheck.inputCount <= 5) ||
                           (searchCheck.hasSearchBtn && searchCheck.hasAddBusinessBtn);

      if (isSearchPage) {
        log(`Search page detected by content (URL unchanged): ${JSON.stringify(searchCheck)}`);
        currentUrl = newUrl; // Update to prevent re-detection
        const searchHandled = await handleSearchPage(page, companyData, log);
        if (searchHandled) {
          log(`Search page was handled — continuing to next step`);
        }
        continue;
      }

      if (step === 0) {
        await page.keyboard.press("Tab");
        await page.waitForTimeout(500);
      }

      await page.waitForTimeout(1000);

      // Extra wait for React to settle after select interactions
      await page.waitForTimeout(2000);

      log(`About to call findNextStepButton...`);
      const nextBtn = await findNextStepButton(page);
      if (!nextBtn) {
        log(`\nNo next step button found — final step reached`);
        log(`Reason: searched for keywords [${NEXT_STEP_KEYWORDS.join(", ")}] but none matched`);
        break;
      }

      if (step === 0) {
        log(`\nStep ${step + 1} completed, moving to step ${step + 2}...`);
      } else {
        log(`Step ${step + 1} completed, moving to step ${step + 2}...`);
      }
      log(`Next step button: "${nextBtn.text}" (${nextBtn.selector})`);

      if (mode === "PREVIEW") {
        log(`Preview mode: clicking "${nextBtn.text}" to reveal next step`);
      }

      const isDisabled = await page.evaluate((btnText) => {
        const buttons = document.querySelectorAll("button");
        for (const el of buttons) {
          const text = (el.textContent || "").trim();
          if (text === btnText) {
            return el.hasAttribute("disabled") ||
                   el.getAttribute("aria-disabled") === "true" ||
                   el.classList.contains("disabled") ||
                   (el as HTMLButtonElement).disabled;
          }
        }
        return false;
      }, nextBtn.text).catch(() => false);

      if (isDisabled) {
        log(`Next step button is disabled — skipping navigation`);
        break;
      }

      try {
        // Check if the next button might open a new page
        const nextBtnInfo = await page.evaluate((btnText) => {
          const buttons = document.querySelectorAll("button, a[role=button]");
          for (const el of buttons) {
            if ((el.textContent || "").trim() === btnText) {
              return {
                tag: el.tagName,
                href: (el as HTMLAnchorElement).href || null,
                target: (el as HTMLAnchorElement).target || null,
              };
            }
          }
          return null;
        }, nextBtn.text);

        if (nextBtnInfo?.target === "_blank") {
          log("Next button opens new tab — waiting for page event");
          const nextLocator = page.locator(`button:has-text("${nextBtn.text}")`).first();
          const [newPage] = await Promise.all([
            page.context().waitForEvent("page", { timeout: 15000 }),
            nextLocator.click({ timeout: 8000 }),
          ]);
          log(`New page opened: ${newPage.url()}`);
          await newPage.waitForLoadState("load", { timeout: 15000 });
          log(`New page loaded: ${newPage.url()}`);
          // Store new page reference
          (page as any).__newPage = newPage;
          currentUrl = newPage.url();
        } else {
          const nextLocator = page.locator(`button:has-text("${nextBtn.text}")`).first();
          await nextLocator.click({ timeout: 8000 });
          await page.waitForTimeout(4000);
          const newUrl = page.url();
          if (newUrl !== currentUrl) {
            log(`URL changed: ${currentUrl} → ${newUrl}`);
            currentUrl = newUrl;
            if (newUrl.includes("/country-selector/")) {
              log(`Search page reached after Next click — handling search`);
              await handleSearchPage(page, companyData, log);
              await page.waitForTimeout(1000);
            }
          } else {
            log(`URL unchanged (client-side navigation)`);
          }
        }
      } catch (clickErr) {
        const clickMsg = clickErr instanceof Error ? clickErr.message.slice(0, 80) : "unknown";
        log(`Could not click next step button: ${clickMsg}`);
        log(`Halting step navigation — will work with current fields`);
        break;
      }
    }

    log(`\n=== Multi-step summary ===`);
    log(`Steps processed: ${reachedStep + 1}`);
    log(`Total unique fields found: ${allFields.length}`);
    log(`Total fields filled: ${totalFilled}`);
    log(`Total field failures: ${totalFailed}`);

    // Check if we navigated to a new page (from "Add your business" button)
    const newPage = (page as any).__newPage;
    const activePage = newPage || page;

    if (newPage) {
      log(`\n=== New page context detected ===`);
      log(`Using new page for final form processing: ${newPage.url()}`);
    }

    // Final form analysis - extract all fields from the final page
    log(`\n=== Final form analysis ===`);
    const finalFormStructure = await extractFormStructure(activePage);
    log(`Final form has ${finalFormStructure.fields.length} fields`);

    // Check for new fields that weren't in previous steps
    const newFinalFields = finalFormStructure.fields.filter(
      (f) => !allFields.some((af) => af.selector === f.selector)
    );
    if (newFinalFields.length > 0) {
      log(`${newFinalFields.length} new fields detected on final form:`);
      for (const f of newFinalFields) {
        log(`  [${f.type}] "${f.label || f.placeholder}" ${f.selector}${f.required ? " *required" : ""}`);
      }

      // Add new fields to allFields
      allFields.push(...newFinalFields);

      // Map new fields with AI
      log("Mapping new final form fields with AI...");
      const newFieldMapping = await mapFieldsWithAI(openai, companyData, newFinalFields);
      Object.assign(combinedMapping, newFieldMapping);

      // Fill new fields
      const newFillable = Object.entries(newFieldMapping).filter(([, v]) => v && v.length > 0);
      if (newFillable.length > 0) {
        log(`Filling ${newFillable.length} new fields on final form...`);
        for (const [selector, value] of newFillable) {
          const fieldLabel = newFinalFields.find((f) => f.selector === selector)?.label || selector;
          const needsSelect = await activePage.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el) return false;
            return el.hasAttribute("readonly") || el.getAttribute("role") === "combobox";
          }, selector).catch(() => false);

          let filled = false;
          if (needsSelect) {
            filled = await handleSelectField(activePage, selector, value, log);
          } else {
            try {
              await activePage.fill(selector, value);
              filled = true;
            } catch {
              filled = await handleSelectField(activePage, selector, value, log);
            }
          }

          if (filled) {
            totalFilled++;
            log(`  ✓ Final form: "${fieldLabel}" → "${value.slice(0, 60)}"`);
          } else {
            totalFailed++;
            log(`  ✗ Final form: "${fieldLabel}" failed`);
          }
        }
      }
    } else {
      log("No new fields on final form — all fields already processed");
    }

    log(`\n=== Final form state ===`);
    log(`Total unique fields: ${allFields.length}`);
    log(`Total fields filled: ${totalFilled}`);
    log(`Total field failures: ${totalFailed}`);

    if (totalFilled === 0) {
      const screenshot = await takeScreenshot(page);
      await closePage(page);
      if (newPage) await closePage(newPage);
      return {
        success: false, logs, screenshot,
        error: "Playwright не смог заполнить поля: селекторы не найдены",
      };
    }

    if (mode === "SUBMIT") {
      const finalFormFields = finalFormStructure.fields;
      const validationError = await validateBeforeSubmit(activePage, allFields, combinedMapping, mode, log, companyData, finalFormFields);

      if (validationError) {
        const screenshot = await takeScreenshot(activePage);
        await closePage(page);
        if (newPage) await closePage(newPage);
        return {
          success: false, logs, screenshot,
          error: validationError,
        };
      }

      log("SUBMIT mode: searching for final submit button...");
      let submitBtn = await findSubmitButton(activePage);
      if (!submitBtn) {
        log("No submit button found with keywords — checking for Next button as submit");
        const nextBtn = await findNextStepButton(activePage);
        if (nextBtn) {
          log(`Using Next button as submit: "${nextBtn.text}"`);
          submitBtn = nextBtn;
        }
      }
      if (submitBtn) {
        log(`Submit button found: "${submitBtn.text}" (${submitBtn.selector})`);
        try {
          const submitLocator = activePage.locator(`button:has-text("${submitBtn.text}")`).first();
          await submitLocator.click({ timeout: 8000 });
          const afterClickUrl = activePage.url();
          log(`Form submitted, waiting for navigation... (URL: ${afterClickUrl})`);
          await activePage.waitForTimeout(3000);

          const emailVerify = await detectEmailVerification(activePage);
          if (emailVerify) {
            log("Email verification page detected after submit — needs manual confirmation");
            const screenshot = await takeScreenshot(activePage);
            await closePage(page);
            if (newPage) await closePage(newPage);
            return {
              success: false, logs, screenshot,
              error: "Требуется подтверждение email: проверьте почту",
            };
          }
          log("No email verification detected — submit appears successful");
        } catch (clickErr) {
          const clickMsg = clickErr instanceof Error ? clickErr.message.slice(0, 120) : "unknown";
          log(`Could not click submit button: ${clickMsg}`);
        }
      } else {
        log("No final submit button found — needs manual action");
        const screenshot = await takeScreenshot(activePage);
        await closePage(page);
        if (newPage) await closePage(newPage);
        return {
          success: false, logs, screenshot,
          error: "Кнопка отправки не найдена",
        };
      }
    } else {
      log("\nPreview mode: multi-step navigation completed, form NOT submitted");
    }

    log("\nTaking screenshot...");
    const screenshot = previewScreenshot || await takeScreenshot(activePage);

    await closePage(page);
    if (newPage) await closePage(newPage);
    log(`=== Submission completed (${mode}) ===`);
    log(`Duration: ${((Date.now() - new Date(startedAt).getTime()) / 1000).toFixed(1)}s`);

    return {
      success: true,
      logs,
      screenshot,
      fieldMapping: combinedMapping,
      formStructure: finalFormStructure,
      submitSelector: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`Unhandled error: ${msg}`);
    if (err instanceof Error && err.stack) {
      log(`Stack: ${err.stack.slice(0, 200)}`);
    }
    return { success: false, logs, screenshot: previewScreenshot, error: msg };
  }
}
