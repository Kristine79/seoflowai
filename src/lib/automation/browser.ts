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
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  return page;
}

export async function takeScreenshot(page: Page): Promise<string> {
  return page.screenshot({ type: "png", fullPage: true }).then((b) => b.toString("base64"));
}

export async function closePage(page: Page): Promise<void> {
  await page.close();
}
