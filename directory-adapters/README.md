# Directory Adapter Pattern for SEOFlow

## Overview
Универсальный паттерн для автоматизации регистрации в бизнес-каталогах. Каждый adapter описывает:
- Площадку и её особенности
- Маппинг полей формы
- Авторизацию и верификацию email
- Шаги регистрации
- Известные проблемы и решения

## Adapter Structure

### 1. Directory Metadata
```javascript
{
  name: "DirectoryName",
  url: "https://directory.com",
  submissionUrl: "https://directory.com/add-business",
  registrationUrl: "https://directory.com/register",
  platform: "WordPress|Drupal|Custom|etc",
  authType: "email-password|oauth|none",
  requiresEmailVerification: true,
  captchaType: "none|recaptcha_v2|recaptcha_v3|hcaptcha|custom",
  status: "PENDING|IN_PROGRESS|SUCCESS|FAILED|NEEDS_MANUAL"
}
```

### 2. Field Mapping
```javascript
{
  // Standard fields (common across directories)
  companyName: "input[name='business_name']",
  website: "input[name='url']",
  email: "input[name='email']",
  phone: "input[name='phone']",
  address: "input[name='address']",
  city: "input[name='city']",
  state: "input[name='state']",
  zip: "input[name='zip']",
  country: "select[name='country']",
  description: "textarea[name='description']",
  
  // Directory-specific fields
  yearFounded: "input[name='year_founded']",
  categories: "select[name='categories[]']",
  logo: "input[type='file'][name='logo']",
  
  // Custom selectors
  submitButton: "button[type='submit']",
  termsCheckbox: "input[name='terms']"
}
```

### 3. Registration Flow
```javascript
async function register(page, companyData) {
  // Step 1: Navigate to registration
  await page.goto(registrationUrl);
  
  // Step 2: Fill registration form
  await fillRegistrationForm(page, companyData);
  
  // Step 3: Submit
  await submitForm(page);
  
  // Step 4: Email verification (if required)
  if (requiresEmailVerification) {
    await verifyEmail(companyData.email);
  }
  
  // Step 5: Login
  await login(page, companyData.email, companyData.password);
  
  // Step 6: Submit business listing
  await page.goto(submissionUrl);
  await fillBusinessForm(page, companyData);
  await submitForm(page);
  
  // Step 7: Extract profile URL
  const profileUrl = await extractProfileUrl(page);
  
  return {
    status: "SUCCESS",
    profileUrl,
    loginCredentials: { email: companyData.email, password: companyData.password }
  };
}
```

## Common Patterns

### Pattern 1: Simple Form (No Auth)
**Examples**: Brownbook, Hotfrog, Yelp (basic)

```javascript
async function registerSimpleForm(page, companyData) {
  await page.goto(submissionUrl);
  
  // Fill fields
  for (const [field, selector] of Object.entries(fieldMapping)) {
    if (companyData[field]) {
      await page.fill(selector, companyData[field]);
    }
  }
  
  // Submit
  await page.click(submitButton);
  await page.waitForNavigation();
  
  // Check success
  const text = await page.evaluate(() => document.body.innerText);
  if (text.includes("Thank you") || text.includes("submitted")) {
    return { status: "SUCCESS" };
  }
  
  return { status: "FAILED", reason: "No success message" };
}
```

### Pattern 2: Registration + Email Verification
**Examples**: Semfirms, ProvenExpert, HubPages

```javascript
async function registerWithEmailVerification(page, companyData) {
  // Step 1: Register account
  await page.goto(registrationUrl);
  await page.fill('input[name="email"]', companyData.email);
  await page.fill('input[name="password"]', generatePassword());
  await page.click('button[type="submit"]');
  
  // Step 2: Wait for verification email
  const email = await waitForEmail(companyData.email, {
    from: "noreply@directory.com",
    subject: "Verify your email"
  });
  
  // Step 3: Extract verification link/code
  const verificationLink = extractLink(email.body);
  const verificationCode = extractCode(email.body);
  
  // Step 4: Verify email
  if (verificationLink) {
    await page.goto(verificationLink);
  } else if (verificationCode) {
    await page.fill('input[name="code"]', verificationCode);
    await page.click('button[type="submit"]');
  }
  
  // Step 5: Login
  await login(page, companyData.email, companyData.password);
  
  // Step 6: Submit business listing
  await submitBusinessListing(page, companyData);
}
```

