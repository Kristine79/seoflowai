import "dotenv/config";
import { chromium } from "playwright";

const COMPANY = {
  name: "ITllect",
  email: "info@itllect.com",
  phone: "(123) 636-4087",
  website: "https://itllect.com",
  description: "ITllect is a technology consulting firm specializing in AI, cloud infrastructure, and digital transformation solutions for enterprise clients.",
  city: "Coral Springs",
  state: "FL",
  zip: "33071",
  address: "100 N University Dr",
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
  const page = await ctx.newPage();
  
  console.log("=== DESIGMRUSH SUBMISSION PREVIEW ===\n");
  
  // Load the submission form
  await page.goto("https://www.designrush.com/submit/agency", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(3000);
  
  console.log(`Title: ${await page.title()}`);
  console.log(`URL: ${page.url()}\n`);
  
  // Analyze the form structure
  const formAnalysis = await page.evaluate(() => {
    const form = document.querySelector("form");
    if (!form) return { error: "No form" };
    
    const allFields = form.querySelectorAll("input:not([type=hidden]), select, textarea");
    const labels = form.querySelectorAll("label");
    const submitBtns = form.querySelectorAll("button[type=submit]");
    
    // Get field details with labels
    const fields = Array.from(allFields).map(el => {
      const i = el as HTMLInputElement;
      let labelText = "";
      const label = el.closest("label") || (i.id && document.querySelector(`label[for="${i.id}"]`));
      if (label) labelText = label.textContent?.trim() || "";
      if (!labelText) {
        const parent = el.closest("div");
        if (parent) labelText = parent.textContent?.replace(el.textContent || "", "").trim().slice(0, 80) || "";
      }
      return {
        type: i.type || el.tagName,
        name: i.name,
        placeholder: i.placeholder,
        id: i.id,
        required: i.required,
        visible: i.offsetParent !== null,
        label: labelText.replace(/\s+/g, " ").trim().slice(0, 60),
      };
    }).filter(f => f.visible);
    
    const labelsDetail = Array.from(labels).map(l => ({
      text: l.textContent?.trim().slice(0, 60),
      htmlFor: l.htmlFor,
      el: l.outerHTML.slice(0, 100),
    }));
    
    return {
      action: form.action,
      method: form.method,
      fields,
      labels: labelsDetail.slice(0, 15),
      submitBtns: Array.from(submitBtns).map(b => ({ text: b.textContent?.trim().slice(0, 40) })),
    };
  });
  
  if (formAnalysis.error) {
    console.log(`Error: ${formAnalysis.error}`);
  } else {
    console.log(`Form: ${formAnalysis.action}`);
    console.log(`Method: ${formAnalysis.method}`);
    console.log(`Fields: ${formAnalysis.fields.length}`);
    
    for (const f of formAnalysis.fields) {
      console.log(`  ${f.type.padEnd(10)} name="${f.name}" req=${f.required ? "Y" : "N"} visible=${f.visible} label="${f.label}"`);
    }
    
    console.log(`\nLabels:`);
    for (const l of formAnalysis.labels) {
      console.log(`  for="${l.htmlFor}" text="${l.text}"`);
    }
    
    console.log(`\nSubmit:`);
    for (const b of formAnalysis.submitBtns) {
      console.log(`  "${b.text}"`);
    }
  }
  
  await ctx.close();
  await browser.close();
  console.log("\nDone");
}

main().catch(console.error);