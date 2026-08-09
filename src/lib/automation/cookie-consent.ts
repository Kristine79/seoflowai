import type { Page } from "playwright";

const COOKIE_CONTAINER_SELECTORS = [
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
];

const ACCEPT_KEYWORDS = [
  "accept all", "accept", "allow all", "allow", "necessary only", "only necessary",
  "ok", "got it", "agree", "i agree", "agree and continue", "accept cookies", "yes",
];

/**
 * Best-effort cookie-consent dismissal. Returns true if a banner was present
 * and an accept button was clicked. Never throws; never blocks the workflow.
 */
export async function dismissCookieConsent(
  page: Page,
  log: (m: string) => void
): Promise<boolean> {
  const hasBanner = await page
    .evaluate((sels: string[]) => {
      return sels.some((s) => {
        try {
          const el = document.querySelector(s);
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        } catch {
          return false;
        }
      });
    }, COOKIE_CONTAINER_SELECTORS)
    .catch(() => false);

  if (!hasBanner) {
    log("Cookie consent: no banner found — continuing normally");
    return false;
  }

  const clicked = await page
    .evaluate(
      ({ sels, kws }: { sels: string[]; kws: string[] }) => {
        const container = sels
          .map((s) => {
            try {
              return document.querySelector(s);
            } catch {
              return null;
            }
          })
          .find(Boolean) as Element | null;

        const candidates = Array.from(
          document.querySelectorAll<HTMLElement>(
            "button, a[role=button], input[type=button], input[type=submit], [role='button']"
          )
        ).filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && el.offsetParent !== null;
        });

        const scored = candidates.map((el) => {
          const text = (el.textContent || (el as HTMLInputElement).value || "")
            .trim().toLowerCase();
          if (!text) return { el, score: 0, text: "" };
          let score = 0;
          for (const k of kws) {
            if (text === k) score += 10;
            else if (text.includes(k)) score += 5;
          }
          if (container && el.closest(sels.join(","))) score += 3;
          return { el, score, text };
        });

        scored.sort((a, b) => b.score - a.score);
        const best = scored.find((s) => s.score >= 5);
        if (best) {
          best.el.click();
          return best.text;
        }
        return null;
      },
      { sels: COOKIE_CONTAINER_SELECTORS, kws: ACCEPT_KEYWORDS }
    )
    .catch(() => null);

  if (clicked) {
    log(`Cookie consent: clicked "${clicked}" — waiting for DOM update`);
    await page.waitForTimeout(2000);
    return true;
  }

  log("Cookie consent: banner present but no accept button found — continuing normally");
  return false;
}
