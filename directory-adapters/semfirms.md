# Semfirms Directory Adapter

## Status: SUCCESS

## Directory Info
- **URL**: https://www.semfirms.com/add-listing
- **Registration URL**: https://www.semfirms.com/add-user
- **Auth Type**: Email/Password (не OAuth)
- **Platform**: Drupal (с AJAX-формами)
- **Profile URL**: https://www.semfirms.com/profile/itllect-llc

## Account Status
- **Email**: itllect.marketing@gmail.com
- **Password**: `[REDACTED — stored in .env / secret manager; do not commit]`
- **Email Verified**: YES (verification link used during setup)
- **Login Working**: YES (dashboard accessible)
- **Persistent Profile**: `seoflowai-temp/agent-profiles/human-semfirms`

## Form Fields Mapping

### Required Fields
```javascript
{
  title: "ITllect",
  field_company_url: "https://itllect-agency.com/",
  field_contact_person: "[REDACTED]",
  field_position_title: "Founder & CEO",
  field_phone: "[REDACTED]",
  field_primary_address_1: "[REDACTED]",
  field_other_city: "Plantation",  // hidden field, requires JS to show
  field_state_1: "FL",
  field_zip_1: "33324",
  field_country_1: "375",  // US
  body: "[description]",
  field_year_founded: "2015",
  field_directory_category[]: ["8", "87", "88"],  // SEO, PPC, SMM
  field_confirm_term: true,
  field_directory_logo_upload: "temp-logo.png"  // 1x1 PNG, 70 bytes
}
```

### Select Options
- **Country**: `<select name="field_country_1">` — value="375" (United States)
- **City**: `<select name="field_city_1">` — Plantation not in list, use "All City" or other, then fill `field_other_city`
- **Categories**: `<select name="field_directory_category[]" multiple>` — values 8, 87, 88

## Steps Completed
1. ✅ Account registration (manual by user)
2. ✅ Email verification (link clicked)
3. ✅ Login verified (dashboard accessible)
4. ✅ Form fields identified and mapped
5. ✅ Logo uploaded (temp-logo.png)
6. ✅ Form filled via Playwright
## Where We Stopped (and Solved)

**Problem**: Submit button click did not trigger POST

### Root Cause Identified
**Field validation issue**: The `title` field required full company name with legal entity type (e.g., "Itllect LLC"), not just "ITllect". Drupal validation rejected the form silently, returning HTTP 500 or re-rendering empty form.

### Technical Issues Encountered
1. **jQuery CDN instability**: jQuery loaded unreliably (ERR_CONNECTION_CLOSED)
2. **Drupal AJAX handlers**: Called `preventDefault()` then failed with `$ is not defined`
3. **Form submit strategies**:
   - `form.submit()` — sent POST but without `op=Submit`, server returned empty form
   - `form.requestSubmit(button)` — no POST (jQuery handlers prevented)
   - `page.click('#edit-submit')` — no POST (button at y=2007, outside viewport)
   - Manual fetch with FormData — HTTP 500

### Solution
**Manual completion with correct field value**:
- User manually entered "Itllect LLC" in title field
- Clicked Submit button manually
- Form submitted successfully
- Profile created at: https://www.semfirms.com/profile/itllect-llc

### Key Learning
For Drupal forms with AJAX:
1. **Validate field values first** — some fields require specific formats (e.g., full legal name)
2. **Silent validation failures** — Drupal may return 500 or empty form without clear error messages
3. **jQuery dependency** — AJAX handlers may fail if jQuery doesn't load
4. **Manual fallback** — when automation fails, manual completion with correct values works

## Automation Improvements for Future Adapter

### Pre-Submit Validation Checklist
```javascript
async function validateDrupalForm(page, formSelector) {
  const checks = {
    jqueryLoaded: await page.evaluate(() => typeof window.jQuery !== 'undefined'),
    requiredFieldsFilled: await page.evaluate((sel) => {
      const form = document.querySelector(sel);
      const required = form.querySelectorAll('[required]');
      return Array.from(required).every(f => f.value.trim() !== '');
    }, formSelector),
    companyNameFormat: await page.evaluate((sel) => {
      const title = document.querySelector(sel + ' input[name="title"]');
      return title ? title.value.includes('LLC') || title.value.includes('Inc') || title.value.includes('Ltd') : false;
    }, formSelector)
  };
  
  return checks;
}
```

### Field Value Patterns
For company name fields in directories:
- **Semfirms**: Requires full legal name (e.g., "Itllect LLC")
- **Pattern**: Check if field label includes "Company Name" or "Business Name" → append legal entity type
- **Implementation**: `companyData.companyName + ' ' + companyData.legalEntityType`

