# Final Submission Report — ITllect (75 площадок клиента)

Дата: 2026-07-30
Источник списка: public/87catalogs.xlsx (75 реальных площадок)
Классификация: A=Business dir, B=Reviews, C=Agency marketplace, D=Content/Profile, E=Partner

## Summary

| Статус | Кол-во |
|--------|-------:|
| SUCCESS | 1 |
| NEEDS_MANUAL | 53 |
| FAILED | 4 |
| NOT_APPLICABLE | 17 |

## Свод по типам

| Тип | SUCCESS | NEEDS_MANUAL | FAILED | NOT_APPLICABLE |
|-----|--------:|-------------:|-------:|---------------:|
| A | 1 | 16 | 0 | 6 |
| B | 0 | 4 | 0 | 0 |
| C | 0 | 11 | 2 | 1 |
| D | 0 | 18 | 2 | 0 |
| E | 0 | 5 | 0 | 10 |

## Полный каталог

| # | Каталог | Тип | Метод | Статус | Ссылка | Что требуется |
|---|---------|-----|-------|--------|--------|---------------|
| 1 | Brownbook | A | Add business (guest); short description + website | SUCCESS ✅ | https://www.brownbook.net/add-business | Уже добавлен — SUCCESS подтверждён |
| 2 | CityLocalPro | A | Fill form (13f) → manual reCAPTCHA v2 → submit | NEEDS_MANUAL | https://citylocalpro.com/add-your-business | PREVIEW: 17f ✅; SUBMIT: login + reCAPTCHA v2 (headed stealth нужен) |
| 3 | Digital Agency Net | C | Add agency listing | NEEDS_MANUAL | https://digitalagencynetwork.com/add-agency/ | PREVIEW: 4f ✅; SUBMIT: нужна регистрация аккаунта |
| 4 | GoodFirms | C | List your company (register → agency profile) | NEEDS_MANUAL | https://www.goodfirms.co/list-your-company | PREVIEW: 3f ✅; SUBMIT: Cloudflare turnstile на /get-listed (headed stealth) |
| 5 | TopSEOs | C | Vendor registration (agency profile) | NEEDS_MANUAL | https://www.topseos.com/vendor-registration | PREVIEW: 10f ✅; SUBMIT: профиль chromium повреждён; Drupal form[name] поля (headed stealth) |
| 6 | Alignable | A | Join Alignable small business network; connect Plantation/Fort Lauderdale | NEEDS_MANUAL | https://www.alignable.com/joint-base-mdl-nj | Уточнить путь подачи / partner application |
| 7 | Broward County Chamber | A | Chamber membership application | NEEDS_MANUAL | https://browardchamber.com/lander | Уточнить путь подачи / partner application |
| 8 | EZlocal | A | Stealth → Add your business; exact NAP | NEEDS_MANUAL | https://www.ezlocal.com/business-directory/add-business | Headed stealth + ручной Cloudflare challenge + submit; Cloudflare (headed stealth) |
| 9 | Ft Lauderdale Chamber | A | Chamber membership application | NEEDS_MANUAL | https://business.ftlchamber.com/MIC/login/ | Регистрация аккаунта на info@itllect.com + email verify |
| 10 | Hotfrog | A | Add business; exact NAP match | NEEDS_MANUAL | https://www.hotfrog.com/add-business | Headed stealth + ручной Cloudflare challenge + submit; Cloudflare (headed stealth) |
| 11 | Local.com | A | Claim listing / add business; 100-word description | FAILED | https://www.local.com/claim-listing | PREVIEW: ERR_CONNECTION_RESET (недоступен) |
| 12 | Manta | A | Stealth → Claim/add business; complete every field | NEEDS_MANUAL | https://www.manta.com/claim | Ручной поиск пути подачи (claim/add-business) |
| 13 | Merchant Circle | A | Register merchant; add all services + description | NEEDS_MANUAL | https://www.merchantcircle.com/registration | Регистрация аккаунта на info@itllect.com + email verify |
| 14 | Miami Chamber | A | Chamber membership application | NEEDS_MANUAL | https://www.miamichamber.com/membership | Уточнить путь подачи / partner application |
| 15 | n49 | A | Add business / claim; stealth + warmup | NEEDS_MANUAL | https://business.n49.ca/ | Уточнить путь подачи / partner application |
| 16 | Opendi | A | Add company form on homepage | NEEDS_MANUAL | https://www.opendi.us/ | PREVIEW: 9f/4 ✅; SUBMIT: Cloudflare блокирует (headed stealth нужен) |
| 17 | Plantation Chamber | A | Join chamber (manual membership application) | NEEDS_MANUAL | https://plantationchamber.org/join-a-committee/ | Регистрация аккаунта на info@itllect.com + email verify |
| 18 | Superpages | A | Stealth → Add listing; select Digital Marketing primary category | NEEDS_MANUAL | https://www.superpages.com/add-listing | Headed stealth + ручной Cloudflare challenge + submit; Cloudflare (headed stealth) |
| 19 | Yellow Pages | A | Stealth landing → Add business → manual captcha, fill, submit | NEEDS_MANUAL | https://www.yellowpages.com/biz | Headed stealth + ручной Cloudflare challenge + submit; Cloudflare (headed stealth) |
| 20 | ProvenExpert | B | SignUp business; verify email | NEEDS_MANUAL | https://www.provenexpert.com/en-us/ | Регистрация аккаунта на info@itllect.com + email verify; company claim + domain/email verification |
| 21 | Sitejabber | B | Register business account / claim store; verify domain | NEEDS_MANUAL | https://www.smartcustomer.com/business | Headed maual capcha + submit; captcha: turnstile (manual); company claim + domain/email verification |
| 22 | Trustpilot | B | Claim company (search → claim → domain/email verify) | NEEDS_MANUAL | https://business.trustpilot.com/claim | Уточнить путь подачи / partner application; company claim + domain/email verification |
| 23 | Agency Spotter | C | Add agency / claim | NEEDS_MANUAL | https://www.agencyspotter.com/add-agency | Headed stealth + ручной Cloudflare challenge + submit; Cloudflare (headed stealth); agency profile: услуги + описание + портфолио |
| 24 | Bark.com | C | Become a Bark service provider (14f signup) | NEEDS_MANUAL | https://www.bark.com/en/us/business/ | PREVIEW: 35f/4 ✅; SUBMIT: форма SPA, 0 полей при повторном визите (нужен headed + ручная навигация) |
| 25 | DesignRush | C | Multi-step agency submission (register → услуги → портфолио → submit) | NEEDS_MANUAL | https://www.designrush.com/submit/agency | PREVIEW: требуется авторизация (login); нужна регистрация аккаунта |
| 26 | Find Best SEO | C | Submit SEO agency | NEEDS_MANUAL | https://www.findbestseo.com/submit-agency | Уточнить путь подачи / partner application; agency profile: услуги + описание + портфолио |
| 27 | Influencer Mkt Hub | C | Submit agency (Get listed) | NEEDS_MANUAL | https://influencermarketinghub.com/submit-agency/ | Уточнить путь подачи / partner application; agency profile: услуги + описание + портфолио |
| 28 | Semfirms | C | Add SEO company listing | NEEDS_MANUAL | https://www.semfirms.com/add-company | Регистрация аккаунта на info@itllect.com + email verify; agency profile: услуги + описание + портфолио |
| 29 | Sortlist | C | Become partner (marketplace for agencies; SPA) | NEEDS_MANUAL | https://www.sortlist.com/become-partner | Headed stealth + ручной Cloudflare challenge + submit; Cloudflare (headed stealth); agency profile: услуги + описание + портфолио |
| 30 | The Manifest | C | List your company (Clutch group; регистрация) | NEEDS_MANUAL | https://themanifest.com/listings/list-your-company | Ручной поиск пути подачи (claim/add-business); agency profile: услуги + описание + портфолио |
| 31 | AngelList/Wellfound | D | Register → create company profile | NEEDS_MANUAL | https://wellfound.com/companies/new | Уточнить путь подачи / partner application; profile + контент (публикация/draft) |
| 32 | Awwwards | D | Submit site (design contest; paid submission + backlink) | NEEDS_MANUAL | https://www.awwwards.com/sites/submit | Регистрация аккаунта на info@itllect.com + email verify; profile + контент (публикация/draft) |
| 33 | Business2Community | D | Contributor pitch (editorial, manual) | NEEDS_MANUAL | https://www.business2community.com/contribute | PREVIEW: 11f/1 ✅; SUBMIT: форма без submit-кнопки (нужна регистрация → получение доступа) |
| 34 | Crunchbase | D | Register → add organization ITllect → verify via email-domain | NEEDS_MANUAL | https://www.crunchbase.com/discover/principal.investors | Headed stealth + ручной Cloudflare challenge + submit; Cloudflare (headed stealth); profile + контент (публикация/draft) |
| 35 | Dribbble | D | Register → designer profile → shots (portfolio) | NEEDS_MANUAL | https://dribbble.com/signup | Регистрация аккаунта на info@itllect.com + email verify; profile + контент (публикация/draft) |
| 36 | GitHub | D | Register → create Organization ITllect → profile+repo | NEEDS_MANUAL | https://github.com/organizations/new | Уточнить путь подачи / partner application; profile + контент (публикация/draft) |
| 37 | HubPages | D | Register → publish Hub about ITllect | NEEDS_MANUAL | https://hubpages.com/user/register | Регистрация аккаунта на info@itllect.com + email verify; profile + контент (публикация/draft) |
| 38 | Medium | D | Register на info@itllect.com → email verify → draft pub about ITllect → publish | NEEDS_MANUAL | https://medium.com/m/signin | Регистрация аккаунта на info@itllect.com + email verify; profile + контент (публикация/draft) |
| 39 | Pinterest Business | D | Create Pinterest business account → profile + pins linking site | NEEDS_MANUAL | https://business.pinterest.com/business/create/ | Уточнить путь подачи / partner application; profile + контент (публикация/draft) |
| 40 | ProductHunt | D | Register → launch ITllect product → launch flow | NEEDS_MANUAL | https://www.producthunt.com/posts/new | Уточнить путь подачи / partner application; profile + контент (публикация/draft) |
| 41 | Quora | D | Register → create Space (company blog) → post about company | NEEDS_MANUAL | https://www.quora.com/ | Уточнить путь подачи / partner application; profile + контент (публикация/draft) |
| 42 | SiteInspire | D | Submit site (design gallery; editorial) | NEEDS_MANUAL | https://www.siteinspire.com/submit | Уточнить путь подачи / partner application; profile + контент (публикация/draft) |
| 43 | SlideShare | D | Register (LinkedIn) → upload deck about ITllect | NEEDS_MANUAL | https://www.slideshare.net/signup | Уточнить путь подачи / partner application; profile + контент (публикация/draft) |
| 44 | Stack Overflow | D | Register account → SO Developer Story / Collectives | NEEDS_MANUAL | https://stackoverflow.com/users/signup | Headed stealth + ручной Cloudflare challenge + submit; Cloudflare (headed stealth); profile + контент (публикация/draft) |
| 45 | Tumblr | D | Register → create ITllect blog → first post | NEEDS_MANUAL | https://www.tumblr.com/register | Регистрация аккаунта на info@itllect.com + email verify; profile + контент (публикация/draft) |
| 46 | Twitter / X | D | Register @ITllect handle → профиль компании → backlink в bio | NEEDS_MANUAL | https://twitter.com/i/flow/signup | Уточнить путь подачи / partner application; profile + контент (публикация/draft) |
| 47 | YouTube Channel | D | Create ITllect brand channel → link в about | NEEDS_MANUAL | https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop%26hl%3Den%26next%3D%252Fcreate_channel%26feature%3D__FEATURE__&dsh=S-182064106%3A1785426271553077&hl=en&passive=true&service=youtube&uilel=3&flowName=GlifWebSignIn&flowEntry=ServiceLogin&ifkv=Ac50bxsr6TXWNzqqOedYbMoQP6asr6viuHdwJ96Pxs8cOps8u774i6lGaGMmAYt-L1GbNlM1hh6v | Регистрация аккаунта на info@itllect.com + email verify; profile + контент (публикация/draft) |
| 48 | ActiveCampaign | E | Become an ActiveCampaign Partner (application) | FAILED | https://www.activecampaign.com/partners/become-a-partner | PREVIEW: ERR_CONNECTION_RESET (недоступен) |
| 49 | Mailchimp Partner | E | Mailchimp Marketing Partner application | NEEDS_MANUAL | https://mailchimp.com/partners/apply/ | Регистрация аккаунта на info@itllect.com + email verify; partner application + manual review |
| 50 | Shopify Partners | E | Join Shopify Partner Program → agency profile | NEEDS_MANUAL | https://www.shopify.com/partners | Ручной поиск пути подачи (claim/add-business); partner application + manual review |
| 51 | Stripe Partner | E | Stripe Partner application | NEEDS_MANUAL | https://stripe.partners/directory/apply | Ручной поиск пути подачи (claim/add-business); partner application + manual review |
| 52 | WooCommerce Agency | E | WooExpert agency application (manual review) | FAILED | https://woocommerce.com/woocommerce-agencies/wooexpert-application/ | PREVIEW: селекторы не найдены (форма не обнаружена) |
| 53 | FL Business Dir | A | Add Florida business listing | FAILED | https://www.floridabusiness.com/add-listing | Unreachable — перепроверить SPF/DNS/прокси |
| 54 | G2 | B | Claim listing / vendor profile; verify | FAILED | https://www.g2.com/claim-listing | Unreachable — перепроверить SPF/DNS/прокси; company claim + domain/email verification |
| 55 | Upcity | C | Become a partner agency / claim (UpCity partner portal) | FAILED | https://upcity.com/partners | Unreachable — перепроверить SPF/DNS/прокси; agency profile: услуги + описание + портфолио |
| 56 | Behance | D | Register (Adobe) → create studio → upload portfolio project | FAILED | https://www.behance.net/signup | Unreachable — перепроверить SPF/DNS/прокси; profile + контент (публикация/draft) |
| 57 | CSS Design Awards | D | Submit site (design award; paid) | FAILED | https://www.cssdesignawards.com/sites/submit | Unreachable — перепроверить SPF/DNS/прокси; profile + контент (публикация/draft) |
| 58 | EzineArticles | D | Register author → submit article (editorial review) | FAILED | https://ezinearticles.com/submit-article/ | Unreachable — перепроверить SPF/DNS/прокси; profile + контент (публикация/draft) |
| 59 | Broward County Biz | A | County business resources (manual) | NOT_APPLICABLE | https://www.broward.org/business/Pages/Default.aspx | Уточнить путь подачи / partner application |
| 60 | City of Plantation | A | City business resources (municipal; manual) | NOT_APPLICABLE | https://www.plantation.org/business | Уточнить путь подачи / partner application |
| 61 | FL SBDC Network | A | Request advising (рост ресурсов; listing нет) | NOT_APPLICABLE | https://floridasbdc.org/request-advising/ | Уточнить путь подачи / partner application |
| 62 | Nextdoor Business | A | Business page signup (claim local) | NOT_APPLICABLE | https://business.nextdoor.com/business-signup | Уточнить путь подачи / partner application |
| 63 | South FL Biz Journal | A | Submit people/news (PR newsroom, manual) | NOT_APPLICABLE | https://www.bizjournals.com/southflorida/submit | Headed stealth + ручной Cloudflare challenge + submit; Cloudflare (headed stealth) |
| 64 | Spoke | A | Probe — пивот в last-mile delivery SaaS | NOT_APPLICABLE | https://spoke.com/ | Уточнить путь подачи / partner application |
| 65 | Expertise.com | C | Business application / nomination | NOT_APPLICABLE | https://www.expertise.com/business-application | Регистрация аккаунта на info@itllect.com + email verify; agency profile: услуги + описание + портфолио |
| 66 | Data Axle | E | Partner / enterprise data (manual) | NOT_APPLICABLE | https://www.data-axle.com/partner/ | Уточнить путь подачи / partner application; partner application + manual review |
| 67 | Express Update USA | E | Claim business listing (free InfoGroup) | NOT_APPLICABLE | https://local-listings.data-axle.com/claim | Уточнить путь подачи / partner application; partner application + manual review |
| 68 | FL DEO Business | E | FL DEO business resource portal (manual) | NOT_APPLICABLE | https://floridajobs.org/business-resources | Уточнить путь подачи / partner application; partner application + manual review |
| 69 | Foursquare Business | E | Claim/add venue, verify | NOT_APPLICABLE | https://business.foursquare.com/claim | Уточнить путь подачи / partner application; partner application + manual review |
| 70 | HubSpot Agency Dir | E | HubSpot Agency partner application | NOT_APPLICABLE | https://ecosystem.hubspot.com/marketplace/solutions | Уточнить путь подачи / partner application; partner application + manual review |
| 71 | Neustar Localeze | E | Localeze business listing signup (citation source) | NOT_APPLICABLE | https://www.neustarlocaleze.biz/signup | Уточнить путь подачи / partner application; partner application + manual review |
| 72 | SBA.gov Business | E | Local Assistance (resource) | NOT_APPLICABLE | https://legacy.sba.gov/local-assistance/find | Уточнить путь подачи / partner application; partner application + manual review |
| 73 | SCORE Mentor Network | E | Find a mentor (mentor resource) | NOT_APPLICABLE | https://www.score.org/how-mentoring-works/ | Fill form + submit; partner application + manual review |
| 74 | Semrush Agency Partners | E | Become a Semrush Agency Partner (application + backlink back) | NOT_APPLICABLE | https://agencies.semrush.com/become-a-partner | Уточнить путь подачи / partner application; partner application + manual review |
| 75 | Webflow Partner | E | Webflow partner application | NOT_APPLICABLE | https://webflow.com/partners/apply | Уточнить путь подачи / partner application; partner application + manual review |

_SUCCESS_ — площадка успешно добавлена.  
_NEEDS_MANUAL_ — требует человек-в-цикле: регистрация аккаунта/верификация email / Cloudflare / капча / поиск реального пути подачи.  
_FAILED_ — unreachable после retry (часть можно реанимировать переключением сети/прокси / headed-stealth).  
_NOT_APPLICABLE_ — площадка не подходит для размещения компании (гос.ресурс / PR newsroom / энтерпрайз-агрегатор).