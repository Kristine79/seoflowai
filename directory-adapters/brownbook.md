# Brownbook — adapter notes

## Статус
- 30.07.2026: первый submit (SUCCESS-сигнал), профиль НЕ появился.
- 07.08.2026: UNVERIFIED → проверка: профиля нет (soft-404 /business/itllect, /search/business/* = Results Found 0).
- 07.08.2026: повторный submit через human-submit.ts (headed) → SUCCESS-сигнал. Профиль по-прежнему НЕ опубликован (поиск: Results Found 0, 4 вариации). Статус: SUBMITTED.

## URL flow
- Главная: https://www.brownbook.net
- Подача: https://www.brownbook.net/add-business (шаг 1 из 2)
- Поиск (проверка результата): https://www.brownbook.net/search/business/{query} — рендерится JS (Next.js), curl показывает пустую страницу; проверять в браузере или через SSR-парсинг title.
- Формат профиля: https://www.brownbook.net/business/{slug} (не существует для itllect — soft-404 с главной страницей).

## Форма (шаг 1 из 2) — поля
name*, category* (autocomplete, не select), city, country* (select), zip_code, phone, mobile, fax, email, website, display_website (checkbox), blog, twitter, facebook, instagram, linkedin, tiktok, skype, im + textarea address.
React/Next.js (Tailwind class="space-y-6"), форм в SSR-HTML нет — extractFormStructure работает после рендера.

## Особенности
- CAPTCHA/Cloudflare challenge НЕТ — форма открывается и submit проходит без капчи.
- Email-верификация: вероятно, требуется для активации listing (профиль не появляется сразу). Письмо ожидать на адрес из формы (info@itllect-agency.com), НЕ на itllect.marketing@gmail.com (в IMAP-ящике писем от Brownbook нет).
- Поиск по BUSINESS "itllect" = 0 результатов, даже после submit. Заявка может уходить в модерацию.
- human-submit.ts ставит SUCCESS по смене URL/signal words — это НЕ публикация профиля.

## Способ проверки результата
1. Браузер (headed, профиль human-brownbook): https://www.brownbook.net/search/business/itllect → "Results Found N".
2. Или curl + парсинг title "Find itllect in Brownbook.net" — если N>0, искать ссылку /business/{slug} в HTML.
3. Публичный профиль доступен без авторизации → VERIFIED_SUCCESS + URL.

## Аккаунты
- Регистрация аккаунта не требуется для подачи listing (форма открытая).
- Профиль браузера: seoflowai-temp/agent-profiles/human-brownbook (куки не сохраняют логин — аккаунта нет).

## История
- Подача 30.07 → профиль не появился (аналогичная ситуация).
- Подача 07.08 → профиль не появился. Причина не установлена: модерация или обязательный email-verify. 
