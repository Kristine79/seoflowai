require("dotenv").config();
const { chromium } = require("playwright");

const TEST_URLS = [
  // Real business directories with add listing pages
  ["Hotfrog", "https://www.hotfrog.com/add-your-business/"],
  ["11880.com", "https://www.11880.com/branchen/eintragen"],
  ["GoLocal", "https://www.golocal.de/unternehmen-eintragen/"],
  ["Cylex", "https://www.cylex.de/unternehmen-eintragen/"],
  ["Yelp Business", "https://biz.yelp.com/signup"],
  ["Gelbe Seiten", "https://www.gelbeseiten.de/unternehmen-eintragen"],
  ["Das Telefonbuch", "https://www.dastelefonbuch.de/unternehmen-eintragen"],
  ["Google Business", "https://business.google.com/signup"],
];

async function main() {
  const browser = await chromium.launch({ headless: true });

  // Sort by potential
  const results = [];
  for (const [name, url] of TEST_URLS) {
    const page = await browser.newPage();
    try {
      console.log(`\n=== ${name} ===`);
      console.log(`URL: ${url}`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      const info = await page.evaluate(() => {
        const forms = document.querySelectorAll("form");
        const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio])");
        const selects = document.querySelectorAll("select");
        const textareas = document.querySelectorAll("textarea");
        const buttons = document.querySelectorAll("button, input[type=submit]");
        const businessKeywords = /business|company|name|firm|unternehmen|firma|name|address|adresse|phone|telefon|email|website|webseite|category|kategorie|description|beschreibung/i;
        
        const formInputs = Array.from(inputs).map(el => ({
          type: el.type,
          name: el.name,
          placeholder: el.placeholder,
          id: el.id,
          required: el.hasAttribute("required"),
          isBusinessField: businessKeywords.test(el.name + " " + el.placeholder + " " + el.id),
        }));
        
        const businessFields = formInputs.filter(f => f.isBusinessField);
        const submitBtn = Array.from(buttons).find(b => /submit|register|add|eintragen|anmelden|weiter|next|continue|create|sign.?up/i.test((b.textContent || b.value || "").trim()));
        
        return {
          title: document.title?.slice(0, 80),
          url: window.location.href,
          forms: forms.length,
          inputs: inputs.length,
          selects: selects.length,
          textareas: textareas.length,
          businessFields: businessFields.length,
          allFields: formInputs.slice(0, 30),
          hasSubmitBtn: !!submitBtn,
          submitBtnText: submitBtn ? (submitBtn.textContent || submitBtn.value || "").trim().slice(0, 30) : null,
        };
      });
      
      console.log(`Title: ${info.title}`);
      console.log(`URL after nav: ${info.url}`);
      console.log(`Forms: ${info.forms}, Inputs: ${info.inputs}, Selects: ${info.selects}, Textareas: ${info.textareas}`);
      console.log(`Business-related fields: ${info.businessFields}`);
      console.log(`Submit button: ${info.hasSubmitBtn ? info.submitBtnText : "NO"}`);
      
      if (info.allFields.length > 0) {
        console.log("Fields:");
        for (const f of info.allFields) {
          console.log(`  ${f.type} name="${f.name}" placeholder="${f.placeholder}" req=${f.required} biz=${f.isBusinessField}`);
        }
      }
      
      results.push({ name, url: info.url, fields: info.inputs + info.selects + info.textareas, businessFields: info.businessFields, hasSubmit: info.hasSubmitBtn });
    } catch (e) {
      console.log(`Error: ${e.message?.slice(0, 100)}`);
      results.push({ name, url, error: e.message?.slice(0, 60) });
    }
    await page.close();
  }
  
  console.log("\n\n=== SUMMARY ===");
  const ranked = results
    .filter(r => !r.error && r.fields > 0)
    .sort((a, b) => (b.businessFields || 0) - (a.businessFields || 0) || (b.fields || 0) - (a.fields || 0));
  
  for (const r of ranked) {
    console.log(`${r.name}: ${r.fields} fields (${r.businessFields} business), submit=${r.hasSubmit} — ${r.url}`);
  }
  
  await browser.close();
}

main().catch(e => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