### Pattern 3: OAuth-Only (Manual Required)
**Examples**: TopSEOs, LinkedIn, Crunchbase

```javascript
async function registerOAuth(page, companyData) {
  // Cannot automate OAuth flows
  return {
    status: "NEEDS_MANUAL",
    reason: "OAuth-only registration (LinkedIn/Google/Facebook)",
    manualSteps: [
      "Open registration URL in browser",
      "Login with LinkedIn/Google/Facebook",
      "Complete profile manually",
      "Submit business information"
    ]
  };
}
```

### Pattern 4: CAPTCHA Required
**Examples**: CityLocalPro, Yelp (advanced)

```javascript
async function registerWithCaptcha(page, companyData) {
  await page.goto(submissionUrl);
  
  // Fill form
  await fillForm(page, companyData);
  
  // Detect CAPTCHA type
  const captchaType = await detectCaptcha(page);
  
  if (captchaType === "recaptcha_v2") {
    // Cannot solve automatically
    return {
      status: "NEEDS_MANUAL",
      reason: "reCAPTCHA v2 required",
      manualSteps: ["Solve CAPTCHA manually", "Click submit"]
    };
  }
  
  if (captchaType === "recaptcha_v3") {
    // reCAPTCHA v3 is invisible, may pass automatically
    await page.waitForTimeout(3000);
  }
  
  // Submit
  await page.click(submitButton);
}
```

## Field Detection Heuristics

### Auto-Detect Form Fields
```javascript
async function detectFormFields(page) {
  const fields = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    return inputs.map(input => ({
      name: input.name,
      type: input.type,
      label: document.querySelector(`label[for="${input.id}"]`)?.innerText || '',
      required: input.required,
      placeholder: input.placeholder
    }));
  });
  
  return fields;
}
```

### Label-to-Field Mapping Rules
```javascript
const LABEL_RULES = [
  { patterns: ['company name', 'business name', 'firm name'], field: 'companyName' },
  { patterns: ['website', 'url', 'web address'], field: 'website' },
  { patterns: ['email', 'e-mail'], field: 'email' },
  { patterns: ['phone', 'telephone', 'contact number'], field: 'phone' },
  { patterns: ['address', 'street'], field: 'address' },
  { patterns: ['city', 'town'], field: 'city' },
  { patterns: ['state', 'province', 'region'], field: 'state' },
  { patterns: ['zip', 'postal code', 'postcode'], field: 'zip' },
  { patterns: ['country'], field: 'country' },
  { patterns: ['description', 'about', 'bio'], field: 'description' },
  { patterns: ['first name', 'given name'], field: 'firstName' },
  { patterns: ['last name', 'surname', 'family name'], field: 'lastName' },
  { patterns: ['position', 'title', 'job title'], field: 'position' }
];
```

## Email Verification Flow

### IMAP Configuration
```javascript
const EMAIL_CONFIG = {
  host: 'imap.gmail.com',
  port: 993,
  user: 'itllect.marketing@gmail.com',
  password: process.env.EMAIL_PASS, // Google App Password (never commit real credentials)
  tls: true
};
```

### Wait for Verification Email
```javascript
async function waitForVerificationEmail(email, options = {}) {
  const { from, subject, timeout = 120000 } = options;
  
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const emails = await fetchRecentEmails(email, { since: startTime });
    
    for (const msg of emails) {
      if (from && !msg.from.includes(from)) continue;
      if (subject && !msg.subject.includes(subject)) continue;
      
      return {
        subject: msg.subject,
        body: msg.body,
        html: msg.html
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error('Verification email not received');
}
```

