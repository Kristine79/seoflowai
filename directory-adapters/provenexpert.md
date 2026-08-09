# ProvenExpert — adapter notes

## Статус
- 09.08.2026: полный flow пройден: регистрация → подтверждение email → onboarding (3 шага) → профиль (3 шага) → публикация. **VERIFIED_SUCCESS**, публичный профиль: https://www.provenexpert.com/itllect/ (customer 2377210).

## URL flow
- Регистрация: https://www.provenexpert.com/en-us/register/ (кнопка "Get started" → /en-us/registration/ → редирект на /en-us/register/)
- Подтверждение email: письмо от register@provenexpert.com, subject "You're almost there!", ссылка `https://api.provenexpert.com/v2/registration/confirmation/{uuid}/lang/en-us` → редирект на onboarding
- Onboarding: https://www.provenexpert.com/onboarding/?code={uuid}&lang=en-us (3 шага, см. ниже)
- Профиль: https://app.provenexpert.com/profile/create/{1|2|3} (после логина)
- Dashboard: https://app.provenexpert.com/
- Публичный профиль: https://www.provenexpert.com/{slug}/ (например /itllect/)
- Логин: https://www.provenexpert.com/en-us/login/ (login_email, login_password)

## Аккаунт
- Email: itllect.marketing@gmail.com (подтверждается письмом; IMAP работает)
- Пароль: тот же, что для входа в почту (app password в .env EMAIL_PASS; пароль регистрации — REG_PASSWORD)
- Профиль браузера: human-provenexpert (логин сохраняется)

## Flow (7 шагов)

### 1. Email registration (SPA, MUI)
- Единственное поле на шаге: `#email`. Cookie-banner (CybotCookiebotDialog) фильтруется как не-форма.
- Кнопка: "Sign up now" (submitText = "Sign up now").

### 2. Email verification
- После клика — страница "Confirm your e-mail" с 0 полей (это НЕ конец: письмо уже в ящике).
- Нужно открыть confirmation link из письма (IMAP: waitForVerificationLink).

### 3. Onboarding step 1 — "Enter your name and a password"
- `#page1.salutation` (Mr.), `#page1.firstName`, `#page1.lastName`, `#page1.password` (требования: uppercase + special + number, 10+ chars).
- Кнопка: "Next".
- ВАЖНО: каждый новый заход на onboarding URL сбрасывает на шаг 1, если не завершён весь onboarding. Регистрация фиксируется только после финального шага.

### 4. Onboarding step 2 — "Select a name for your profile"
- `#page2.profileTitle` (ITllect). Кнопка: "Next".

### 5. Onboarding step 3 — industry (MUI Autocomplete)
- `#profileIndustry` (name=page3.profileIndustry). Вводить запрос (напр. "Marketing"), кликнуть первую опцию `[role=option]`. После выбора закрыть popper (Escape).
- Кнопка: "Get started!" — кликать ТОЛЬКО после выбора опции, иначе popper перехватывает клик ("no Options" перехватывает pointer events). Можно force-click.

### 6. Profile creation (3 шага, /profile/create/{1,2,3})
- **Step 1 Contact Details**: `contactData.0.name`, `.street`, `.zipCode`, `.city`, `.countryCode` (autocomplete, выбирать "United States"), после выбора страны появляется `.state` (обязательное! autocomplete "Florida"), `contactData.0.emailAddress`, `contactData.0.phoneNumbers.0.number`.
  - ⚠ Телефон: masked field с autocomplete-поиском страны. `page.fill`/`pressSequentially` ломает (ввод цифр интерпретируется как поиск страны, ошибка "Invalid format" / "Input must be at least 8 characters"). Решение: **native React setter**:
    ```js
    const proto = Object.getPrototypeOf(el);
    const desc = Object.getOwnPropertyDescriptor(proto, "value") || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    desc?.set?.call(el, "+17542597106");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    ```
  - Кнопка: "Next step".
- **Step 2 Company Information**: `#title` (Profile Name*, 80 max), `#activities` (Services*, 200), `#offers` (10000), `#description`, `[name=industry]` (Field of Activity*, autocomplete "Marketing"), `[name=secondaryIndustries]`. Кнопка: "Next step".
- **Step 3 Online Presence**: `[name=websites.0.label]`, `[name=websites.0.url]`, `[name=socialMediaProfiles.0.url]`, `externalRatingSources.0.url` — все необязательные.
  - Кнопка: **"Save and get started"** (НЕ "Next step"!). После клика → /explore (dashboard), профиль создан.

### 7. Publish
- Dashboard: кнопка "PUBLISH YOUR PROFILE" ("The profile is private and not visible for others").
- После публикации: публичный URL https://www.provenexpert.com/{slug}/ виден без логина → VERIFIED_SUCCESS.

## Особенности / проблемы
- Сайт: MUI (Material-UI) + React SPA, антибот не блокирует (CF challenge нет).
- Cookie banner: #CybotCookiebotDialog — 9 checkbox-контролов (LevelButtonNecessary/Preferences/Statistics/Marketing + Inline + PersonalInformation). Все должны исключаться из extraction (cookie filter в form-analyzer.ts).
- Кнопки шагов: "Next" (onboarding), "Next step" (profile 1-2), "Save and get started" (profile 3), "Get started!" (onboarding 3).
- Прямой заход на /profile/create/3 без логина → редирект на login; без завершения шагов 1-2 → редирект на /profile/create/1.
- ВАЖНО: повторный прогон human-submit с регистрацией создаёт НОВОЕ письмо (каждый клик "Sign up now" шлёт новое письмо с тем же uuid) — при уже подтверждённом email лучше логиниться, а не регистрироваться заново.
- Profile slug: /itllect/ (по profileTitle). Регион по умолчанию en-us.

## Способ проверки результата
1. https://www.provenexpert.com/itllect/ — публичный профиль без логина (текст: ITllect, услуги, описание, контакты) → VERIFIED_SUCCESS.
2. Customer number: 2377210 (dashboard).
3. Screenshots: human-submit-out/provenexpert/verify/dashboard.png, .../publish/public-profile.png.

## История
- 08.08: reprobe OK (FORM_READY), run → NEEDS_MANUAL (180s timeout, no proof).
- 09.08: диагностика — 10 "полей" были cookie-чекбоксами (Filled 1/10); исправлен form-analyzer (cookie filter, non-fillable, visibility).
- 09.08: email подтверждён (IMAP), onboarding + профиль заполнены, опубликовано → VERIFIED_SUCCESS.