### Error Detection
```javascript
async function detectDrupalErrors(page) {
  const text = await page.evaluate(() => document.body.innerText);
  
  if (text.includes('website encountered an unexpected error')) {
    return { type: 'SERVER_ERROR', message: 'Drupal 500 error' };
  }
  
  if (text.includes('required field') || text.includes('This field is required')) {
    return { type: 'VALIDATION_ERROR', message: 'Required field missing' };
  }
  
  // Check if form re-rendered with empty fields
  const emptyFields = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[required], textarea[required]');
    return Array.from(inputs).filter(i => i.value.trim() === '').length;
  });
  
  if (emptyFields > 0) {
    return { type: 'SILENT_VALIDATION', message: 'Form re-rendered with empty fields' };
  }
  
  return null;
}
```

### Retry Strategy
1. **First attempt**: Automated submit with jQuery unbinding
2. **If 500 or empty form**: Validate field values (especially company name format)
3. **If validation fails**: Correct field values and retry
4. **If still fails**: Mark as NEEDS_MANUAL with specific instructions

## Reusable Pattern for SEOFlow

### Drupal AJAX Form Handler Template
```javascript
async function submitDrupalAjaxForm(page, formSelector, buttonSelector, fields) {
  // 1. Wait for jQuery (with retry)
  for (let i = 0; i < 4; i++) {
    await page.goto(page.url(), { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForFunction(() => typeof window.jQuery !== 'undefined', null, { timeout: 20000 });
      break;
    } catch (e) {
      await page.waitForTimeout(3000);
    }
  }
  
  // 2. Fill fields
  for (const [name, value] of Object.entries(fields)) {
    if (typeof value === 'boolean') {
      if (value) await page.check(`input[name="${name}"]`);
    } else if (Array.isArray(value)) {
      await page.evaluate((sel, vals) => {
        const select = document.querySelector(sel);
        vals.forEach(v => {
          const opt = Array.from(select.options).find(o => o.value === v);
          if (opt) opt.selected = true;
        });
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }, `select[name="${name}"]`, value);
    } else {
      await page.fill(`input[name="${name}"], textarea[name="${name}"]`, value);
    }
  }
  
  // 3. Unbind jQuery handlers and submit
  await page.evaluate((formSel, btnSel) => {
    const form = document.querySelector(formSel);
    const btn = document.querySelector(btnSel);
    if (typeof jQuery !== 'undefined') {
      jQuery(form).off('submit');
      jQuery(btn).off('click');
    }
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = btn.name;
    input.value = btn.value;
    form.appendChild(input);
    form.submit();
  }, formSelector, buttonSelector);
  
  // 4. Wait for response
  await page.waitForTimeout(15000);
  
  // 5. Check success
  const text = await page.evaluate(() => document.body.innerText);
  return text.includes('Thank you') || text.includes('submitted') || text.includes('success');
}
```

### Known Issues
- jQuery CDN may be blocked or slow (ERR_CONNECTION_CLOSED)
- Drupal AJAX forms require specific parameters
- Logo upload may fail with 1x1 PNG (use real logo)
- Server may return 500 on malformed AJAX requests

## Lessons Learned

### 1. Field Value Validation
**Problem**: Automation failed because `title` field required "Itllect LLC" not "ITllect"  
**Solution**: Always validate field values against expected patterns before submit  
**Pattern**: Company name fields often require full legal entity name (LLC, Inc, Ltd, etc.)

### 2. Silent Drupal Failures
**Problem**: Server returned HTTP 500 or empty form without clear error messages  
**Solution**: Check for "website encountered an unexpected error" text and empty required fields after submit  
**Pattern**: Drupal AJAX forms may fail silently — always verify success

### 3. jQuery Dependency
**Problem**: jQuery CDN unstable (ERR_CONNECTION_CLOSED), breaking Drupal AJAX handlers  
**Solution**: Wait for jQuery with retry, or unbind handlers before submit  
**Pattern**: Drupal/WordPress sites often depend on jQuery for form submission

### 4. Manual Fallback
**Problem**: Automated submit failed despite correct field mapping  
**Solution**: Open headed browser, fill form, let user complete manually  
**Pattern**: When automation fails, manual completion with correct values is fastest path

### 5. Profile URL Extraction
**Problem**: Profile URL not immediately visible after submit  
**Solution**: Navigate to dashboard → MANAGE PROFILE → find "VIEW PROFILE" link  
**Pattern**: Many directories show profile link in dashboard, not on success page

## Final Status
✅ **SUCCESS** — Profile live at https://www.semfirms.com/profile/itllect-llc

## Notes
- Form ID: `#semfirmregistration`
- Submit button: `#edit-submit` (name="op", value="Submit")
- Logo upload button: `#edit-field-directory-logo-upload-button` (separate AJAX upload)
- Form action: `https://www.semfirms.com/add-listing`
- Persistent profile preserves login session
