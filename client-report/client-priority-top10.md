# Приоритизация каталогов — TOP 10 для быстрого результата

Критерии: P1 — открытая форма, без регистрации/CF/капчи; P2 — регистрация/email-подтверждение (IMAP-поток работает); P3 — Cloudflare/капча/платно/партнёрки.

| Priority | Directory | URL | Reason | Estimated difficulty | Expected result |
|---|---|---|---|---|---|
| P1 | Semfirms | https://www.semfirms.com/add-listing | VERIFIED_SUCCESS 07.08: profile https://www.semfirms.com/profile/itllect-llc (Drupal; поле title требует полное юр. название 'Itllect LLC') | Средняя | VERIFIED_SUCCESS |
| P1 | FindUsHere | https://www.find-us-here.com/register.php | VERIFIED_SUCCESS 07.08: profile https://www.find-us-here.com/businesses/Itllect-LLC-Plantation-Florida-USA/34578398/ (без CAPTCHA и email-verify) | Низкая | VERIFIED_SUCCESS |
| P2 | Brownbook | https://www.brownbook.net/add-business | SUBMITTED 07.08: заявка отправлена, профиль НЕ опубликован (поиск: Results Found 0) — проверить email info@itllect-agency.com (activation) / дождаться модерации | Низкая | VERIFIED_SUCCESS possible |
| P2 | CityLocalPro | https://www.citylocalpro.com/add-your-business | SUBMITTED 07.08: заявка отправлена (reCAPTCHA v2 решена вручную), профиль НЕ опубликован (поиск: No result) — ожидать модерации | Средняя | VERIFIED_SUCCESS possible |
| P2 | TopSEOs | https://www.topseos.com/registration | Форма /registration жива (Drupal, 18f); заполнение проходит автоматически, остался шаг submit (OAuth только для входа) | Средняя | SUBMITTED possible |
| P3 | Yellow Pages / Hotfrog / Manta | https://www.yellowpages.com | BLOCKED: Cloudflare/anti-bot 403 — только ручной заход через обычный браузер | Высокая | MANUAL REQUIRED |

## P3 — низкий приоритет (не фокусироваться сейчас)

- Yellow Pages / Manta / Hotfrog — BLOCKED (Cloudflare 403 "Performing security verification" / "Sorry, you have been blocked"): только ручной заход через обычный браузер
- Opendi / G2 — BLOCKED (Cloudflare/IP-reputation): сайты показывают "Sorry, you have been blocked"; без другого IP/VPN не открывать
- Superpages / EZlocal / Agency Spotter / Sortlist / South FL Biz Journal / Stack Overflow — BLOCKED (Cloudflare challenge): только headed-сессия с ручным решением
- ProvenExpert — BLOCKED (ERR_CONNECTION_CLOSED, блокировка соединения); n49 — BLOCKED (403/IP restriction)
- The Manifest — BLOCKED: регистрация через vendor.clutch.co/profile/create/basic, Cloudflare challenge-loop (Verification successful, но origin не отвечает). Главная clutch.co грузится, vendor-портал — нет. Ручной заход в обычном браузере
- Sitejabber — NEEDS_MANUAL: CAPTCHA + аккаунт создавался ранее, нужна ручная проверка; TopSEOs — NEEDS_MANUAL: только LinkedIn OAuth
- Local.com — FAILED: claim-listing отдаёт 404, форма нерабочая (площадка фактически мёртвая)
- Awwwards / CSS Design Awards — платная подача
- Ft Lauderdale Chamber / Miami Chamber / Broward County Chamber — платное членство ($574+/год, non-refundable): требуют отдельного одобрения клиента и бюджета
- Twitter/X, Nextdoor, Foursquare — верификация по телефону/открытке
- Stripe / Mailchimp / Webflow / HubSpot / Semrush / WooCommerce — партнёрские заявки с ручным ревью
- ActiveCampaign — NOT_APPLICABLE: partner ecosystem (reseller/commission), публичного каталога агентств нет; /partner содержит только sales-lead формы (Demo/Pricing/Trial)
- Business2Community — форма оказалась email-сборщиком (Aweber), не для подачи статей
- SUBMITTED (ожидают обработки): Brownbook, CityLocalPro, GoodFirms, Plantation Chamber, DesignRush, Digital Agency Net
- REGISTERED (требуют завершения профиля): Crunchbase, Medium, Shopify, YouTube

## План P1

1. **Brownbook / CityLocalPro** — SUBMITTED 07.08: заявки отправлены, профили не опубликованы. Проверить email info@itllect-agency.com (Brownbook activation), дождаться модерации; при появлении профиля — зафиксировать URL и статус VERIFIED_SUCCESS. Повторные регистрации НЕ запускать.
2. **TopSEOs** — NEEDS_MANUAL: /registration заполняется автоматически, submit зависает (только LinkedIn OAuth); довести submit вручную. Ожидание: SUBMITTED.
3. **Opendi** — BLOCKED: EXTERNAL BLOCK (Cloudflare/IP fingerprint, turnstile). Нужен другой IP/VPN или ручной заход, иначе не открывать.
4. Затем P2 через email-assisted регистрацию (рабочий паттерн: Semfirms, FindUsHere): следующий P2-кандидат.
5. Правила: если площадка не даёт прогресса за 15 минут — остановиться и перейти к следующей P1. Площадки со статусами SUBMITTED / REGISTERED / PENDING_VERIFICATION / PENDING_MODERATION / VERIFIED_SUCCESS / BLOCKED в повторный запуск не включаются.
