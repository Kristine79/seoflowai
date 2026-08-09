# CityLocalPro — adapter notes

## Статус
- 30.07.2026: форма заполнена (13 полей), reCAPTCHA v2 заблокировала submit. NEEDS_MANUAL.
- 07.08.2026: UNVERIFIED → проверка: профиля нет (/biz/itllect=404, /biz/itllect-llc=404, /biz/itllect-agency=soft-404, поиск=0).
- 07.08.2026: повторный submit через human-submit.ts (headed, капча решена вручную) → SUCCESS-сигнал. Профиль НЕ опубликован (поиск q=itllect: "No result"). Статус: SUBMITTED.

## URL flow
- Главная: https://citylocalpro.com (www → 301)
- Подача: https://citylocalpro.com/add-your-business
- Формат профиля: https://citylocalpro.com/biz/{slug} (например /biz/ameridial-inc)
- Поиск (проверка результата): https://citylocalpro.com/search?q={query}
- Вход: /login (в т.ч. Google OAuth), регистрация: /register

## Форма /add-your-business (Laravel)
Поля: name, phone, email, password, company_name, company_phone, state, city, zipcode, company_logo, term + select category (категории-дерево), select country_code. CSRF-токен _token. Также login/remember/quickLoginForm (модалка быстрого входа).
reCAPTCHA v2 на форме: sitekey 6Lf6LOQUAAAAABqcYnE2W7nvCrmqH0owrkn5FyAZ — решается ТОЛЬКО вручную (headed-браузер).

## Особенности
- Laravel + Cloudflare CDN (email-protection на контактах), но не challenge-блок.
- Email-верификация: письма на itllect.marketing@gmail.com не приходят (IMAP пуст) — адрес формы = info@itllect-agency.com.
- Листинг проходит модерацию; профиль появляется не сразу после submit.
- human-submit.ts SUCCESS = смена URL/signal words, НЕ публикация.
- Cloudflare turnstile на поиске? — нет, поиск отдаётся нормально.

## Способ проверки результата
1. https://citylocalpro.com/search?q=itllect → "Found 0 Listings" / "No result" или ссылки /biz/*.
2. Прямые URL: /biz/itllect, /biz/itllect-llc (404), /biz/itllect-agency (soft-404 "We couldn't find Business").
3. Публичный профиль без авторизации → VERIFIED_SUCCESS + URL.

## Аккаунты
- Аккаунт не создан (подача без регистрации). Профиль браузера: seoflowai-temp/agent-profiles/human-citylocalpro.
- Если листинг зависнет — зарегистрироваться через Google OAuth (быстрый вход) и проверить "My listings".

## История
- 30.07: капча не решена → NEEDS_MANUAL.
- 07.08: капча решена вручную, submit прошёл → SUBMITTED, профиль в модерации (предположительно).
