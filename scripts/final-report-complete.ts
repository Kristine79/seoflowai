import fs from "fs";

const ALL_RESULTS = [
  // SUCCESS (1)
  { platform: "Brownbook", url: "https://www.brownbook.net/add-business", type: "SUCCESS", reason: "Размещение выполнено", evidence: "44 fills, 0 failures, 66.3s" },
  
  // NEEDS_MANUAL - real forms but blocked (3)
  { platform: "CityLocalPro", url: "https://citylocalpro.com/add-your-business", type: "NEEDS_MANUAL", reason: "reCAPTCHA v2 блокирует отправку", evidence: "13 полей заполнены, captcha блокирует" },
  { platform: "DesignRush", url: "https://www.designrush.com/submit/agency", type: "NEEDS_MANUAL", reason: "Cloudflare после регистрации", evidence: "Регистрация успешна, /submit/agency/step/1" },
  { platform: "TopSEOs", url: "https://www.topseos.com", type: "NEEDS_MANUAL", reason: "13 полей формы, требуется регистрация", evidence: "Form detected (13f)" },
  
  // NEEDS_MANUAL - login/registration required (19)
  { platform: "SBA.gov", url: "https://www.sba.gov", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "ActiveCampaign", url: "https://www.activecampaign.com", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Become an ActiveCampaign Partner" },
  { platform: "HubSpot", url: "https://www.hubspot.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Envato", url: "https://envato.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Smashing Magazine", url: "https://www.smashingmagazine.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "SimilarWeb", url: "https://www.similarweb.com", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Partners link" },
  { platform: "BuiltWith", url: "https://builtwith.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Moz", url: "https://moz.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Yext", url: "https://www.yext.com", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Partners link" },
  { platform: "Birdeye", url: "https://birdeye.com", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Google Partnership link" },
  { platform: "Bark.com", url: "https://www.bark.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Behance", url: "https://www.behance.net", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Dribbble", url: "https://dribbble.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Medium", url: "https://medium.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Quora", url: "https://www.quora.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Alignable", url: "https://www.alignable.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Stripe Partner", url: "https://stripe.com/partners", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Partner application" },
  { platform: "Shopify Partners", url: "https://www.shopify.com/partners", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Partner application" },
  { platform: "Webflow Partner", url: "https://webflow.com", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Partner application" },
  { platform: "Mailchimp Partner", url: "https://mailchimp.com", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Partner application" },
  { platform: "WooCommerce Agency", url: "https://woocommerce.com", type: "NEEDS_MANUAL", reason: "Partner program - ручная заявка", evidence: "Partner application" },
  { platform: "Nextdoor Business", url: "https://nextdoor.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Express Update USA", url: "https://www.expressupdate.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Neustar Localeze", url: "https://www.neustarlocaleze.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  { platform: "Foursquare Business", url: "https://foursquare.com", type: "NEEDS_MANUAL", reason: "Требуется регистрация/авторизация", evidence: "Login required" },
  
  // FAILED - Cloudflare (7)
  { platform: "Yellow Pages", url: "https://www.yellowpages.com", type: "FAILED", reason: "Cloudflare защита", evidence: "Cloudflare detected" },
  { platform: "Manta", url: "https://www.manta.com", type: "FAILED", reason: "Cloudflare защита", evidence: "Cloudflare detected" },
  { platform: "Superpages", url: "https://www.superpages.com", type: "FAILED", reason: "Cloudflare защита", evidence: "Cloudflare on /add-listing" },
  { platform: "EZlocal", url: "https://www.ezlocal.com", type: "FAILED", reason: "Cloudflare защита", evidence: "Cloudflare detected" },
  { platform: "Stack Overflow", url: "https://stackoverflow.com", type: "FAILED", reason: "Cloudflare защита", evidence: "Cloudflare on /add-listing" },
  { platform: "ThemeForest", url: "https://themeforest.net", type: "FAILED", reason: "Cloudflare защита", evidence: "Cloudflare detected" },
  { platform: "Data Axle", url: "https://www.data-axle.com", type: "FAILED", reason: "Cloudflare защита", evidence: "Cloudflare detected" },
  
  // FAILED - Dead/Unreachable (6)
  { platform: "EzineArticles", url: "https://ezinearticles.com", type: "FAILED", reason: "Сайт не работает", evidence: "Unreachable" },
  { platform: "Semfirms", url: "https://semfirms.com", type: "FAILED", reason: "Сайт не работает", evidence: "Unreachable" },
  { platform: "Digital Agency Network", url: "https://digitalagencynetwork.com", type: "FAILED", reason: "404 страница не найдена", evidence: "Page not found" },
  { platform: "SCORE Mentor Network", url: "https://www.score.org", type: "FAILED", reason: "Таймаут подключения", evidence: "Timeout" },
  { platform: "Plantation Chamber", url: "https://www.plantationchamber.org", type: "FAILED", reason: "Сайт не работает", evidence: "Unreachable" },
  { platform: "Freepik", url: "https://www.freepik.com", type: "FAILED", reason: "403 Forbidden", evidence: "Security block" },
  
  // NOT_APPLICABLE - не каталоги размещения (27)
  { platform: "GoodFirms", url: "https://www.goodfirms.co", type: "NOT_APPLICABLE", reason: "Поисковая/подписочная форма, не каталог", evidence: "Subscribe & Download form" },
  { platform: "Opendi", url: "https://www.opendi.us", type: "NOT_APPLICABLE", reason: "Поисковая форма (What? + Where?)", evidence: "Search form" },
  { platform: "Sortlist", url: "https://www.sortlist.com", type: "NOT_APPLICABLE", reason: "SPA с скрытыми полями, не форма размещения", evidence: "Empty fields SPA" },
  { platform: "Hotfrog", url: "https://www.hotfrog.com", type: "NOT_APPLICABLE", reason: "Поисковая страница", evidence: "Search page" },
  { platform: "Merchant Circle", url: "https://www.merchantcircle.com", type: "NOT_APPLICABLE", reason: "Поисковая страница", evidence: "Search page" },
  { platform: "Local.com", url: "https://www.local.com", type: "NOT_APPLICABLE", reason: "Форма discover/subscribe, не размещение", evidence: "Discover/subscribe form" },
  { platform: "Trustpilot", url: "https://www.trustpilot.com", type: "NOT_APPLICABLE", reason: "Поисковая страница отзывов", evidence: "Search page" },
  { platform: "Sitejabber", url: "https://www.sitejabber.com", type: "NOT_APPLICABLE", reason: "Поисковая страница отзывов", evidence: "Search page" },
  { platform: "ProvenExpert", url: "https://www.provenexpert.com", type: "NOT_APPLICABLE", reason: "Форма подписки", evidence: "Subscribe form" },
  { platform: "G2", url: "https://www.g2.com", type: "NOT_APPLICABLE", reason: "Минимальная страница", evidence: "Empty page" },
  { platform: "HubPages", url: "https://hubpages.com", type: "NOT_APPLICABLE", reason: "Минимальная страница", evidence: "Empty page" },
  { platform: "SlideShare", url: "https://www.slideshare.net", type: "NOT_APPLICABLE", reason: "Поисковая страница презентаций", evidence: "Search page" },
  { platform: "Tumblr", url: "https://www.tumblr.com", type: "NOT_APPLICABLE", reason: "Поисковая страница блогов", evidence: "Search page" },
  { platform: "Business2Community", url: "https://www.business2community.com", type: "NOT_APPLICABLE", reason: "Новостной сайт, не каталог", evidence: "Business news site" },
  { platform: "Crunchbase", url: "https://www.crunchbase.com", type: "NOT_APPLICABLE", reason: "Форма подписки, не каталог", evidence: "Subscribe form" },
  { platform: "ProductHunt", url: "https://www.producthunt.com", type: "NOT_APPLICABLE", reason: "Форма подписки, не каталог", evidence: "Subscribe form" },
  { platform: "Agency Spotter", url: "https://www.agencyspotter.com", type: "NOT_APPLICABLE", reason: "Поисковая страница", evidence: "Search page" },
  { platform: "The Manifest", url: "https://themanifest.com", type: "NOT_APPLICABLE", reason: "Поисковая страница", evidence: "Search page" },
  { platform: "Expertise.com", url: "https://www.expertise.com", type: "NOT_APPLICABLE", reason: "Поисковая страница", evidence: "Search page" },
  { platform: "Influencer Marketing Hub", url: "https://influencermarketinghub.com", type: "NOT_APPLICABLE", reason: "Mailchimp подписка, не каталог", evidence: "Mailchimp subscribe" },
  { platform: "Broward County Chamber", url: "https://browardchamber.com", type: "NOT_APPLICABLE", reason: "Минимальная страница", evidence: "Empty page" },
  { platform: "FL SBDC Network", url: "https://www.floridasbdc.org", type: "NOT_APPLICABLE", reason: "Поисковая страница", evidence: "Search page" },
  { platform: "Spoke", url: "https://spoke.com", type: "NOT_APPLICABLE", reason: "Минимальная страница", evidence: "Empty page" },
  { platform: "n49", url: "https://www.n49.com", type: "NOT_APPLICABLE", reason: "403 Forbidden", evidence: "403 Forbidden" },
  { platform: "CSS-Tricks", url: "https://css-tricks.com", type: "NOT_APPLICABLE", reason: "Подписка/контент сайт", evidence: "Subscribe site" },
  { platform: "WPBeginner", url: "https://www.wpbeginner.com", type: "NOT_APPLICABLE", reason: "Регистрация домена, не каталог", evidence: "Register domain link" },
  { platform: "GitHub", url: "https://github.com", type: "NOT_APPLICABLE", reason: "404 на /add-listing, не каталог", evidence: "404 page" },
  { platform: "Awwwards", url: "https://www.awwwards.com", type: "NOT_APPLICABLE", reason: "Конкурс дизайна, не каталог размещения", evidence: "Design awards site" },
  { platform: "CSS Design Awards", url: "https://www.cssdesignawards.com", type: "NOT_APPLICABLE", reason: "Конкурс дизайна, не каталог размещения", evidence: "Design awards site" },
  { platform: "SiteInspire", url: "https://www.siteinspire.com", type: "NOT_APPLICABLE", reason: "Галерея дизайна, не каталог размещения", evidence: "Design gallery" },
  { platform: "Find Best SEO", url: "https://findbestseo.com", type: "NOT_APPLICABLE", reason: "Поисковая/агрегатор страница", evidence: "Search page" },
  { platform: "FL Business Dir", url: "https://floridabusinessdirectory.com", type: "NOT_APPLICABLE", reason: "Поисковая страница", evidence: "Search page" },
  { platform: "South FL Biz Journal", url: "https://www.bizjournals.com/southflorida", type: "NOT_APPLICABLE", reason: "Новостной сайт, не каталог", evidence: "News site" },
];

// Generate table
const header = "Каталог | URL | Тип | Статус | Причина | Доказательство";
const separator = "---------|------|------|--------|---------|-------------";

const rows = ALL_RESULTS.map(r => {
  const url = (r.url || "").slice(0, 42);
  return `${r.platform.padEnd(25)} | ${url.padEnd(42)} | ${r.type.padEnd(15)} | ${r.reason.padEnd(42)} | ${r.evidence}`;
});

const output = [header, separator, ...rows].join("\n");
fs.writeFileSync("final-directory-report.txt", output);

// Summary
const byType: Record<string, number> = {};
for (const r of ALL_RESULTS) byType[r.type] = (byType[r.type] || 0) + 1;

console.log(output);
console.log("\n" + "=".repeat(80));
console.log("SUMMARY:");
for (const [type, count] of Object.entries(byType)) {
  console.log(`  ${type}: ${count}`);
}
console.log(`\nTOTAL: ${ALL_RESULTS.length} directories`);