import { launchStealthContext, closeStealthContext, stealthGoto, screenshotToFile } from "../src/lib/automation/stealth";
import fs from "fs";
import path from "path";

async function main() {
  const outDir = path.resolve("human-submit-out/brownbook/check2");
  fs.mkdirSync(outDir, { recursive: true });

  const ctx = await launchStealthContext({ profile: "human-brownbook", headless: false });
  const page = await ctx.newPage();

  console.log("1) Goto brownbook.net...");
  await stealthGoto(page, "https://www.brownbook.net", 60000);
  await page.waitForTimeout(4000);
  await screenshotToFile(page, path.join(outDir, "home.png"));
  const url = page.url();
  console.log("URL:", url);

  const signedIn = await page.evaluate(() => {
    const text = document.body?.innerText || "";
    return {
      hasSignOut: /sign out|log out|logout/i.test(text),
      hasSignIn: /sign in|log in/i.test(text),
      snippet: text.replace(/\n+/g, " ").slice(0, 300),
    };
  }).catch(() => null);
  console.log("SIGNED-IN CHECK:", JSON.stringify(signedIn, null, 1));

  console.log("2) Search 'itllect' via /search/business/itllect...");
  await page.goto("https://www.brownbook.net/search/business/itllect", { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(8000);
  await screenshotToFile(page, path.join(outDir, "search-results.png"));
  const res = await page.evaluate(() => {
    const text = document.body?.innerText || "";
    const links = Array.from(document.querySelectorAll("a[href*='/business/']")).map((a) => (a as HTMLAnchorElement).href);
    return { url: location.href, text: text.replace(/\n+/g, " ").slice(0, 800), links: [...new Set(links)].slice(0, 10) };
  }).catch(() => null);
  console.log("SEARCH RESULT:", JSON.stringify(res, null, 1));

  await ctx.close();
  await closeStealthContext();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
