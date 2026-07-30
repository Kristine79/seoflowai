import "dotenv/config";
import { chromium, Browser, Page } from "playwright";
import fs from "fs";

const TARGET_DIRS = [
  { platform: "Bark.com", url: "https://www.bark.com/add-business" },
  { platform: "Digital Agency Net", url: "https://digitalagencynetwork.com/add-business" },
  { platform: "Sortlist", url: "https://www.sortlist.com" },
  { platform: "CityLocalPro", url: "https://www.citylocalpro.com" },
  { platform: "Influencer Marketing Hub", url: "https://influencermarketinghub.com" },
];

async function analyzeForm(page: Page) {
  return await page.evaluate(() => {
    const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea");
    const forms = document.querySelectorAll("form");
    const pageText = document.body.innerText.toLowerCase().slice(0, 2000);
    
    const fieldDetails = Array.from(inputs).map(el => {
      const inp = el as HTMLInputElement;
      return {
        tag: el.tagName,
        type: inp.type || el.tagName,
        name: inp.name || "",
        placeholder: inp.placeholder || "",
        id: el.id || "",
        label: "",
        parentText: (el.closest("label")?.textContent || el.closest("div[class*=field]")?.textContent || el.closest("div[class*=form]")?.textContent || "").trim().slice(0, 60),
      };
    }).slice(0, 20);
    
    const buttons = Array.from(document.querySelectorAll("button, input[type=submit], a[class*=btn], a[class*=button]")).map(b => ({
      text: (b.textContent || (b as HTMLInputElement).value || "").trim().slice(0, 50),
      href: (b as HTMLAnchorElement).href || "",
      className: (b.className || "").slice(0, 60),
    })).slice(0, 12);
    
    return {
      fieldCount: inputs.length,
      formCount: forms.length,
      buttonCount: buttons.length,
      pageSnippet: pageText.slice(0, 500),
      formAction: forms[0]?.getAttribute("action") || "",
      formMethod: forms[0]?.method || "",
      fields: fieldDetails,
      buttons,
      keywords: {
        hasSubmit: pageText.includes("submit") || pageText.includes("add business") || pageText.includes("add listing") || pageText.includes("get listed") || pageText.includes("claim"),
        hasSearch: pageText.includes("search") || pageText.includes("find") || pageText.includes("browse"),
        hasSubscribe: pageText.includes("subscribe") || pageText.includes("newsletter") || pageText.includes("sign up"),
        hasLogin: pageText.includes("sign in") || pageText.includes("log in") || pageText.includes("login"),
      }
    };
  });
}

async function runPreview(dir: { platform: string; url: string }) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`PREVIEW: ${dir.platform}`);
  console.log(`URL: ${dir.url}`);
  console.log(`${"=".repeat(60)}`);
  
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
    const page = await context.newPage();
    
    const resp = await page.goto(dir.url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log(`Title: ${title.slice(0, 100)}`);
    console.log(`Status: ${resp?.status()}`);
    
    const info = await analyzeForm(page);
    
    // Determine if this is a listing submission form
    const hasNameField = info.fields.some(f => /name|company|business|firma|unternehmen/i.test(f.name) || /name|company|business|firma|unternehmen/i.test(f.placeholder));
    const hasEmailField = info.fields.some(f => f.type === "email" || /email|e-mail/i.test(f.name) || /email|e-mail/i.test(f.placeholder));
    const hasPhoneField = info.fields.some(f => /phone|telefon|telephone/i.test(f.name) || /phone|telefon|telephone/i.test(f.placeholder));
    const hasWebsiteField = info.fields.some(f => /website|url|web|site|www/i.test(f.name) || /website|url|web|site|www/i.test(f.placeholder));
    const hasAddressField = info.fields.some(f => /address|street|strasse|ort|city|zip|postal/i.test(f.name) || /address|street|strasse|ort|city|zip|postal/i.test(f.placeholder));
    
    const isListingForm = hasNameField && hasEmailField && (hasPhoneField || hasWebsiteField);
    const isSearchForm = info.keywords.hasSearch && info.fields.length <= 2;
    const isSubscribeForm = info.keywords.hasSubscribe && info.fields.length <= 3;
    const isLoginForm = info.keywords.hasLogin && info.fields.length <= 3;
    
    console.log(`\nForms: ${info.formCount}, Fields: ${info.fieldCount}, Buttons: ${info.buttonCount}`);
    console.log(`Form action: ${info.formAction || "(none)"}`);
    
    let formType = "UNKNOWN";
    if (isListingForm) formType = "LISTING SUBMISSION (AUTO)";
    else if (isSearchForm) formType = "SEARCH";
    else if (isSubscribeForm) formType = "SUBSCRIBE";
    else if (isLoginForm) formType = "LOGIN";
    
    console.log(`Form type: ${formType}`);
    console.log(`\nFields hint: name=${hasNameField} email=${hasEmailField} phone=${hasPhoneField} website=${hasWebsiteField} address=${hasAddressField}`);
    
    if (info.fields.length > 0) {
      console.log(`\nFields:`);
      for (const f of info.fields) {
        console.log(`  ${f.tag}.${f.type} name="${f.name}" placeholder="${f.placeholder}" label="${f.label || f.parentText.slice(0, 40)}"`);
      }
    }
    
    console.log(`\nButtons:`);
    for (const b of info.buttons) {
      console.log(`  "${b.text}" class=${b.className.slice(0, 40)}`);
    }
    
    const safeName = dir.platform.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const ssPath = `preview_${safeName}.png`;
    await page.screenshot({ path: ssPath, fullPage: true });
    const stats = fs.statSync(ssPath);
    console.log(`\nScreenshot: ${ssPath} (${(stats.size / 1024).toFixed(0)} KB)`);
    
    await context.close();
    await browser.close();
    
    return { success: true, formType, fields: info.fieldCount, isListingForm };
    
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    if (browser) await browser.close();
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  console.log("Previewing 5 most promising AUTO directories...\n");
  
  for (const dir of TARGET_DIRS) {
    const result = await runPreview(dir);
    const verdict = result.success ? (result.isListingForm ? "✅ REAL FORM" : "⚠️ NOT listing form") : "❌ BLOCKED";
    console.log(`\n${verdict}: ${dir.platform}`);
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log("DONE");
}

main().catch(console.error);