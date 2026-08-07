import { launchStealthContext, stealthGoto, screenshotToFile } from "../src/lib/automation/stealth";
import { MASTER_LIST } from "../src/lib/directories/MASTER_LIST";
import fs from "fs";

const queue = JSON.parse(fs.readFileSync("./human-queue.json", "utf8"));
const targets = queue.filter((e: any) => e.status === "NEEDS_MANUAL" || e.status === "PENDING")
  .sort((a: any, b: any) => a.priority - b.priority);

async function findRegistrationLink(page: any, homeUrl: string): Promise<string | null> {
  try {
    const found = await page.evaluate((url: string) => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a"));
      const kw = ["sign up", "register", "create account", "add business", "get listed",
        "add listing", "join", "become a member", "start", "submit your", "list your",
        "vendor registration", "add your", "claim listing", "apply"];
      for (const a of anchors) {
        const t = (a.textContent || "").trim().toLowerCase();
        const h = a.href || "";
        if (kw.some(k => t.includes(k)) && h && !h.startsWith("javascript") && !h.includes("#")) {
          return h;
        }
      }
      return null;
    }, homeUrl);
    return found;
  } catch { return null; }
}

async function main() {
  console.log("CHECKING REGISTRATION URLS FOR NEEDS_MANUAL PLATFORMS\n");
  const updates: { name: string; old: string; new: string; found: boolean }[] = [];

  for (let i = 0; i < Math.min(targets.length, 20); i++) {
    const t = targets[i];
    const homeUrl = t.url;
    const currentUrl = t.submissionUrl || t.url;

    console.log(`[${i + 1}] ${t.name}`);
    console.log(`  Home: ${homeUrl}`);
    console.log(`  Current submission: ${currentUrl}`);

    let ctx: any = null;
    try {
      ctx = await launchStealthContext({ profile: `urlcheck-${t.name.toLowerCase().replace(/[^a-z]/g, "-")}`, headless: true });
      const page = await ctx.newPage();

      await stealthGoto(page, homeUrl, 25000);
      await page.waitForTimeout(3000);

      const pageTitle = await page.title().catch(() => "N/A");
      console.log(`  Page title: ${pageTitle.slice(0, 60)}`);

      const foundUrl = await findRegistrationLink(page, homeUrl);

      if (foundUrl) {
        console.log(`  Found sign-up link: ${foundUrl.slice(0, 90)}`);
        // Verify it's accessible
        await stealthGoto(page, foundUrl, 20000);
        await page.waitForTimeout(2000);
        const regTitle = await page.title().catch(() => "N/A");
        const regUrl = page.url();
        console.log(`  Registration page: ${regTitle.slice(0, 60)} @ ${regUrl.slice(0, 90)}`);

        if (currentUrl !== regUrl && !currentUrl.includes(regUrl)) {
          updates.push({ name: t.name, old: currentUrl, new: regUrl, found: true });
        }
      } else {
        console.log(`  No sign-up link found on homepage`);
        // Verify current URL is accessible
        await stealthGoto(page, currentUrl, 15000);
        await page.waitForTimeout(2000);
        const curTitle = await page.title().catch(() => "N/A");
        console.log(`  Current URL title: ${curTitle.slice(0, 60)}`);
      }

      await screenshotToFile(page, `urlcheck-${t.name.toLowerCase().replace(/[^a-z]/g, "-")}.png`);
    } catch (err) {
      console.log(`  ERROR: ${err instanceof Error ? err.message.slice(0, 100) : String(err)}`);
    } finally {
      if (ctx) try { await ctx.close(); } catch {}
    }
    console.log("");
  }

  console.log("=== URL UPDATES NEEDED ===");
  for (const u of updates) {
    console.log(`  ${u.name}: ${u.old} → ${u.new}`);
  }
}

main().catch(console.error);
