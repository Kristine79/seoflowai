import { MASTER_LIST } from "../src/lib/directories/MASTER_LIST";
import fs from "fs";
import path from "path";

const probeRaw = JSON.parse(fs.readFileSync("./probe-results.json", "utf8"));

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface QueueEntry {
  name: string;
  url: string;
  submissionUrl: string;
  type: string;
  priority: number;
  previewStatus: string | null;
  previewFields: number;
  previewFilled: number;
  humanAction: string;
  notes: string;
  status: "PENDING" | "SUCCESS" | "NEEDS_MANUAL" | "FAILED" | "NOT_APPLICABLE";
  result: string | null;
}

// Known results from our work
const KNOWN_RESULTS: Record<string, { status: string; action: string; notes: string }> = {
  Brownbook: { status: "SUCCESS", action: "none", notes: "Added successfully in earlier session" },
  GoodFirms: { status: "NEEDS_MANUAL", action: "captcha (turnstile)", notes: "PREVIEW 3f OK; SUBMIT blocked by CF turnstile on /get-listed" },
  TopSEOs: { status: "NEEDS_MANUAL", action: "manual submit", notes: "PREVIEW 10f OK; SUBMIT profile crash; Drupal form[name] fields" },
  "Digital Agency Net": { status: "NEEDS_MANUAL", action: "login + register", notes: "PREVIEW 4f OK; needs registration before add-agency" },
  CityLocalPro: { status: "NEEDS_MANUAL", action: "login + captcha (recaptcha_v2)", notes: "PREVIEW 17f OK; needs account + manual captcha" },
  Opendi: { status: "NEEDS_MANUAL", action: "captcha (Cloudflare)", notes: "PREVIEW 9f/4 OK; SUBMIT CF blocked" },
  "Bark.com": { status: "NEEDS_MANUAL", action: "manual navigate + submit", notes: "PREVIEW 35f/4 OK; SPA multi-step form detected on PREVIEW but not on SUBMIT" },
  DesignRush: { status: "NEEDS_MANUAL", action: "login + register", notes: "Login required; needs account creation before agency submission" },
  "Business2Community": { status: "NEEDS_MANUAL", action: "register + submit", notes: "PREVIEW 11f/1 OK; form needs account + submit button appears after login" },
  "Local.com": { status: "FAILED", action: "unreachable", notes: "ERR_CONNECTION_RESET" },
  "ActiveCampaign": { status: "FAILED", action: "unreachable", notes: "ERR_CONNECTION_RESET" },
  "WooCommerce Agency": { status: "FAILED", action: "selectors missing", notes: "Form fields not found by Playwright" },
};

// Type-based human action defaults
const TYPE_ACTIONS: Record<string, string> = {
  A: "fill form + manual submit",
  B: "register + claim business + verify email/domain",
  C: "register agency profile + fill services/portfolio + submit",
  D: "create account + create profile + publish content",
  E: "partner application (manual review)",
};

const PRIORITY_MAP: Record<string, number> = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const queue: QueueEntry[] = [];
const seen = new Set<string>();

for (const p of MASTER_LIST) {
  const key = slug(p.name);
  if (seen.has(key)) continue;
  seen.add(key);

  const pr = probeRaw[key];
  const known = KNOWN_RESULTS[p.name];

  let status: QueueEntry["status"] = "PENDING";
  let humanAction = TYPE_ACTIONS[p.type] || "manual review";
  let notes = pr ? `${pr.verdict}: ${pr.fields}f` : "";
  let previewFields = pr?.fields || 0;
  let previewFilled = 0;

  if (known) {
    status = known.status as QueueEntry["status"];
    if (known.action !== "none") humanAction = known.action;
    if (known.notes) notes = known.notes;
  }

  // Classify NA from probe
  if (!known && pr?.verdict === "NOT_APPLICABLE") {
    status = "NOT_APPLICABLE";
  } else if (!known && pr?.verdict === "DEAD") {
    status = "FAILED";
    notes = "Site unreachable (chrome-error)";
  } else if (!known && pr?.verdict === "CF_BLOCKED") {
    status = "NEEDS_MANUAL";
    humanAction = "captcha (Cloudflare)";
    notes = "CF blocked in headless; needs headed stealth + manual solve";
  } else if (!known && pr?.verdict === "LOGIN_REQUIRED") {
    status = "NEEDS_MANUAL";
    humanAction = "login + register";
    notes = "Login/registration required";
  } else if (!known && pr?.verdict === "CAPTCHA") {
    status = "NEEDS_MANUAL";
    humanAction = `captcha (${pr.captcha || "unknown"})`;
    notes = "Captcha detected";
  } else if (!known && pr?.verdict === "EMPTY") {
    status = "NEEDS_MANUAL";
    humanAction = "find form path";
    notes = "Page loaded but no form detected";
  }

  // FR/LIKELY not yet attempted go to PENDING
  if (!known && (pr?.verdict === "FORM_READY" || pr?.verdict === "FORM_LIKELY")) {
    status = "PENDING";
    humanAction = "human assisted fill + submit";
  }

  const entry: QueueEntry = {
    name: p.name,
    url: p.url,
    submissionUrl: p.submissionUrl,
    type: p.type,
    priority: PRIORITY_MAP[p.priority] || 9,
    previewStatus: pr?.verdict || null,
    previewFields,
    previewFilled,
    humanAction,
    notes,
    status,
    result: null,
  };
  queue.push(entry);
}

// Sort: priority then name
queue.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));

fs.writeFileSync("./human-queue.json", JSON.stringify(queue, null, 2), "utf-8");
console.log(`Queue generated: ${queue.length} platforms`);
console.log(`  PENDING:      ${queue.filter((q) => q.status === "PENDING").length}`);
console.log(`  NEEDS_MANUAL: ${queue.filter((q) => q.status === "NEEDS_MANUAL").length}`);
console.log(`  SUCCESS:      ${queue.filter((q) => q.status === "SUCCESS").length}`);
console.log(`  FAILED:       ${queue.filter((q) => q.status === "FAILED").length}`);
console.log(`  NA:           ${queue.filter((q) => q.status === "NOT_APPLICABLE").length}`);
