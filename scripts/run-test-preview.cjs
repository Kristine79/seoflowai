const { chromium } = require("playwright");

async function main() {
  console.log("=== PLAYWRIGHT TEST ===\n");

  // Launch browser
  console.log("1. Launching browser...");
  const browser = await chromium.launch({ headless: true });
  console.log("   Browser launched OK");

  const page = await browser.newPage();
  console.log("   New page created");

  // Navigate to ProvenExpert
  const targetUrl = "https://www.provenexpert.com";
  console.log(`2. Navigating to ${targetUrl}...`);
  try {
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 20000 });
    console.log(`   Page loaded: ${await page.title()}`);
    console.log(`   URL after nav: ${page.url()}`);
  } catch (navErr) {
    console.log(`   Navigation warning: ${navErr.message?.slice(0, 100)}`);
    console.log(`   Continuing with current URL: ${page.url()}`);
  }

  // Take screenshot
  console.log("3. Taking screenshot...");
  const ss = await page.screenshot({ type: "png", fullPage: true });
  console.log(`   Screenshot: ${ss.length} bytes (${(ss.length / 1024).toFixed(1)} KB)`);

  // Analyze page
  console.log("4. Analyzing page...");
  const title = await page.title();
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log(`   Title: ${title}`);
  console.log(`   Body preview: ${bodyText.slice(0, 200)}`);

  // Find forms
  console.log("5. Looking for forms...");
  const formInfo = await page.evaluate(() => {
    const forms = document.querySelectorAll("form");
    const inputs = document.querySelectorAll("input, select, textarea");
    const buttons = document.querySelectorAll("button");
    return {
      formCount: forms.length,
      inputCount: inputs.length,
      buttonCount: buttons.length,
      inputs: Array.from(inputs).slice(0, 20).map((el) => ({
        type: el.type || el.tagName,
        name: el.name || "",
        id: el.id || "",
        placeholder: el.placeholder || "",
        label: (() => {
          const id = el.id;
          if (id) {
            const labelEl = document.querySelector(`label[for="${id}"]`);
            if (labelEl) return labelEl.textContent?.trim() || "";
          }
          const parent = el.closest("label");
          if (parent) return parent.textContent?.trim() || "";
          return "";
        })(),
      })),
      buttons: Array.from(buttons).slice(0, 10).map((b) => ({
        text: b.textContent?.trim()?.slice(0, 40) || "",
        type: b.type || "",
      })),
    };
  });
  console.log(`   Forms: ${formInfo.formCount}`);
  console.log(`   Inputs: ${formInfo.inputCount}`);
  console.log(`   Buttons: ${formInfo.buttonCount}`);
  if (formInfo.inputs.length > 0) {
    console.log("   Input fields:");
    for (const inp of formInfo.inputs) {
      console.log(`     - type="${inp.type}" name="${inp.name}" placeholder="${inp.placeholder}" label="${inp.label}"`);
    }
  }
  if (formInfo.buttons.length > 0) {
    console.log("   Buttons:");
    for (const btn of formInfo.buttons) {
      console.log(`     - "${btn.text}" (type=${btn.type})`);
    }
  }

  await browser.close();
  console.log("\n=== DONE ===");
}

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  if (err.stack) console.error(err.stack.slice(0, 500));
  process.exit(1);
});
