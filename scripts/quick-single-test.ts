import "dotenv/config";
import { chromium } from "playwright";

async function main() {
  // Test: Brownbook /add-business directly
  const url = "https://www.brownbook.net/add-business";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  console.log(`Navigating to ${url}...`);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);
    console.log("Title:", await page.title());
    console.log("URL:", page.url());

    const info = await page.evaluate(() => {
      const title = document.title || "";
      const bodyText = (document.body?.innerText || "").slice(0, 500);
      const fields = document.querySelectorAll("input, select, textarea");
      const required = Array.from(fields).filter(f => f.hasAttribute("required") || f.getAttribute("aria-required") === "true");
      const inputs = Array.from(fields).slice(0, 20).map(f => ({
        tag: f.tagName,
        name: (f as HTMLInputElement).name || "",
        id: f.id,
        placeholder: (f as HTMLInputElement).placeholder || "",
        label: ((f as HTMLElement).closest("div, fieldset")?.querySelector("label, .label, .form-label")?.textContent || "").trim().slice(0, 40),
        required: f.hasAttribute("required"),
      }));
      const cf = html.includes("cf-ray") || html.includes("just a moment") || html.includes("security") ? "possible CF" : "no CF";
      return { title, fields: fields.length, required: required.length, inputs, bodyText: bodyText.replace(/\s+/g, " ").slice(0, 300), cf };
    });

    console.log("CF:", info.cf);
    console.log("Fields:", info.fields, "Required:", info.required);
    console.log("Input detail:");
    info.inputs.forEach(i => console.log(`  <${i.tag}> name="${i.name}" id="${i.id}" placeholder="${i.placeholder}" label="${i.label}" req=${i.required}`));
    console.log("Body:", info.bodyText);
  } catch (e) {
    console.log("ERROR:", (e as Error).message.slice(0, 200));
  }

  await browser.close();
}

main().catch(e => console.error("FATAL:", e));
