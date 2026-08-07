/**
 * STEALTH harness — headed Chromium с анти-детект init-скриптами и persistent context.
 *
 * Назначение: обходит Cloudflare-проверки "Just a moment" и headless-бот-детект,
 * при этом НЕ решает капчу автоматически — капча выводится на экран (headed),
 * пользователь решает вручную, скрипт ждёт сигнала (pauseForCaptcha).
 *
 * Логины/cookies сохраняются между запусками (userDataDir) -> аккаунты регистрацию
 * можно пройти один раз, а submission-прогон использует тот же профиль.
 *
 * Использует playwright (без playwright-stealth — реализуем аналог через init-скрипты).
 * Не трогает существующий src/lib/automation/browser.ts.
 */

import { chromium, BrowserContext, Page } from "playwright";
import fs from "fs";
import path from "path";

let ctx: BrowserContext | null = null;

const PROFILE_ROOT = path.resolve(process.cwd(), "seoflowai-temp", "agent-profiles");

export interface StealthOptions {
  /** имя профиля (отдельный userDataDir на домен/группу) */
  profile?: string;
  /** headed по умолчанию true — нужна для ручной капчи */
  headless?: boolean;
  /** пользовательский viewport */
  viewport?: { width: number; height: number };
  /** geo locale для отпечатка */
  locale?: string;
}

/**
 * Анти-детект init-скрипт. Запускается до загрузки каждой страницы,
 * маскирует типичные headless-признаки.
 */
const STEALTH_INIT = `
(() => {
  // navigator.webdriver
  try { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); } catch (e) {}
  // languages
  try { Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] }); } catch (e) {}
  // platform
  try { Object.defineProperty(navigator, 'platform', { get: () => 'Win32' }); } catch (e) {}
  // plugins — fake array
  try {
    Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
  } catch (e) {}
  // chrome runtime
  try { window.chrome = window.chrome || { runtime: {} }; } catch (e) {}
  // permissions API
  try {
    const q = navigator.permissions && navigator.permissions.query;
    if (q) {
      navigator.permissions.query = (p) => p && p.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : q.call(navigator.permissions, p);
    }
  } catch (e) {}
  // WebGL vendor/renderer (headless имеет "Google Inc. (Google)" — подставляем ATI)
  try {
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return 'Intel Inc.';
      if (param === 37446) return 'Intel(R) Iris(TM) Plus Graphics OpenGL Engine';
      return getParameter.call(this, param);
    };
  } catch (e) {}
  //hairline feature
  try {
    const elem = document.createElement('canvas');
    const gl = elem.getContext && (elem.getContext('webgl') || elem.getContext('experimental-webgl'));
    if (gl && gl.getExtension) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        const UNSH = gl.getParameter.Original;
      }
    }
  } catch (e) {}
})();
`;

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export async function getStealthContext(opts: StealthOptions = {}): Promise<BrowserContext> {
  if (ctx) return ctx;
  ctx = await launchStealthContext(opts);
  return ctx;
}

/**
 * Создаёт НОВЫЙ отдельный persistent context (свой профиль), не кэшируется.
 * Для конкурентного прогона — каждый воркер создаёт свой, закрывает сам.
 */
export async function launchStealthContext(opts: StealthOptions = {}): Promise<BrowserContext> {
  const profile = opts.profile || "default";
  const userDataDir = path.join(PROFILE_ROOT, profile);
  fs.mkdirSync(userDataDir, { recursive: true });

  const contextOptions: Parameters<typeof chromium["launchPersistentContext"]>[1] = {
    headless: opts.headless ?? false,
    viewport: opts.viewport ?? { width: 1280, height: 800 },
    locale: opts.locale ?? "en-US",
    timezoneId: "America/New_York",
    userAgent: DEFAULT_UA,
    colorScheme: "light",
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-features=IsolateOrigins,site-per-process",
      "--lang=en-US,en",
    ],
  };

  const context = await chromium.launchPersistentContext(userDataDir, contextOptions);
  await context.addInitScript(STEALTH_INIT);
  return context;
}

export async function newStealthPage(opts: StealthOptions = {}): Promise<Page> {
  const context = await getStealthContext(opts);
  const page = await context.newPage();
  return page;
}

export async function closeStealthContext(): Promise<void> {
  if (ctx) {
    await ctx.close();
    ctx = null;
  }
}

