import "dotenv/config";
import { chromium } from "playwright";

const CANDIDATES = [
  { platform: "Opendi", url: "https://www.opendi.us" },
  { platform: "GoodFirms", url: "https://www.goodfirms.co" },
  { platform: "Sortlist", url: "https://www.sortlist.com" },
  { platform: "GitHub", url: "https://github.com/add-listing" },
  { platform: "DesignRush", url: "https://www.designrush.com/add-listing" },
  { platform: "Bark.com", url: "https://www.bark.com/add-business" },
];

async function deepAnalyze(browser, platform, url) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔍 DEEP PREVIEW: ${platform}`);
  console.log(`URL: ${url}`);
  console.log(`${"=".repeat(60)}`);
  
  let ctx = null;
  try {
    ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
    const page = await ctx.newPage();
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(3000);
    
    console.log(`Status: ${resp?.status()}, Title: ${(await page.title()).slice(0, 80)}`);
    
    const analysis = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]), select, textarea");
      const forms = document.querySelectorAll("form");
      const labels = document.querySelectorAll("label");
      const buttons = document.querySelectorAll("button[type=submit], input[type=submit]");
      
      const fieldDetails = Array.from(inputs).map(el => {
        const inp = el as HTMLInputElement;
        // Find label
        let labelText = "";
        const label = el.closest("label") || (inp.id && document.querySelector(`label[for="${inp.id}"]`));
        if (label) labelText = label.textContent?.trim() || "";
        if (!labelText) {
          const parent = el.closest("div[class*='field'], div[class*='form-group'], div[class*='input'], p, li");
          if (parent) labelText = Array.from(parent.querySelectorAll("span, div, p, label"))
            .filter(e => !e.querySelector("input, select, textarea"))
            .map(e => e.textContent?.trim()).filter(Boolean).join(" ").slice(0, 80);
        }
        return {
          tag: el.tagName, type: inp.type || el.tagName,
          name: inp.name, placeholder: inp.placeholder,
          id: inp.id, label: labelText.slice(0, 60),
          autocomplete: inp.autocomplete || "",
        };
      }).slice(0, 20);
      
      const formActions = Array.from(forms).map(f => f.action).filter(Boolean);
      const submitBtnTexts = Array.from(buttons).map(b => b.textContent?.trim()).filter(Boolean);
      const pageText = document.body.innerText.toLowerCase();
      
      return {
        fieldCount: inputs.length,
        formCount: forms.length,
        labelCount: labels.length,
        buttonCount: buttons.length,
        fields: fieldDetails,
        formActions: formActions.slice(0, 3),
        submitButtons: submitBtnTexts.slice(0, 5),
        url: window.location.href,
        hasListingText: /add (business|listing|company|your)|submit (business|listing)|get listed|claim your|create (profile|listing|page)/i.test(pageText),
        hasSearchText: /search|find|browse|look up/i.test(pageText),
        hasLoginText: /sign in|log in|login|create account|register/i.test(pageText),
        categories: Array.from(document.querySelectorAll("a[href*='category'], a[href*='industry']")).slice(0, 5).map(a => a.textContent?.trim()).filter(Boolean),
      };
    });
    
    console.log(`URL (actual): ${analysis.url}`);
    console.log(`Fields: ${analysis.fieldCount}, Forms: ${analysis.formCount}, Labels: ${analysis.labelCount}`);
    console.log(`Submit buttons: ${analysis.submitButtons.length}`);
    console.log(`Has listing text: ${analysis.hasListingText}`);
    
    if (analysis.fields.length > 0) {
      console.log(`\nFields:`);
      for (const f of analysis.fields) {
        const autocomplete = f.autocomplete ? ` auto="${f.autocomplete}"` : "";
        console.log(`  [${f.tag}.${f.type}] name="${f.name}" pl="${f.placeholder}" label="${f.label}"${autocomplete}`);
      }
    }
    
    if (analysis.formActions.length > 0) {
      console.log(`\nForm actions:`);
      for (const a of analysis.formActions) console.log(`  ${a}`);
    }
    
    if (analysis.submitButtons.length > 0) {
      console.log(`\nSubmit:`);
      for (const b of analysis.submitButtons) console.log(`  "${b}"`);
    }
    
    await ctx.close();
    return analysis;
    
  } catch (e) {
    console.error(`Error: ${e instanceof Error ? e.message : e}`);
    if (ctx) await ctx.close();
    return null;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  for (const c of CANDIDATES) {
    await deepAnalyze(browser, c.platform, c.url);
    await new Promise(r => setTimeout(r, 2000));
  }
  
  await browser.close();
  console.log("\nDone");
}

main().catch(console.error);