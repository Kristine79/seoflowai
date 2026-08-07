import { launchStealthContext, closeStealthContext, stealthGoto, screenshotToFile } from "../src/lib/automation/stealth";
import fs from "fs";
import path from "path";

async function main() {
  const outDir = path.resolve("human-submit-out/brownbook/manual");
  fs.mkdirSync(outDir, { recursive: true });

  const ctx = await launchStealthContext({ profile: "human-brownbook", headless: false });
  const page = await ctx.newPage();

  await stealthGoto(page, "https://www.brownbook.net", 60000);
  await page.waitForTimeout(5000);
  await screenshotToFile(page, path.join(outDir, "01-home.png"));
  console.log("1) Home loaded. URL:", page.url());

  console.log("\n┏━━━ MANUAL SESSION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓");
  console.log("┃ Проверьте:                                        ┃");
  console.log("┃ 1. Sign in (если аккаунт создавался)              ┃");
  console.log("┃ 2. Add a Business → статус листинга               ┃");
  console.log("┃ 3. Поиск itllect в поиске на главной              ┃");
  console.log("┃ 4. Проверьте почту info@itllect-agency.com        ┃");
  console.log("┃    (activation email от Brownbook)                ┃");
  console.log("┃ Браузер открыт 240 секунд ⏱                      ┃");
  console.log("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n");

  await page.waitForTimeout(240000);

  await screenshotToFile(page, path.join(outDir, "02-final.png"));
  const finalUrl = page.url();
  const finalText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) || "").catch(() => "");
  console.log("Final URL:", finalUrl);
  console.log("Final text:", finalText.replace(/\n+/g, " ").slice(0, 300));

  await ctx.close();
  await closeStealthContext();
  console.log("\nSession closed.");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