/** Открывает URL, ждёт domcontentloaded (увеличенный timeout под Cloudflare). */
export async function stealthGoto(
  page: Page,
  url: string,
  timeout = 45000
): Promise<void> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout }).catch(() => {});
}

/**
 * Проверяет, не застряли ли на странице Cloudflare "Just a moment".
 * Возвращает true если challenge обнаружен.
 */
export async function isCloudflareChallenge(page: Page): Promise<boolean> {
  try {
    const txt = await page
      .evaluate(() => ({
        title: document.title,
        body: document.body ? document.body.innerText.slice(0, 500) : "",
        h1Count: document.querySelectorAll("h1").length,
      }))
      .catch(() => null);
    if (!txt) return false;
    if (/just a moment|checking your browser|cloudflare/i.test(txt.title)) return true;
    if (/just a moment|checking your browser|enable javascript and cookies/i.test(txt.body)) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Ждёт, пока Cloudflare challenge resolved (turnstile auto-solve).
 * Таймаут 90с. Если не прошло — вернёт false (требуется manual).
 */
export async function waitForCloudflareClear(page: Page, timeoutMs = 90000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const still = await isCloudflareChallenge(page);
    if (!still) return true;
    await page.waitForTimeout(2000);
  }
  return false;
}

export interface CaptchaState {
  kind: "recaptcha_v2" | "recaptcha_v3" | "hcaptcha" | "turnstile" | "none" | "unknown";
}

/**
 * Определяет тип капчи на странице.
 */
export async function detectCaptcha(page: Page): Promise<CaptchaState> {
  try {
    const info = await page.evaluate(() => {
      const html = document.documentElement.outerHTML.toLowerCase();
      if (document.querySelector('iframe[src*="recaptcha/api2"]')) {
        if (document.querySelector('.g-recaptcha[data-size="normal"]')) return "recaptcha_v2";
        if (document.querySelector('.g-recaptcha[data-size="invisible"]')) return "recaptcha_v3";
        return "recaptcha_v2";
      }
      if (document.querySelector('iframe[src*="hcaptcha.com"]') || document.querySelector(".h-captcha")) return "hcaptcha";
      if (document.querySelector('iframe[src*="challenges.cloudflare.com"]') || html.includes("cf-turnstile")) return "turnstile";
      return "none";
    });
    return { kind: (info as CaptchaState["kind"]) || "none" };
  } catch {
    return { kind: "unknown" };
  }
}

/**
 * Приостанавливает выполнение и просит пользователя вручную решить капчу,
 * затем вернуться в консоль и нажать ENTER.
 * Возвращает true если пользователь подтвердил, что капча решена.
 */
export async function pauseForManualCaptcha(
  page: Page,
  platform: string,
  captcha: CaptchaState,
  log: (m: string) => void = console.log
): Promise<boolean> {
  if (captcha.kind === "none") return true;
  log(`\n┏━━━ РУЧНАЯ КАПЧА ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`);
  log(`┃ Платформа: ${platform}`);
  log(`┃ Тип капчи:  ${captcha.kind}`);
  log(`┃ URL:        ${page.url()}`);
  log(`┃ `);
  log(`┃ Решите капчу в окне браузера, затем вернитесь сюда`);
  log(`┃ и нажмите ENTER для продолжения...`);
  log(`┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`);
  await waitForEnter();
  return true;
}

/**
 * Ждёт нажатия ENTER в stdin (только для интерактивного запуска bash-сессии).
 * Если stdin не TTY (запуск не interactive), ждёт фиксированный таймаут.
 */
export async function waitForEnter(timeoutMs = 300000): Promise<void> {
  if (process.stdin.isTTY) {
    return new Promise((resolve) => {
      const onData = () => {
        process.stdin.removeListener("data", onData);
        process.stdin.pause();
        resolve();
      };
      process.stdin.resume();
      process.stdin.once("data", onData);
    });
  }
  // non-interactive ждём фиксированно
  await new Promise((r) => setTimeout(r, Math.min(timeoutMs, 60000)));
}

/** Создаёт скриншот в файл, возвращает путь. */
export async function screenshotToFile(page: Page, outPath: string): Promise<string> {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await page.screenshot({ path: outPath, fullPage: true });
  return outPath;
}