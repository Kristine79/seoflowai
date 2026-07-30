import "dotenv/config";
import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  console.log("=== CITYLOCALPRO DEEP PREVIEW ===\n");
  
  await page.goto("https://www.citylocalpro.com", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(4000);
  
  console.log(`Title: ${await page.title()}`);
  console.log(`URL: ${page.url()}\n`);
  
  const analysis = await page.evaluate(() => {
    const allInputs = document.querySelectorAll("input:not([type=hidden]), select, textarea");
    const forms = document.querySelectorAll("form");
    const links = Array.from(document.querySelectorAll("a")).map(a => ({ text: a.textContent?.trim().slice(0, 50), href: a.href })).filter(l => l.text);
    
    const details = Array.from(allInputs).map(el => {
      const i = el as HTMLInputElement;
      let labelText = "";
      const label = el.closest("label") || (i.id && document.querySelector(`label[for="${i.id}"]`));
      if (label) labelText = label.textContent?.trim() || "";
      if (!labelText) {
        const parent = el.closest("div");
        if (parent) labelText = Array.from(parent.querySelectorAll("span, strong, div:not(:has(input))"))
          .map(e => e.textContent?.trim()).filter(Boolean).slice(0, 2).join(" ");
      }
      return {
        type: i.type || el.tagName, name: i.name, placeholder: i.placeholder,
        id: i.id, required: i.required, label: labelText.slice(0, 60),
      };
    }).slice(0, 20);
    
    const pageText = document.body.innerText.toLowerCase();
    
    return {
      fields: details,
      fieldCount: allInputs.length,
      formCount: forms.length,
      formActions: Array.from(forms).map(f => f.action).filter(Boolean).slice(0, 3),
      links: links.filter(l => /add|submit|claim|register|create|listing|business/i.test(l.text || "") || /add|submit|claim|register|create|listing|business/i.test(l.href)).slice(0, 15),
      pageText: pageText.slice(0, 1000),
      url: window.location.href,
    };
  });
  
  console.log(`Forms: ${analysis.formCount}, Fields: ${analysis.fieldCount}`);
  
  if (analysis.fields.length > 0) {
    console.log(`\nFields:`);
    for (const f of analysis.fields) {
      console.log(`  ${f.type.padEnd(12)} name="${f.name || ""}" pl="${f.placeholder || ""}" req=${f.required ? "Y" : "N"} label="${f.label}"`);
    }
  }
  
  if (analysis.links.length > 0) {
    console.log(`\nLinks (add/submit/claim):`);
    for (const l of analysis.links.slice(0, 10)) {
      console.log(`  "${l.text}" -> ${l.href.slice(0, 80)}`);
    }
  }
  
  if (analysis.formActions.length > 0) {
    console.log(`\nForm actions:`);
    for (const a of analysis.formActions) console.log(`  ${a}`);
  }
  
  await page.screenshot({ path: "citylocalpro-preview.png", fullPage: true });
  const stats = fs.statSync("citylocalpro-preview.png");
  console.log(`\nScreenshot: citylocalpro-preview.png (${(stats.size / 1024).toFixed(0)} KB)`);
  
  await ctx.close();
  await browser.close();
}

main().catch(console.error);