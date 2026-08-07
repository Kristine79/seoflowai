import "dotenv/config";
import { chromium } from "playwright";

const DIRECTORIES = [
  // Original 10 (client-priority + classical)
  { name: "Hotfrog", url: "https://www.hotfrog.com/" },
  { name: "Cylex", url: "https://www.cylex.us.com/" },
  { name: "Local.com", url: "https://www.local.com/" },
  { name: "EZlocal", url: "https://www.ezlocal.com/" },
  { name: "Brownbook", url: "https://www.brownbook.net/" },
  { name: "FindUsHere", url: "https://www.find-us-here.com/" },
  { name: "Cybo", url: "https://www.cybo.com/" },
  { name: "iGlobal", url: "https://www.iglobal.co/" },
  { name: "Tupalo", url: "https://www.tupalo.com/" },
  { name: "Opendi", url: "https://www.opendi.us/" },
  // Replacement candidates (classical, likely no Cloudflare)
  { name: "Yalwa", url: "https://www.yalwa.com/" },
  { name: "Fyple", url: "https://www.fyple.com/" },
  { name: "ShowMeLocal", url: "https://www.showmelocal.com/" },
  { name: "BizHwy", url: "https://www.bizhwy.com/" },
  { name: "YellowBot", url: "https://www.yellowbot.com/" },
  { name: "MojoPages", url: "https://www.mojopages.com/" },
  { name: "Naymz", url: "https://www.naymz.com/" },
  { name: "BrownbookAdd", url: "https://www.brownbook.net/addbusiness" },
];

const ADD_BUSINESS_KEYWORDS = [
  "add your business", "add a business", "add business",
  "add a new business", "add my business", "add new business",
  "add company", "add your company",
  "submit your listing", "submit listing", "add your listing",
  "add listing", "list your business", "list my business",
  "free listing", "create a free listing", "get listed",
  "claim your business", "register your business", "post a free ad",
  "add your company free",
];

interface PageDiagnosis {
  url: string;
  title: string;
  cloudflare: boolean;
  realCaptcha: boolean;
  textCaptchaMention: boolean;
  fieldCount: number;
  requiredFieldCount: number;
  addBusinessLinks: { text: string; href: string }[];
  bodyTextSnippet: string;
  htmlLength: number;
  loadTimeMs: number;
}

