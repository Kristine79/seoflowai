import "dotenv/config";
import { chromium } from "playwright";

const UNIQUE = `itllect+dr${Date.now()}@itllect.com`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  console.log("=== DESIGMRUSH FULL FLOW ===\n");
  
  // Step 1: Register
  await page.goto("https://www.designrush.com/submit/agency", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(2000);
  
  // Find radio by label text
  const labels = page.locator("label");
  const labelCount = await labels.count();
  let foundRadio = false;
  for (let i = 0; i < labelCount; i++) {
    const text = await labels.nth(i).textContent();
    if (text && text.includes("US")) {
      await labels.nth(i).click({ force: true });
      foundRadio = true;
      console.log("✅ Radio selected via label");
      break;
    }
  }
  if (!foundRadio) console.log("❌ Radio not found");
  
  await page.fill('[name="first_name"]', "ITllect");
  await page.fill('[name="last_name"]', "Admin");
  await page.fill('[name="email"]', UNIQUE);
  await page.fill('[name="phone"]', "(123) 636-4087");
  await page.fill('[name="password"]', "TestPass456!");
  await page.fill('[name="password_confirmation"]', "TestPass456!");
  
  console.log("✅ Fields filled");
  await page.click('button[type="submit"]');
  
  try { await page.waitForURL("**/step/**", { timeout: 15000 }); } catch {}
  console.log(`1. Register -> ${page.url()}\n`);
  
  // Step 2: Category selection - navigate to IT Services
  const cats = page.locator("a");
  const catCount = await cats.count();
  let catUrl = "";
  for (let i = 0; i < catCount; i++) {
    const text = await cats.nth(i).textContent();
    const href = await cats.nth(i).getAttribute("href");
    if (text && /it services|software development/i.test(text) && href) {
      catUrl = href.startsWith("http") ? href : `https://www.designrush.com${href}`;
      console.log(`2. Go to: "${text}" -> ${catUrl}`);
      break;
    }
  }
  
  if (catUrl) {
    await page.goto(catUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(3000);
  }
  
  console.log(`2. Category URL: ${page.url()}\n`);
  
  // Check for profile/listing form
  const formData = await page.evaluate(() => {
    const inputs = document.querySelectorAll("input:not([type=hidden]), select, textarea");
    const forms = document.querySelectorAll("form");
    const buttons = document.querySelectorAll("a[class*=btn], button[class*=btn], button[type=submit], input[type=submit]");
    const text = document.body.innerText.slice(0, 2000);
    return {
      inputs: Array.from(inputs).slice(0, 20).map(el => ({
        name: (el as HTMLInputElement).name,
        type: (el as HTMLInputElement).type || el.tagName,
        placeholder: (el as HTMLInputElement).placeholder,
        id: el.id,
      })),
      forms: Array.from(forms).map(f => ({ action: f.action, id: f.id, method: f.method })),
      buttons: Array.from(buttons).slice(0, 10).map(b => ({
        text: b.textContent?.trim().slice(0, 40),
        href: (b as HTMLAnchorElement).href || "",
      })),
      text: text.slice(0, 1000),
      url: window.location.href,
    };
  });
  
  console.log(`Forms: ${formData.forms.length}`);
  console.log(`Inputs: ${formData.inputs.length}`);
  console.log(`Buttons: ${formData.buttons.length}`);
  
  for (const inp of formData.inputs) {
    console.log(`  ${inp.type.padEnd(10)} name="${inp.name}" pl="${inp.placeholder}"`);
  }
  
  console.log(`\nButtons:`);
  for (const b of formData.buttons) {
    console.log(`  "${b.text}" -> ${b.href.slice(0, 50)}`);
  }
  
  console.log(`\nPage: ${formData.url}`);
  console.log(`Text: ${formData.text.slice(0, 400)}`);
  
  await page.screenshot({ path: "designrush-flow-result.png", fullPage: true });
  
  await ctx.close();
  await browser.close();
  console.log("\nDone");
}

main().catch(console.error);