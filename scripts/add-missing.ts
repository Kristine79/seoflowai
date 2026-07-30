import fs from "fs";

const MISSING = [
  { platform: "Stripe Partner", url: "https://stripe.com/partners", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Partner application" },
  { platform: "Shopify Partners", url: "https://www.shopify.com/partners", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Partner application" },
  { platform: "Webflow Partner", url: "https://webflow.com", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Partner application" },
  { platform: "Mailchimp Partner", url: "https://mailchimp.com", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Partner application" },
  { platform: "WooCommerce Agency", url: "https://woocommerce.com", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Partner application" },
  { platform: "Nextdoor Business", url: "https://nextdoor.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Awwwards", url: "https://www.awwwards.com", type: "NOT_APPLICABLE", reason: "Конкурс дизайна, не каталог размещения", evidence: "Design awards site" },
  { platform: "CSS Design Awards", url: "https://www.cssdesignawards.com", type: "NOT_APPLICABLE", reason: "Конкурс дизайна, не каталог размещения", evidence: "Design awards site" },
  { platform: "SiteInspire", url: "https://www.siteinspire.com", type: "NOT_APPLICABLE", reason: "Галерея дизайна, не каталог размещения", evidence: "Design gallery" },
  { platform: "Express Update USA", url: "https://www.expressupdate.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Neustar Localeze", url: "https://www.neustarlocaleze.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Foursquare Business", url: "https://foursquare.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Find Best SEO", url: "https://findbestseo.com", type: "NOT_APPLICABLE", reason: "Поисковая/агрегатор страница", evidence: "Search page" },
  { platform: "FL Business Dir", url: "https://floridabusinessdirectory.com", type: "NOT_APPLICABLE", reason: "Поисковая страница", evidence: "Search page" },
  { platform: "South FL Biz Journal", url: "https://www.bizjournals.com/southflorida", type: "NOT_APPLICABLE", reason: "Новостной сайт, не каталог", evidence: "News site" },
];

// Read existing report and append missing
const existing = fs.readFileSync("final-directory-report.txt", "utf-8");
const lines = existing.split("\n");
const header = lines[0];
const separator = lines[1];
const existingRows = lines.slice(2);

const missingRows = MISSING.map(r => {
  const url = (r.url || "").slice(0, 42);
  return `${r.platform.padEnd(25)} | ${url.padEnd(42)} | ${r.type.padEnd(15)} | ${r.reason.padEnd(42)} | ${r.evidence}`;
});

const allRows = [...existingRows, ...missingRows];
const fullOutput = [header, separator, ...allRows].join("\n");
fs.writeFileSync("final-directory-report.txt", fullOutput);

// Summary
const allResults = [...JSON.parse(fs.readFileSync("final-report-data.json", "utf-8") || "[]"), ...MISSING];

console.log(`Added ${MISSING.length} missing directories`);
console.log(`Total: ${allRows.length} directories`);