async function diagnosePage(page: import("playwright").Page, url: string): Promise<PageDiagnosis> {
  const start = Date.now();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  } catch (e) {
    const msg = (e as Error).message.slice(0, 120);
    return {
      url, title: `NAVIGATION_ERROR: ${msg}`,
      cloudflare: false, realCaptcha: false, textCaptchaMention: false,
      fieldCount: 0, requiredFieldCount: 0, addBusinessLinks: [],
      bodyTextSnippet: "", htmlLength: 0, loadTimeMs: Date.now() - start,
    };
  }
  await page.waitForTimeout(2500);
  const loadTimeMs = Date.now() - start;

  const info = await page.evaluate((keywords: string[]) => {
    const title = document.title || "";
    const html = document.documentElement.innerHTML.toLowerCase();
    const bodyText = (document.body?.innerText || "").slice(0, 300);

    // Cloudflare challenge markers
    const cloudflareMarkers = [
      "attention required! | cloudflare",
      "checking your browser before accessing",
      "please enable cookies",
      "cf-challenge",
      "cf-turnstile",
      "ray id",
      "cf-ray",
      "_cf_chl",
      "just a moment...",
      "verify you are human",
    ];
    const titleLower = title.toLowerCase();
    const cloudflare =
      titleLower.includes("cloudflare") ||
      titleLower.includes("just a moment") ||
      titleLower.includes("attention required") ||
      cloudflareMarkers.some((m) => html.includes(m)) &&
        (html.includes("cf-") || html.includes("cloudflare"));

    // Real visible captcha widget
    const captchaWidget =
      document.querySelector(".g-recaptcha, .h-captcha, [cf-turnstile], [data-sitekey]");
    let realCaptcha = false;
    if (captchaWidget) {
      const rect = captchaWidget.getBoundingClientRect();
      realCaptcha = rect.width > 0 || rect.height > 0;
    }
    if (!realCaptcha) {
      const captchaIframe = Array.from(document.querySelectorAll("iframe")).find((f) => {
        const src = f.src.toLowerCase();
        return src.includes("recaptcha") || src.includes("hcaptcha") || src.includes("turnstile");
      });
      if (captchaIframe) {
        const rect = captchaIframe.getBoundingClientRect();
        realCaptcha = rect.width > 0 || rect.height > 0;
      }
    }
    const textCaptchaMention = html.includes("captcha") || html.includes("recaptcha");

    // Form fields
    const formElements = Array.from(document.querySelectorAll("input, select, textarea"));
    const fieldCount = formElements.length;
    const requiredFieldCount = formElements.filter(
      (el) => el.hasAttribute("required") || el.getAttribute("aria-required") === "true"
    ).length;

    // Add Business links
    const anchors = Array.from(
      document.querySelectorAll<HTMLElement>('a, button, [role="link"], [role="button"]')
    );
    const sorted = [...keywords].sort((a, b) => b.length - a.length);
    const addBusinessLinks: { text: string; href: string }[] = [];
    for (const el of anchors) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const text = (el.textContent || "").trim().toLowerCase();
      if (!text || text.length > 80) continue;
      for (const kw of sorted) {
        if (text === kw || text.startsWith(kw) || text.includes(kw)) {
          const href = el.getAttribute("href") || (el as HTMLAnchorElement).href || "";
          addBusinessLinks.push({ text: (el.textContent || "").trim().slice(0, 80), href });
          break;
        }
      }
    }

    return {
      title, cloudflare, realCaptcha, textCaptchaMention,
      fieldCount, requiredFieldCount, addBusinessLinks: addBusinessLinks.slice(0, 5),
      bodyTextSnippet: bodyText.replace(/\s+/g, " ").slice(0, 200),
      htmlLength: html.length,
    };
  }, ADD_BUSINESS_KEYWORDS);

  return { ...info, url: page.url(), loadTimeMs };
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  console.log("=".repeat(80));
  console.log("DIRECTORY DIAGNOSTIC — 10 business directories");
  console.log("=".repeat(80));

  for (const dir of DIRECTORIES) {
    console.log(`\n### ${dir.name} — ${dir.url}`);
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const home = await diagnosePage(page, dir.url);
    console.log(`  [HOME] ${home.loadTimeMs}ms | title: "${home.title}"`);
    console.log(`         cloudflare=${home.cloudflare} realCaptcha=${home.realCaptcha} textCaptcha=${home.textCaptchaMention} fields=${home.fieldCount} required=${home.requiredFieldCount} htmlLen=${home.htmlLength}`);
    if (home.addBusinessLinks.length) {
      console.log(`         Add-Business links:`);
      home.addBusinessLinks.forEach((l) => console.log(`           - "${l.text}" → ${l.href}`));
    } else {
      console.log(`         Add-Business links: NONE`);
    }
    if (home.cloudflare || home.fieldCount === 0) {
      console.log(`         bodyText: "${home.bodyTextSnippet}"`);
    }

    // If Add Business link found and homepage not blocked, follow it
    if (!home.cloudflare && home.addBusinessLinks.length > 0) {
      const link = home.addBusinessLinks[0];
      const targetUrl = link.href.startsWith("http")
        ? link.href
        : new URL(link.href, dir.url).href;
      const addPage = await diagnosePage(page, targetUrl);
      console.log(`  [ADD ] ${addPage.loadTimeMs}ms | ${targetUrl}`);
      console.log(`         title: "${addPage.title}"`);
      console.log(`         cloudflare=${addPage.cloudflare} realCaptcha=${addPage.realCaptcha} textCaptcha=${addPage.textCaptchaMention} fields=${addPage.fieldCount} required=${addPage.requiredFieldCount} htmlLen=${addPage.htmlLength}`);
      if (addPage.fieldCount === 0 || addPage.cloudflare) {
        console.log(`         bodyText: "${addPage.bodyTextSnippet}"`);
      }
    }

    await page.close();
  }

  await browser.close();
  console.log("\n" + "=".repeat(80));
  console.log("Diagnostic complete.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
