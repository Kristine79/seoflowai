require("dotenv").config();
const { chromium } = require("playwright");

async function main() {
  console.log("=== Brownbook Toolbar Overlay Diagnostic ===\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("1. Navigate to search page...");
  await page.goto("https://www.brownbook.net/country-selector/us", { waitUntil: "load", timeout: 60000 });
  console.log(`   URL: ${page.url()}`);

  console.log("\n2. Fill business name (triggers toolbar modal)...");
  const businessInput = page.locator('[placeholder="Business type or name"]').first();
  await businessInput.click({ force: true });
  await page.waitForTimeout(300);
  await page.keyboard.type("ITLLECT", { delay: 30 });
  console.log("   ✓ Filled business name");

  await page.waitForTimeout(2000);

  console.log("\n3. Analyze #brownbook-toolbar...");
  const toolbarInfo = await page.evaluate(() => {
    const toolbar = document.querySelector('#brownbook-toolbar');
    if (!toolbar) return null;
    const rect = toolbar.getBoundingClientRect();
    const zIndex = window.getComputedStyle(toolbar).zIndex;

    const children = Array.from(toolbar.children).map(c => ({
      tag: c.tagName,
      className: c.className?.slice(0, 100),
      role: c.getAttribute("role"),
      rect: c.getBoundingClientRect(),
      childCount: c.children.length,
    }));

    const z999Elements = toolbar.querySelectorAll('[class*="z-[999]"]');
    const z999Info = Array.from(z999Elements).map(el => ({
      tag: el.tagName,
      className: el.className?.slice(0, 120),
      role: el.getAttribute("role"),
      ariaModal: el.getAttribute("aria-modal"),
      rect: el.getBoundingClientRect(),
      innerHTML: el.innerHTML.slice(0, 300),
      hasCloseBtn: !!el.querySelector('[aria-label="Close"], button.close, .close'),
      buttons: Array.from(el.querySelectorAll("button")).map(b => ({
        text: b.textContent?.trim().slice(0, 40),
        ariaLabel: b.getAttribute("aria-label"),
        className: b.className?.slice(0, 60),
      })),
    }));

    return {
      toolbarRect: rect,
      toolbarZIndex: zIndex,
      childCount: children.length,
      children,
      z999Count: z999Info.length,
      z999Elements: z999Info,
    };
  });

  if (toolbarInfo) {
    console.log(`   Toolbar rect: ${JSON.stringify(toolbarInfo.toolbarRect)}`);
    console.log(`   Toolbar z-index: ${toolbarInfo.toolbarZIndex}`);
    console.log(`   Children: ${toolbarInfo.childCount}`);
    console.log(`   z-[999] elements: ${toolbarInfo.z999Count}`);

    for (let i = 0; i < toolbarInfo.z999Elements.length; i++) {
      const z = toolbarInfo.z999Elements[i];
      console.log(`\n   --- z-[999] element ${i} ---`);
      console.log(`   Tag: ${z.tag}, Role: ${z.role}, aria-modal: ${z.ariaModal}`);
      console.log(`   Class: ${z.className}`);
      console.log(`   Rect: ${JSON.stringify(z.rect)}`);
      console.log(`   Has close btn: ${z.hasCloseBtn}`);
      console.log(`   Buttons: ${JSON.stringify(z.buttons)}`);
      console.log(`   HTML: ${z.innerHTML.slice(0, 200)}`);
    }
  }

  console.log("\n4. Check for any modal/dialog patterns in toolbar...");
  const modalInfo = await page.evaluate(() => {
    const toolbar = document.querySelector('#brownbook-toolbar');
    if (!toolbar) return null;

    const modalDiv = toolbar.querySelector('[class*="rounded-lg"][class*="bg-white"][class*="shadow"]');
    if (!modalDiv) return { found: false };

    const buttons = Array.from(modalDiv.querySelectorAll("button")).map(b => ({
      text: b.textContent?.trim().slice(0, 60),
      ariaLabel: b.getAttribute("aria-label"),
      className: b.className?.slice(0, 80),
      rect: b.getBoundingClientRect(),
    }));

    const closeBtn = modalDiv.querySelector('[aria-label="Close"], [class*="close"], button[class*="absolute"]');

    return {
      found: true,
      className: modalDiv.className?.slice(0, 120),
      innerHTML: modalDiv.innerHTML.slice(0, 400),
      buttons,
      hasCloseBtn: !!closeBtn,
      closeBtnInfo: closeBtn ? {
        tag: closeBtn.tagName,
        text: closeBtn.textContent?.trim().slice(0, 40),
        ariaLabel: closeBtn.getAttribute("aria-label"),
        className: closeBtn.className?.slice(0, 60),
      } : null,
    };
  });
  console.log(`   Modal found: ${modalInfo?.found}`);
  if (modalInfo?.found) {
    console.log(`   Class: ${modalInfo.className}`);
    console.log(`   Buttons: ${JSON.stringify(modalInfo.buttons)}`);
    console.log(`   Has close btn: ${modalInfo.hasCloseBtn}`);
    if (modalInfo.closeBtnInfo) {
      console.log(`   Close btn: ${JSON.stringify(modalInfo.closeBtnInfo)}`);
    }
    console.log(`   HTML: ${modalInfo.innerHTML.slice(0, 300)}`);
  }

  console.log("\n5. Try Escape key to dismiss modal...");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1000);

  const afterEscape = await page.evaluate(() => {
    const toolbar = document.querySelector('#brownbook-toolbar');
    if (!toolbar) return { toolbarExists: false };
    const z999 = toolbar.querySelectorAll('[class*="z-[999]"]');
    return { toolbarExists: true, z999Count: z999.length };
  });
  console.log(`   After Escape: ${JSON.stringify(afterEscape)}`);

  console.log("\n6. Try clicking outside modal (body)...");
  await page.click("body", { position: { x: 50, y: 50 }, force: true });
  await page.waitForTimeout(1000);

  const afterBodyClick = await page.evaluate(() => {
    const toolbar = document.querySelector('#brownbook-toolbar');
    if (!toolbar) return { toolbarExists: false };
    const z999 = toolbar.querySelectorAll('[class*="z-[999]"]');
    return { toolbarExists: true, z999Count: z999.length };
  });
  console.log(`   After body click: ${JSON.stringify(afterBodyClick)}`);

  console.log("\n7. Check #add-business-link state...");
  const addBtn = await page.evaluate(() => {
    const btn = document.querySelector('#add-business-link');
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return {
      text: btn.textContent?.trim().slice(0, 60),
      rect: { w: rect.width, h: rect.height, top: rect.top, left: rect.left },
      visible: rect.height > 0 && rect.width > 0,
    };
  });
  console.log(`   Add button: ${JSON.stringify(addBtn)}`);

  console.log("\n8. Try JS click on #add-business-link...");
  await page.evaluate(() => {
    const btn = document.querySelector('#add-business-link');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);
  console.log(`   URL after JS click: ${page.url()}`);

  const afterJsClick = await page.evaluate(() => {
    const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea").length;
    const buttons = Array.from(document.querySelectorAll("button, a[role=button]")).map(b => b.textContent?.trim().slice(0, 40)).filter(Boolean);
    return { inputCount: inputs, buttons: buttons.slice(0, 10) };
  });
  console.log(`   Inputs: ${afterJsClick.inputCount}, Buttons: ${afterJsClick.buttons.join(", ")}`);

  if (afterJsClick.inputCount <= 5) {
    console.log("\n9. JS click didn't navigate. Trying dispatchEvent...");
    await page.evaluate(() => {
      const btn = document.querySelector('#add-business-link');
      if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(3000);
    console.log(`   URL after dispatch: ${page.url()}`);

    const afterDispatch = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea").length;
      return { inputCount: inputs };
    });
    console.log(`   Inputs after dispatch: ${afterDispatch.inputCount}`);
  }

  if (afterJsClick.inputCount <= 5) {
    console.log("\n10. Trying to remove overlay and click normally...");
    await page.evaluate(() => {
      const toolbar = document.querySelector('#brownbook-toolbar');
      if (toolbar) {
        const z999 = toolbar.querySelectorAll('[class*="z-[999]"]');
        z999.forEach(el => el.remove());
      }
    });
    await page.waitForTimeout(500);

    const addBtnAfterRemove = page.locator('#add-business-link');
    if (await addBtnAfterRemove.isVisible().catch(() => false)) {
      console.log("   Overlay removed, clicking Add button...");
      await addBtnAfterRemove.click({ timeout: 5000 });
      await page.waitForTimeout(3000);
      console.log(`   URL after normal click: ${page.url()}`);

      const afterNormalClick = await page.evaluate(() => {
        const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea").length;
        const buttons = Array.from(document.querySelectorAll("button, a[role=button]")).map(b => b.textContent?.trim().slice(0, 40)).filter(Boolean);
        return { inputCount: inputs, buttons: buttons.slice(0, 10) };
      });
      console.log(`   Inputs: ${afterNormalClick.inputCount}, Buttons: ${afterNormalClick.buttons.join(", ")}`);
    }
  }

  await page.screenshot({ path: "C:/hp/github/seoflowai/brownbook-toolbar-diagnostic.png", fullPage: true });
  console.log("\n   Screenshot saved");

  console.log("\n=== Diagnostic complete ===");
  await browser.close();
}

main().catch(e => {
  console.error("Error:", e.message);
  if (e.stack) console.error(e.stack.slice(0, 500));
  process.exit(1);
});
