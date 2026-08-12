/**
 * Targeted synthetic regression — registration email domain-mismatch guard.
 *
 * INPUT:
 *   REGISTRATION_EMAIL = itllect.marketing@gmail.com   (scripts/human-submit.ts:52)
 *   SERVER RESPONSE    = {"status":"ERROR","code":"mismatch_email",
 *                         "message":"... email domain doesn't match your website domain ..."}
 *
 * EXPECTED:
 *   NEEDS_MANUAL — guard returns EMAIL_DOMAIN_MISMATCH_MESSAGE (no email substitution).
 *
 * FORBIDDEN:
 *   - substituting REGISTRATION_EMAIL with info@itllect.com
 *   - substituting with COMPANY_EMAIL (info@itllect-agency.com)
 *   - substituting with any other email address
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  detectEmailDomainMismatch,
  EMAIL_DOMAIN_MISMATCH_MESSAGE,
} from "../src/lib/automation/submission-runner";

let failures = 0;
const check = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${name} — ${e instanceof Error ? e.message : String(e)}`);
  }
};

console.log("=== Targeted regression: registration email domain-mismatch guard ===\n");

// --- INPUT fixtures (mirror of the real SmartCustomer server response) ---
const MISMATCH_RESPONSE = {
  status: 200,
  url: "https://biz.smartcustomer.com/registration",
  body: '{"status":"ERROR","message":"Looks like your email domain doesn\'t match your website domain. If so, then please email your name, phone, and site url to biz@smartcustomer.com","code":"mismatch_email"}',
};
const OK_RESPONSE = {
  status: 200,
  url: "https://biz.smartcustomer.com/registration",
  body: '{"status":"OK","sid":127601}',
};
const OTHER_ERROR_RESPONSE = {
  status: 200,
  url: "https://biz.smartcustomer.com/registration",
  body: '{"status":"ERROR","code":"captcha_invalid","message":"Captcha verification failed"}',
};

// --- EXPECTED: NEEDS_MANUAL on mismatch ---
check("mismatch_email response -> guard message (NEEDS_MANUAL)", () => {
  assert.equal(detectEmailDomainMismatch([MISMATCH_RESPONSE]), EMAIL_DOMAIN_MISMATCH_MESSAGE);
  assert.match(EMAIL_DOMAIN_MISMATCH_MESSAGE, /NEEDS_MANUAL|client confirmation|rejected/i);
});

check("lowercased/word-variant of mismatch also detected", () => {
  assert.equal(
    detectEmailDomainMismatch([{ status: 200, url: "x", body: "the email domain doesn't match your website domain" }]),
    EMAIL_DOMAIN_MISMATCH_MESSAGE
  );
});

// --- no false positive on success / unrelated errors ---
check("successful registration response -> no guard", () => {
  assert.equal(detectEmailDomainMismatch([OK_RESPONSE]), null);
});

check("non-email server error -> no guard", () => {
  assert.equal(detectEmailDomainMismatch([OTHER_ERROR_RESPONSE]), null);
});

check("empty responses -> no guard", () => {
  assert.equal(detectEmailDomainMismatch([]), null);
});

check("HTTP error status is ignored", () => {
  assert.equal(detectEmailDomainMismatch([{ status: 500, url: "x", body: "mismatch_email" }]), null);
});

// --- FORBIDDEN: no email substitution in any form ---
check("guard message contains NO email address (no substitution)", () => {
  assert.ok(!EMAIL_DOMAIN_MISMATCH_MESSAGE.includes("@"), "guard message must not contain any email address");
  assert.ok(!EMAIL_DOMAIN_MISMATCH_MESSAGE.includes("info@itllect.com"));
  assert.ok(!EMAIL_DOMAIN_MISMATCH_MESSAGE.includes("itllect.marketing@gmail.com"));
  assert.ok(!EMAIL_DOMAIN_MISMATCH_MESSAGE.includes("info@itllect-agency.com"));
});

check("guard never returns a substitute email as its result", () => {
  const result = detectEmailDomainMismatch([MISMATCH_RESPONSE]);
  assert.equal(result, EMAIL_DOMAIN_MISMATCH_MESSAGE);
  assert.ok(!(result as string).includes("@"));
});

// --- source-of-truth: REGISTRATION_EMAIL must remain unchanged in pipeline ---
check("scripts/human-submit.ts REGISTRATION_EMAIL is unchanged (source of truth)", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "scripts", "human-submit.ts"), "utf8");
  assert.ok(src.includes('const REGISTRATION_EMAIL = "itllect.marketing@gmail.com";'),
    "REGISTRATION_EMAIL constant must equal itllect.marketing@gmail.com");
});

// --- pipeline wiring: mismatch path must map to NEEDS_MANUAL before SUBMITTED ---
check("human-submit.ts maps mismatch guard to NEEDS_MANUAL before SUBMITTED", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "scripts", "human-submit.ts"), "utf8");
  const mismatchIdx = src.indexOf("detectEmailDomainMismatch(submitResponses)");
  const submittedIdx = src.indexOf('if (result.ok)');
  assert.ok(mismatchIdx !== -1, "mismatch guard call must exist");
  assert.ok(submittedIdx !== -1);
  assert.ok(mismatchIdx < submittedIdx, "mismatch guard must run BEFORE the SUBMITTED branch");
  assert.ok(src.includes('status: "NEEDS_MANUAL", error: emailMismatch'), "guard branch must return NEEDS_MANUAL");
});

console.log(`\n=== ${failures === 0 ? "PASS" : `FAIL (${failures})`} ===`);
process.exit(failures === 0 ? 0 : 1);