### Extract Verification Link/Code
```javascript
function extractVerificationLink(emailBody) {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  const urls = emailBody.match(urlRegex) || [];
  
  // Filter for verification URLs
  const verificationUrls = urls.filter(url => 
    url.includes('verify') || 
    url.includes('confirm') || 
    url.includes('activate') ||
    url.includes('token=')
  );
  
  return verificationUrls[0] || null;
}

function extractVerificationCode(emailBody) {
  // Look for 4-6 digit codes
  const codeRegex = /\b\d{4,6}\b/g;
  const codes = emailBody.match(codeRegex) || [];
  
  return codes[0] || null;
}
```

## Error Handling

### Common Errors and Solutions

#### 1. Cloudflare Block
```javascript
if (pageText.includes("Sorry, you have been blocked") || 
    pageText.includes("Cloudflare")) {
  return {
    status: "FAILED",
    reason: "Cloudflare block",
    retryAfter: 3600000 // 1 hour
  };
}
```

#### 2. CAPTCHA Detection
```javascript
if (await page.$('iframe[src*="recaptcha"]') || 
    await page.$('.g-recaptcha')) {
  return {
    status: "NEEDS_MANUAL",
    reason: "CAPTCHA required"
  };
}
```

#### 3. Form Validation Errors
```javascript
const errors = await page.evaluate(() => {
  const errorElements = document.querySelectorAll('.error, .invalid, [class*="error"]');
  return Array.from(errorElements).map(el => el.innerText);
});

if (errors.length > 0) {
  return {
    status: "FAILED",
    reason: "Form validation failed",
    errors
  };
}
```

#### 4. jQuery/JS Not Loaded
```javascript
// For Drupal/WordPress sites with AJAX forms
const jqueryLoaded = await page.evaluate(() => typeof window.jQuery !== 'undefined');

if (!jqueryLoaded) {
  // Retry with longer timeout
  await page.waitForFunction(() => typeof window.jQuery !== 'undefined', null, { timeout: 20000 });
}
```

## Best Practices

### 1. Stealth Mode
```javascript
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: true,
  viewport: { width: 1280, height: 800 },
  locale: 'en-US',
  timezoneId: 'America/New_York',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  args: [
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
    '--disable-dev-shm-usage'
  ]
});
```

### 2. Human-Like Delays
```javascript
await page.waitForTimeout(1000 + Math.random() * 2000); // 1-3 seconds
await page.type(selector, text, { delay: 50 + Math.random() * 100 });
```

### 3. Persistent Profiles
```javascript
const userDataDir = path.resolve(`seoflowai-temp/agent-profiles/human-${directoryName}`);
// Preserves cookies, localStorage, login sessions
```

### 4. Screenshot on Failure
```javascript
if (status === "FAILED") {
  await page.screenshot({ 
    path: `human-submit-out/${directoryName}/failure-${Date.now()}.png`,
    fullPage: true 
  });
}
```

## Adapter Checklist

Before marking a directory as complete, verify:

- [ ] Registration URL identified
- [ ] Auth type determined (email/password, OAuth, none)
- [ ] Form fields mapped to company data
- [ ] Email verification flow tested (if required)
- [ ] Submit button identified and working
- [ ] Success message or profile URL extraction working
- [ ] Error handling implemented (Cloudflare, CAPTCHA, validation)
- [ ] Persistent profile created (if login required)
- [ ] Documentation created in `directory-adapters/{name}.md`
- [ ] Status updated in `human-queue.json`

## Priority Queue

### High Priority (Easy Wins)
1. **Brownbook** — Simple form, no auth ✅
2. **Hotfrog** — Simple form, no auth
3. **Yelp** — Basic listing (no reviews)

### Medium Priority (Email Verification)
1. **Semfirms** — Email/password, Drupal AJAX ⚠️
2. **ProvenExpert** — Email verification required
3. **HubPages** — Author profile + business listing

### Low Priority (Manual Required)
1. **TopSEOs** — OAuth-only (LinkedIn) ❌
2. **Crunchbase** — OAuth-only
3. **Alignable** — Complex form, CAPTCHA

## Next Steps

1. Create adapters for remaining high-priority directories
2. Implement universal form filler with field detection
3. Add CAPTCHA detection and handling
4. Build email verification queue system
5. Create dashboard for tracking submissions
