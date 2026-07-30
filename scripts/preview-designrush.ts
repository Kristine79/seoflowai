import "dotenv/config";
import { chromium } from "playwright";
import fs from "fs";

const COMPANY = {
  name: "ITllect",
  description: "ITllect is a technology consulting firm specializing in AI, cloud infrastructure, and digital transformation solutions for enterprise clients.",
  website: "https://itllect.com",
  email: "info@itllect.com",
  phone: "(123) 636-4087",
  address: "100 N University Dr",
  city: "Coral Springs",
  state: "FL",
  zip: "33071",
  country: "US",
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  console.log("=== DESIGHRUSH FULL PREVIEW ===\n");
  
  // Navigate to submission page
  await page.goto("https://www.designrush.com/submit/agency", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const title = await page.title();
  console.log(`Title: ${title}`);
  console.log(`URL: ${page.url()}\n`);
  
  // Full page analysis
  const analysis = await page.evaluate(() => {
    const allInputs = document.querySelectorAll("input:not([type=hidden]), select, textarea");
    const forms = document.querySelectorAll("form");
    
    const details = Array.from(allInputs).map(el => {
      const i = el as HTMLInputElement;
      let labelText = "";
      const label = el.closest("label") || (i.id && document.querySelector(`label[for="${i.id}"]`));
      if (label) labelText = label.textContent?.trim() || "";
      if (!labelText) {
        const p = el.closest("div");
        if (p) labelText = Array.from(p.querySelectorAll("span:not(:has(input)), div:not(:has(input))"))
          .map(e => e.textContent?.trim()).filter(Boolean).join(" ").slice(0, 100);
      }
      return {
        selector: (() => {
          if (i.id) return `#${i.id}`;
          if (i.name) return `[name="${i.name}"]`;
          return el.tagName;
        })(),
        type: i.type || el.tagName, name: i.name, placeholder: i.placeholder,
        required: i.required,
        visible: i.offsetParent !== null,
        label: labelText.slice(0, 80),
        value: i.value || "",
      };
    });
    
    const submitBtns = Array.from(document.querySelectorAll("button[type=submit], input[type=submit], button:has(svg), a[class*=btn]")).map(b => ({
      text: b.textContent?.trim().slice(0, 40) || "",
      type: b.tagName,
      className: b.className.slice(0, 60),
    }));
    
    const pageText = document.body.innerText;
    
    return { fields: details, submitButtons: submitBtns, url: window.location.href, pageTextSample: pageText.slice(0, 1000) };
  });
  
  console.log(`URL: ${analysis.url}`);
  console.log(`Fields found: ${analysis.fields.length}`);
  
  console.log(`\nFields:`);
  for (const f of analysis.fields) {
    console.log(`  ${f.selector.padEnd(20)} type=${f.type.padEnd(10)} name=${(f.name || "").padEnd(25)} required=${f.required ? "Y" : "N"} label="${f.label}"`);
  }
  
  console.log(`\nSubmit buttons:`);
  for (const b of analysis.submitButtons) {
    console.log(`  "${b.text}" (${b.className})`);
  }
  
  await page.screenshot({ path: "designrush-preview.png", fullPage: true });
  const stats = fs.statSync("designrush-preview.png");
  console.log(`\nScreenshot: designrush-preview.png (${(stats.size / 1024).toFixed(0)} KB)`);
  
  await ctx.close();
  await browser.close();
}

main().catch(console.error);