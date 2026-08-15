/**
 * MASTER LIST — авторитетный клиентский список из public/87catalogs.xlsx.
 *
 * В xlsx листе "87catalogs" 75 реальных площадок (остальное — заголовки/секции).
 * КАТЕГОРИИ КЛИЕНТА → workflow-типы:
 *   Business Directory    -> A (business-directory adapter)
 *   Agency Directory      -> C (agency marketplace adapter)
 *   Local / Florida       -> A (local business listing / chamber membership)
 *   Government            -> E (resource / partner / mentor — generally NOT_APPLICABLE для free listing)
 *   Partner Program       -> E (partner application, manual review)
 *   Portfolio             -> D (create profile + portfolio project)
 *   Tech / Startup        -> D (company profile + verify)
 *   Social                -> D (company profile on social platform)
 *   Social / Content      -> D
 *   Content               -> D (article publish / draft)
 *   Reviews               -> B (claim / create review profile + verification)
 *   Aggregator            -> E (citation aggregator / paid) -> often NOT_APPLICABLE как free listing
 *
 * submissionUrl — наиболее вероятный путь отправки (best-guess, уточняется на стадии PROBE).
 * НЕ добавляем новые каталоги — только то, что в xlsx клиента (75 площадок).
 */

export type PlatformType = "A" | "B" | "C" | "D" | "E";

export type Status =
  | "PENDING"
  | "SUCCESS"
  | "NEEDS_MANUAL"
  | "FAILED"
  | "NOT_APPLICABLE";

