import { chromium, Browser, Page } from "playwright";

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({ headless: true });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function navigateTo(url: string): Promise<Page> {
  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  // Wait a bit for JS-rendered content
  await page.waitForTimeout(2000);
  return page;
}

export async function takeScreenshot(page: Page): Promise<string> {
  return page.screenshot({ type: "png", fullPage: true }).then((b) => b.toString("base64"));
}

export async function closePage(page: Page): Promise<void> {
  await page.close();
}
