# Приоритизация каталогов — TOP 10 для быстрого результата

Критерии: P1 — открытая форма, без регистрации/CF/капчи; P2 — регистрация/email-подтверждение (IMAP-поток работает); P3 — Cloudflare/капча/платно/партнёрки.

| Priority | Directory | URL | Reason | Estimated difficulty | Expected result |
|---|---|---|---|---|---|
| P1 | Semfirms | https://www.semfirms.com/add-listing | VERIFIED_SUCCESS 07.08: profile https://www.semfirms.com/profile/itllect-llc (Drupal; поле title требует полное юр. название 'Itllect LLC') | Средняя | VERIFIED_SUCCESS |
| P1 | FindUsHere | https://www.find-us-here.com/register.php | VERIFIED_SUCCESS 07.08: profile https://www.find-us-here.com/businesses/Itllect-LLC-Plantation-Florida-USA/34578398/ (без CAPTCHA и email-verify) | Низкая | VERIFIED_SUCCESS |
| P2 | Brownbook | https://www.brownbook.net/add-business | SUBMITTED 07.08: заявка отправлена, профиль НЕ опубликован (поиск: Results Found 0) — проверить email info@itllect-agency.com (activation) / дождаться модерации | Низкая | VERIFIED_SUCCESS possible |
| P2 | CityLocalPro | https://www.citylocalpro.com/add-your-business | SUBMITTED 07.08: заявка отправлена (reCAPTCHA v2 решена вручную), профиль НЕ опубликован (поиск: No result) — ожидать модерации | Средняя | VERIFIED_SUCCESS possible |
| P2 | TopSEOs | https://www.topseos.com/registration | Форма /registration жива (Drupal, 18f); заполнение проходит автоматически, остался шаг submit (OAuth только для входа) | Средняя | SUBMITTED possible |
| P2 | Ft Lauderdale Chamber | https://www.ftlchamber.com/membership | Заявка на членство (форма за логином) | Средняя | SUBMITTED possible |
| P2 | The Manifest | https://themanifest.com/listings/list-your-company | Регистрация → listing (Clutch); форма не детектится автоматически | Средняя | REGISTERED possible |
| P2 | ActiveCampaign | https://www.activecampaign.com/partners/become-a-partner | Сайт ожил; partner-форма 21f заполнена частично — дозаполнить и отправить вручную | Средняя | SUBMITTED possible |
| P3 | Yellow Pages / Hotfrog / Manta | https://www.yellowpages.com | BLOCKED: Cloudflare/anti-bot 403 — только ручной заход через обычный браузер | Высокая | MANUAL REQUIRED |

## P3 — низкий приоритет (не фокусироваться сейчас)

- Yellow Pages / Hotfrog / Manta — BLOCKED (Cloudflare 403 "Performing security verification" / "Sorry, you have been blocked"): только ручной заход через обычный браузер
- Opendi / G2 — EXTERNAL BLOCK (Cloudflare/IP-reputation): сайты показывают "Sorry, you have been blocked"; без другого IP/VPN не открывать
- Superpages / EZlocal / Agency Spotter / Sortlist / South FL Biz Journal / Stack Overflow — Cloudflare challenge: только headed-сессия с ручным решением, медленно и нестабильно
- ProvenExpert — ERR_CONNECTION_CLOSED (блокировка соединения); Merchant Circle / HubPages — все URL регистрации 404/403: ручная проверка
- Sitejabber — CAPTCHA + ошибка запуска браузера; аккаунт создавался ранее, нужна ручная проверка
- Local.com — claim-listing отдаёт 404, форма нерабочая (площадка фактически мёртвая)
- n49 — 403 без stealth
- Awwwards / CSS Design Awards — платная подача
- Twitter/X, Nextdoor, Foursquare — верификация по телефону/открытке
- Stripe / Mailchimp / Webflow / HubSpot / Semrush / WooCommerce — партнёрские заявки с ручным ревью
- Business2Community — форма оказалась email-сборщиком (Aweber), не для подачи статей
- Уже отработаны (SUBMITTED/REGISTERED): GoodFirms, Plantation Chamber, DesignRush, Digital Agency Net, Crunchbase, Medium, Shopify, YouTube

## План P1

1. **Brownbook / CityLocalPro** — SUBMITTED 07.08: заявки отправлены, профили не опубликованы. Проверить email info@itllect-agency.com (Brownbook activation), дождаться модерации; при появлении профиля — зафиксировать URL и статус VERIFIED_SUCCESS.
2. **TopSEOs** — /registration: заполнение уже проходит автоматически; довести submit до конца (ручной клик при зависании). Ожидание: SUBMITTED.
3. **Opendi** — недоступен: EXTERNAL BLOCK (Cloudflare/IP fingerprint, turnstile). Нужен другой IP/VPN или ручной заход, иначе не открывать.
4. Затем P2 через email-assisted регистрацию (рабочий паттерн: Semfirms, FindUsHere): Ft Lauderdale Chamber → The Manifest → ActiveCampaign.
5. Правило: если площадка не даёт прогресса за 15 минут — остановиться и перейти к следующей P1.