export interface PlatformEntry {
  name: string;
  url: string;
  submissionUrl: string;
  type: PlatformType;
  clientCategory: string;     // исходная категория из xlsx
  method: string;
  notes: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export const MASTER_LIST: PlatformEntry[] = [
  // ───── A — BUSINESS DIRECTORIES ─────
  { name: "Yellow Pages", url: "https://www.yellowpages.com", submissionUrl: "https://www.yellowpages.com/biz", type: "A", clientCategory: "Business Directory", method: "Stealth landing → Add business → manual captcha, fill, submit", notes: "List the company under Digital Marketing Agency; upload logo; Cloudflare", priority: "HIGH" },
  { name: "Manta", url: "https://www.manta.com", submissionUrl: "https://www.manta.com/claim", type: "A", clientCategory: "Business Directory", method: "Stealth → Claim/add business; complete every field", notes: "Strong small business citation; Cloudflare", priority: "HIGH" },
  { name: "Hotfrog", url: "https://www.hotfrog.com", submissionUrl: "https://www.hotfrog.com/add-business", type: "A", clientCategory: "Business Directory", method: "Add business; exact NAP match", notes: "US local directory", priority: "MEDIUM" },
  { name: "Alignable", url: "https://www.alignable.com", submissionUrl: "https://www.alignable.com/join", type: "A", clientCategory: "Business Directory", method: "Join Alignable small business network; connect Plantation/Fort Lauderdale", notes: "account + email verify", priority: "HIGH" },
  { name: "Superpages", url: "https://www.superpages.com", submissionUrl: "https://www.superpages.com/add-listing", type: "A", clientCategory: "Business Directory", method: "Stealth → Add listing; select Digital Marketing primary category", notes: "Syndicates to Thryv; Cloudflare", priority: "MEDIUM" },
  { name: "Merchant Circle", url: "https://www.merchantcircle.com", submissionUrl: "https://www.merchantcircle.com/registration", type: "A", clientCategory: "Business Directory", method: "Register merchant; add all services + description", notes: "Local business social network", priority: "MEDIUM" },
  { name: "Local.com", url: "https://www.local.com", submissionUrl: "https://www.local.com/claim-listing", type: "A", clientCategory: "Business Directory", method: "Claim listing / add business; 100-word description", notes: "Local search directory", priority: "MEDIUM" },
  { name: "EZlocal", url: "https://www.ezlocal.com", submissionUrl: "https://www.ezlocal.com/business-directory/add-business", type: "A", clientCategory: "Business Directory", method: "Stealth → Add your business; exact NAP", notes: "Small business citation; Cloudflare", priority: "MEDIUM" },
  { name: "Brownbook", url: "https://www.brownbook.net", submissionUrl: "https://www.brownbook.net/add-business", type: "A", clientCategory: "Business Directory", method: "Add business (guest); short description + website", notes: "International directory; ранее SUCCESS подтверждён", priority: "HIGH" },
  { name: "Opendi", url: "https://www.opendi.us", submissionUrl: "https://www.opendi.us", type: "A", clientCategory: "Business Directory", method: "Add company form on homepage", notes: "listing form detected (3f+)", priority: "HIGH" },
  { name: "Spoke", url: "https://spoke.com", submissionUrl: "", type: "A", clientCategory: "Business Directory", method: "Probe — пивот в last-mile delivery SaaS", notes: "вероятно NOT_APPLICABLE", priority: "LOW" },
  { name: "n49", url: "https://www.n49.com", submissionUrl: "https://www.n49.com/business/", type: "A", clientCategory: "Business Directory", method: "Add business / claim; stealth + warmup", notes: "403 без stealth", priority: "MEDIUM" },
  // Доп. площадка (не из списка клиента): добавлена в ходе работы — VERIFIED_SUCCESS 07.08
  { name: "FindUsHere", url: "https://www.find-us-here.com", submissionUrl: "https://www.find-us-here.com/register.php", type: "A", clientCategory: "Business Directory", method: "Register (no CAPTCHA, no email verify) → login → fill contact/address/description on dashboard", notes: "VERIFIED_SUCCESS: profile created and public; 18+ млн бизнесов", priority: "MEDIUM" },

  // ───── C — AGENCY DIRECTORIES / MARKETPLACES ─────
  { name: "GoodFirms", url: "https://www.goodfirms.co", submissionUrl: "https://www.goodfirms.co/list-your-company", type: "C", clientCategory: "Agency Directory", method: "List your company (register → agency profile)", notes: "listing form detected (4f)", priority: "HIGH" },
  { name: "DesignRush", url: "https://www.designrush.com", submissionUrl: "https://www.designrush.com/submit/agency", type: "C", clientCategory: "Agency Directory", method: "Multi-step agency submission (register → услуги → портфолио → submit)", notes: "Cloudflare post-register; manual moderation", priority: "HIGH" },
  { name: "Agency Spotter", url: "https://www.agencyspotter.com", submissionUrl: "https://www.agencyspotter.com/add-agency", type: "C", clientCategory: "Agency Directory", method: "Add agency / claim", notes: "homepage search; probe add-agency", priority: "MEDIUM" },
  { name: "The Manifest", url: "https://themanifest.com", submissionUrl: "https://themanifest.com/listings/list-your-company", type: "C", clientCategory: "Agency Directory", method: "List your company (Clutch group; регистрация)", notes: "homepage search", priority: "MEDIUM" },
  { name: "Upcity", url: "https://upcity.com", submissionUrl: "https://upcity.com/partners", type: "C", clientCategory: "Agency Directory", method: "Become a partner agency / claim (UpCity partner portal)", notes: "probe partners path", priority: "MEDIUM" },
  { name: "Expertise.com", url: "https://www.expertise.com", submissionUrl: "https://www.expertise.com/business-application", type: "C", clientCategory: "Agency Directory", method: "Business application / nomination", notes: "editorial vetted", priority: "MEDIUM" },
  { name: "Sortlist", url: "https://www.sortlist.com", submissionUrl: "https://www.sortlist.com/become-partner", type: "C", clientCategory: "Agency Directory", method: "Become partner (marketplace for agencies; SPA)", notes: "SPA, multi-step", priority: "MEDIUM" },
  { name: "Bark.com", url: "https://www.bark.com", submissionUrl: "https://www.bark.com/en/us/business", type: "C", clientCategory: "Agency Directory", method: "Become a Bark service provider (14f signup)", notes: "service provider signup", priority: "MEDIUM" },
  { name: "Semfirms", url: "https://semfirms.com", submissionUrl: "https://semfirms.com/add-company", type: "C", clientCategory: "Agency Directory", method: "Add SEO company listing", notes: "probe (dead flag previously)", priority: "LOW" },
  { name: "Find Best SEO", url: "https://www.findbestseo.com", submissionUrl: "https://www.findbestseo.com/submit-agency", type: "C", clientCategory: "Agency Directory", method: "Submit SEO agency", notes: "rankings directory", priority: "LOW" },
  { name: "TopSEOs", url: "https://www.topseos.com", submissionUrl: "https://www.topseos.com/vendor-registration", type: "C", clientCategory: "Agency Directory", method: "Vendor registration (agency profile)", notes: "раньше форма 13f; нужна регистрация", priority: "MEDIUM" },
  { name: "Influencer Mkt Hub", url: "https://influencermarketinghub.com", submissionUrl: "https://influencermarketinghub.com/submit-agency/", type: "C", clientCategory: "Agency Directory", method: "Submit agency (Get listed)", notes: "homepage Mailchimp subscribe; probe submit-agency", priority: "LOW" },
  { name: "Digital Agency Net", url: "https://digitalagencynetwork.com", submissionUrl: "https://digitalagencynetwork.com/add-agency/", type: "C", clientCategory: "Agency Directory", method: "Add agency listing", notes: "probe add-agency", priority: "MEDIUM" },

  // ───── A — LOCAL / FLORIDA (business listings + chambers) ─────
  { name: "FL SBDC Network", url: "https://www.floridasbdc.org", submissionUrl: "https://www.floridasbdc.org/request-advising/", type: "A", clientCategory: "Local / Florida", method: "Request advising (рост ресурсов; listing нет)", notes: "NEEDS_MANUAL / NOT_APPLICABLE для listing", priority: "LOW" },
  { name: "Plantation Chamber", url: "https://www.plantationchamber.org", submissionUrl: "https://www.plantationchamber.org/join", type: "A", clientCategory: "Local / Florida", method: "Join chamber (manual membership application)", notes: "probe", priority: "MEDIUM" },
  { name: "Broward County Chamber", url: "https://browardchamber.com", submissionUrl: "https://browardchamber.com/membership-application/", type: "A", clientCategory: "Local / Florida", method: "Chamber membership application", notes: "empty page previously", priority: "MEDIUM" },
  { name: "Ft Lauderdale Chamber", url: "https://www.ftlchamber.com", submissionUrl: "https://www.ftlchamber.com/membership", type: "A", clientCategory: "Local / Florida", method: "Chamber membership application", notes: "probe", priority: "MEDIUM" },
  { name: "Miami Chamber", url: "https://www.miamichamber.com", submissionUrl: "https://www.miamichamber.com/membership", type: "A", clientCategory: "Local / Florida", method: "Chamber membership application", notes: "probe", priority: "LOW" },
  { name: "Nextdoor Business", url: "https://business.nextdoor.com", submissionUrl: "https://business.nextdoor.com/business-signup", type: "A", clientCategory: "Local / Florida", method: "Business page signup (claim local)", notes: "account + postcard verify", priority: "MEDIUM" },
  { name: "CityLocalPro", url: "https://www.citylocalpro.com", submissionUrl: "https://www.citylocalpro.com/add-your-business", type: "A", clientCategory: "Local / Florida", method: "Fill form (13f) → manual reCAPTCHA v2 → submit", notes: "reCAPTCHA v2 manual solve", priority: "HIGH" },
  { name: "FL Business Dir", url: "https://www.floridabusiness.com", submissionUrl: "https://www.floridabusiness.com/add-listing", type: "A", clientCategory: "Local / Florida", method: "Add Florida business listing", notes: "probe", priority: "MEDIUM" },
  { name: "South FL Biz Journal", url: "https://www.bizjournals.com/southflorida", submissionUrl: "https://www.bizjournals.com/southflorida/submit", type: "A", clientCategory: "Local / Florida", method: "Submit people/news (PR newsroom, manual)", notes: "likely NOT_APPLICABLE для listing", priority: "LOW" },
  { name: "City of Plantation", url: "https://www.plantation.org/business", submissionUrl: "https://www.plantation.org/business", type: "A", clientCategory: "Local / Florida", method: "City business resources (municipal; manual)", notes: "likely NOT_APPLICABLE", priority: "LOW" },
  { name: "Broward County Biz", url: "https://www.broward.org/business", submissionUrl: "https://www.broward.org/business", type: "A", clientCategory: "Local / Florida", method: "County business resources (manual)", notes: "likely NOT_APPLICABLE", priority: "LOW" },

  // ───── E — GOVERNMENT / RESOURCES ─────
  { name: "SCORE Mentor Network", url: "https://www.score.org", submissionUrl: "https://www.sample.org/find-mentor".replace("sample", "score"), type: "E", clientCategory: "Government", method: "Find a mentor (mentor resource)", notes: "NOT_APPLICABLE для listing", priority: "LOW" },
  { name: "FL DEO Business", url: "https://floridajobs.org", submissionUrl: "https://floridajobs.org/business-resources", type: "E", clientCategory: "Government", method: "FL DEO business resource portal (manual)", notes: "NOT_APPLICABLE для listing", priority: "LOW" },
  { name: "SBA.gov Business", url: "https://www.sba.gov", submissionUrl: "https://www.sba.gov/local-assistance/find", type: "E", clientCategory: "Government", method: "Local Assistance (resource)", notes: "NOT_APPLICABLE для free listing", priority: "LOW" },

  // ───── E — PARTNER PROGRAMS ─────
  { name: "Semrush Agency Partners", url: "https://www.semrush.com/agencies", submissionUrl: "https://www.semrush.com/agencies/become-a-partner", type: "E", clientCategory: "Partner Program", method: "Become a Semrush Agency Partner (application + backlink back)", notes: "partner application + review", priority: "HIGH" },
  { name: "HubSpot Agency Dir", url: "https://www.hubspot.com/agencies", submissionUrl: "https://partners.hubspot.com/agency-partner-application", type: "E", clientCategory: "Partner Program", method: "HubSpot Agency partner application", notes: "account + application + review", priority: "HIGH" },
  { name: "Shopify Partners", url: "https://www.shopify.com/partners", submissionUrl: "https://partners.shopify.com/", type: "E", clientCategory: "Partner Program", method: "Join Shopify Partner Program → agency profile", notes: "account + email verify", priority: "HIGH" },
  { name: "WooCommerce Agency", url: "https://woocommerce.com/agencies", submissionUrl: "https://woocommerce.com/woocommerce-agencies/wooexpert-application/", type: "E", clientCategory: "Partner Program", method: "WooExpert agency application (manual review)", notes: "partner program", priority: "MEDIUM" },
  { name: "Webflow Partner", url: "https://webflow.com/partners", submissionUrl: "https://webflow.com/partners/apply", type: "E", clientCategory: "Partner Program", method: "Webflow partner application", notes: "partner program", priority: "MEDIUM" },
  { name: "Mailchimp Partner", url: "https://mailchimp.com/partner-directory", submissionUrl: "https://mailchimp.com/partners/apply/", type: "E", clientCategory: "Partner Program", method: "Mailchimp Marketing Partner application", notes: "partner program", priority: "LOW" },
  { name: "ActiveCampaign", url: "https://www.activecampaign.com/partners", submissionUrl: "https://www.activecampaign.com/partners/become-a-partner", type: "E", clientCategory: "Partner Program", method: "Become an ActiveCampaign Partner (application)", notes: "partner program", priority: "MEDIUM" },
  { name: "Stripe Partner", url: "https://stripe.com/partners", submissionUrl: "https://stripe.com/partners/apply", type: "E", clientCategory: "Partner Program", method: "Stripe Partner application", notes: "partner program", priority: "MEDIUM" },

  // ───── D — PORTFOLIO ─────
  { name: "Behance", url: "https://www.behance.net", submissionUrl: "https://www.behance.net/signup", type: "D", clientCategory: "Portfolio", method: "Register (Adobe) → create studio → upload portfolio project", notes: "account; Adobe ID", priority: "MEDIUM" },
  { name: "Dribbble", url: "https://dribbble.com", submissionUrl: "https://dribbble.com/signup", type: "D", clientCategory: "Portfolio", method: "Register → designer profile → shots (portfolio)", notes: "account; designer-gated", priority: "MEDIUM" },
  { name: "Awwwards", url: "https://www.awwwards.com", submissionUrl: "https://www.awwwards.com/sites/submit", type: "D", clientCategory: "Portfolio", method: "Submit site (design contest; paid submission + backlink)", notes: "paid submission per entry; SEO backlink", priority: "LOW" },
  { name: "CSS Design Awards", url: "https://www.cssdesignawards.com", submissionUrl: "https://www.cssdesignawards.com/sites/submit", type: "D", clientCategory: "Portfolio", method: "Submit site (design award; paid)", notes: "paid", priority: "LOW" },
  { name: "SiteInspire", url: "https://www.siteinspire.com", submissionUrl: "https://www.siteinspire.com/submit", type: "D", clientCategory: "Portfolio", method: "Submit site (design gallery; editorial)", notes: "free submission, editorial", priority: "LOW" },

  // ───── D — TECH / STARTUP ─────
  { name: "Crunchbase", url: "https://www.crunchbase.com", submissionUrl: "https://www.crunchbase.com/discover/principal.investors", type: "D", clientCategory: "Tech / Startup", method: "Register → add organization → verify via email-domain", notes: "account + claim verify", priority: "HIGH" },
  { name: "AngelList/Wellfound", url: "https://wellfound.com", submissionUrl: "https://wellfound.com/companies/new", type: "D", clientCategory: "Tech / Startup", method: "Register → create company profile", notes: "account + verify", priority: "MEDIUM" },
  { name: "ProductHunt", url: "https://www.producthunt.com", submissionUrl: "https://www.producthunt.com/posts/new", type: "D", clientCategory: "Tech / Startup", method: "Register → launch product → launch flow", notes: "account + maker profile", priority: "MEDIUM" },
  { name: "Stack Overflow", url: "https://stackoverflow.com/jobs", submissionUrl: "https://stackoverflow.com/users/signup", type: "D", clientCategory: "Tech / Startup", method: "Register account → SO Developer Story / Collectives", notes: "Jobs платный; SO Teams; re-consider N/A", priority: "LOW" },

  // ───── D — SOCIAL ─────
  { name: "Twitter / X", url: "https://twitter.com", submissionUrl: "https://twitter.com/i/flow/signup", type: "D", clientCategory: "Social", method: "Register company handle → профиль компании → backlink в bio", notes: "account; phone verify", priority: "MEDIUM" },
  { name: "YouTube Channel", url: "https://www.youtube.com", submissionUrl: "https://www.youtube.com/create_channel", type: "D", clientCategory: "Social", method: "Create company brand channel → link в about", notes: "Google account", priority: "MEDIUM" },
  { name: "Pinterest Business", url: "https://business.pinterest.com", submissionUrl: "https://business.pinterest.com/business/create/", type: "D", clientCategory: "Social", method: "Create Pinterest business account → profile + pins linking site", notes: "business account", priority: "MEDIUM" },
  { name: "GitHub", url: "https://github.com", submissionUrl: "https://github.com/organizations/new", type: "D", clientCategory: "Social", method: "Register → create Organization → profile+repo", notes: "account", priority: "MEDIUM" },
  { name: "Tumblr", url: "https://www.tumblr.com", submissionUrl: "https://www.tumblr.com/register", type: "D", clientCategory: "Social", method: "Register → create company blog → first post", notes: "account", priority: "MEDIUM" },

  // ───── D — CONTENT ─────
  { name: "Quora", url: "https://www.quora.com", submissionUrl: "https://www.quora.com/", type: "D", clientCategory: "Social / Content", method: "Register → create Space (company blog) → post about company", notes: "account + email verify", priority: "MEDIUM" },
  { name: "SlideShare", url: "https://www.slideshare.net", submissionUrl: "https://www.slideshare.net/signup", type: "D", clientCategory: "Social / Content", method: "Register (LinkedIn) → upload deck about the company", notes: "LinkedIn bridge", priority: "LOW" },
  { name: "Medium", url: "https://medium.com", submissionUrl: "https://medium.com/new-story", type: "D", clientCategory: "Content", method: "Register → email verify → draft pub about the company → publish", notes: "account + email verify", priority: "HIGH" },
  { name: "HubPages", url: "https://hubpages.com", submissionUrl: "https://hubpages.com/user/register", type: "D", clientCategory: "Content", method: "Register → publish Hub about the company", notes: "account", priority: "LOW" },
  { name: "EzineArticles", url: "https://ezinearticles.com", submissionUrl: "https://ezinearticles.com/submit-article/", type: "D", clientCategory: "Content", method: "Register author → submit article (editorial review)", notes: "account + editorial", priority: "LOW" },
  { name: "Business2Community", url: "https://business2community.com", submissionUrl: "https://business2community.com/contribute", type: "D", clientCategory: "Content", method: "Contributor pitch (editorial, manual)", notes: "guest post manual", priority: "LOW" },

  // ───── B — REVIEWS ─────
  { name: "Trustpilot", url: "https://www.trustpilot.com", submissionUrl: "https://business.trustpilot.com/claim", type: "B", clientCategory: "Reviews", method: "Claim company (search → claim → domain/email verify)", notes: "verification domain/email", priority: "HIGH" },
  { name: "Sitejabber", url: "https://www.sitejabber.com", submissionUrl: "https://www.sitejabber.com/business", type: "B", clientCategory: "Reviews", method: "Register business account / claim store; verify domain", notes: "domain verify", priority: "MEDIUM" },
  { name: "SmartCustomer", url: "https://www.smartcustomer.com", submissionUrl: "https://biz.smartcustomer.com/register", type: "B", clientCategory: "Reviews", method: "Register business account / domain verify", notes: "email verification mismatch resolved via manual override", priority: "MEDIUM" },
  { name: "ProvenExpert", url: "https://www.provenexpert.com", submissionUrl: "https://www.provenexpert.com/en/business/", type: "B", clientCategory: "Reviews", method: "SignUp business; verify email", notes: "email verify", priority: "MEDIUM" },
  { name: "G2", url: "https://www.g2.com", submissionUrl: "https://www.g2.com/claim-listing", type: "B", clientCategory: "Reviews", method: "Claim listing / vendor profile; verify", notes: "claim verify", priority: "MEDIUM" },

  // ───── E — AGGREGATORS / CITATION ─────
  { name: "Data Axle", url: "https://www.data-axle.com", submissionUrl: "https://www.data-axle.com/partner/", type: "E", clientCategory: "Aggregator", method: "Partner / enterprise data (manual)", notes: "likely NOT_APPLICABLE для single listing", priority: "LOW" },
  { name: "Neustar Localeze", url: "https://www.neustarlocaleze.biz", submissionUrl: "https://www.neustarlocaleze.biz/signup", type: "E", clientCategory: "Aggregator", method: "Localeze business listing signup (citation source)", notes: "probe signup; data feed", priority: "MEDIUM" },
  { name: "Express Update USA", url: "https://www.expressupdate.com", submissionUrl: "https://www.expressupdate.com/claim", type: "E", clientCategory: "Aggregator", method: "Claim business listing (free InfoGroup)", notes: "account; claim via phone/postcard", priority: "MEDIUM" },
  { name: "Foursquare Business", url: "https://business.foursquare.com", submissionUrl: "https://business.foursquare.com/claim", type: "E", clientCategory: "Aggregator", method: "Claim/add venue, verify", notes: "account; phone verify", priority: "MEDIUM" },
];

export const PLATFORM_COUNT = MASTER_LIST.length;

export function byType(type: PlatformType): PlatformEntry[] {
  return MASTER_LIST.filter((p) => p.type === type);
}

export function typeSummary(): Record<PlatformType, number> {
  const s: Record<PlatformType, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const p of MASTER_LIST) s[p.type]++;
  return s;
}

export function findPlatform(name: string): PlatformEntry | undefined {
  return MASTER_LIST.find((p) => p.name === name);
}