import "dotenv/config";
import { chromium } from "playwright";
import fs from "fs";

const COMPANY = {
  name: "ITllect",
  email: "info@itllect.com",
  phone: "(123) 636-4087",
  companyName: "ITllect",
  companyPhone: "(123) 636-4087",
  description: "ITllect is a technology consulting firm specializing in AI, cloud infrastructure, and digital transformation solutions for enterprise clients.",
  address: "100 N University Dr",
  city: "Coral Springs",
  state: "FL",
  zip: "33071",
  website: "https://itllect.com",
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  console.log("=== CITYLOCALPRO SUBMISSION PREVIEW ===\n");
  
  await page.goto("https://citylocalpro.com/add-your-business", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);
  
  console.log(`Title: ${await page.title()}`);
  console.log(`URL: ${page.url()}\n`);
  
  // Get all visible field info with labels
  const formInfo = await page.evaluate(() => {
    const form = document.querySelector("form");
    if (!form) return { error: "No form found" };
    
    const allFields = form.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=file]), select, textarea, input[type=checkbox], input[type=file]");
    const submitBtns = form.querySelectorAll("button[type=submit], input[type=submit]");
    
    const fields = Array.from(allFields).map(el => {
      const i = el as HTMLInputElement;
      let labelText = "";
      const label = el.closest("label") || (i.id && document.querySelector(`label[for="${i.id}"]`));
      if (label) labelText = label.textContent?.trim() || "";
      if (!labelText) {
        const parent = el.closest("div");
        if (parent) labelText = parent.textContent?.replace(el.textContent || "", "").trim().slice(0, 60) || "";
      }
      
      return {
        selector: i.id ? `#${i.id}` : i.name ? `[name="${i.name}"]` : el.tagName,
        type: i.type || el.tagName, name: i.name, placeholder: i.placeholder,
        id: i.id, required: i.required, visible: i.offsetParent !== null,
        label: labelText.replace(/\s+/g, " ").slice(0, 60),
      };
    }).filter(f => f.visible);
    
    return {
      action: form.action,
      method: form.method,
      fields,
      submitButtons: Array.from(submitBtns).map(b => ({ text: b.textContent?.trim() || "Submit", type: b.type })),
      hasGoogleSignIn: document.body.innerText.includes("Sign in with Google"),
    };
  });
  
  if (formInfo.error) {
    console.log(`Error: ${formInfo.error}`);
  } else {
    console.log(`Form action: ${formInfo.action}`);
    console.log(`Method: ${formInfo.method}`);
    console.log(`Submit buttons: ${formInfo.submitButtons.map(b => `"${b.text}"`).join(", ")}`);
    console.log(`Has Google Sign In: ${formInfo.hasGoogleSignIn}`);
    console.log(`\nVisible fields (${formInfo.fields.length}):`);
    for (const f of formInfo.fields) {
      console.log(`  ${f.selector.padEnd(25)} type=${f.type.padEnd(8)} req=${f.required ? "Y" : "N"} label="${f.label}"`);
    }
  }
  
  await page.screenshot({ path: "citylocalpro-form.png", fullPage: true });
  const stats = fs.statSync("citylocalpro-form.png");
  console.log(`\nScreenshot: citylocalpro-form.png (${(stats.size / 1024).toFixed(0)} KB)`);
  
  // Try filling the form
  console.log(`\n=== TRYING FORM FILL ===`);
  
  const fillField = async (selector: string, value: string) => {
    try {
      await page.fill(selector, value);
      console.log(`  ✅ ${selector} = "${value}"`);
      return true;
    } catch (e: any) {
      console.log(`  ❌ ${selector}: ${e.message.slice(0, 60)}`);
      return false;
    }
  };
  
  await fillField('[name="name"]', "John Smith");
  await fillField('[name="phone"]', COMPANY.phone);
  await fillField('[name="email"]', COMPANY.email);
  await fillField('[name="password"]', "TempPass123!");
  await fillField('[name="company_name"]', COMPANY.companyName);
  await fillField('[name="company_phone"]', COMPANY.companyPhone);
  await fillField('[name="company_description"]', COMPANY.description);
  await fillField('[name="state"]', COMPANY.state);
  await fillField('[name="city"]', COMPANY.city);
  await fillField('[name="zipcode"]', COMPANY.zip);
  
  // Try selecting category
  try {
    await page.selectOption('[name="category"]', { index: 1 });
    console.log(`  ✅ category selected`);
  } catch (e: any) {
    console.log(`  ❌ category: ${e.message.slice(0, 60)}`);
  }
  
  // Try country code
  try {
    await page.selectOption('[name="country_code"]', "US");
    console.log(`  ✅ country_code = US`);
  } catch (e: any) {
    console.log(`  ❌ country_code: ${e.message.slice(0, 60)}`);
  }
  
  // Check terms
  try {
    await page.check('[name="term"]');
    console.log(`  ✅ term checked`);
  } catch {
    console.log(`  ❌ term: could not check`);
  }
  
  await page.screenshot({ path: "citylocalpro-filled.png", fullPage: true });
  const stats2 = fs.statSync("citylocalpro-filled.png");
  console.log(`\nFilled screenshot: citylocalpro-filled.png (${(stats2.size / 1024).toFixed(0)} KB)`);
  
  await ctx.close();
  await browser.close();
  console.log("\nDone");
}

main().catch(console.error);