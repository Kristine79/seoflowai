import { MASTER_LIST } from "../src/lib/directories/MASTER_LIST";
import fs from "fs";

interface ProbeRow {
  name: string;
  url: string;
  attemptedUrl: string;
  finalUrl: string;
  verdict: string;
  fields: number;
  hasListingKW: boolean;
  cloudflare: boolean;
  captcha: string;
  formAction: string | null;
  error: string | null;
  screenshot: string | null;
  probeAt: string;
}

const probe: Record<string, ProbeRow> = JSON.parse(
  fs.readFileSync("./probe-results.json", "utf8")
);

const lookup: Record<string, (typeof MASTER_LIST)[number]> = {};
for (const p of MASTER_LIST) lookup[p.name] = p as any;

const order = [
  "FORM_READY", "FORM_LIKELY", "CAPTCHA", "LOGIN_REQUIRED",
  "EMPTY", "CF_BLOCKED", "NOT_APPLICABLE", "DEAD",
];

const rows = Object.values(probe);
rows.sort(
  (a, b) =>
    order.indexOf(a.verdict) - order.indexOf(b.verdict) ||
    a.name.localeCompare(b.name)
);

for (const v of rows) {
  const e = lookup[v.name];
  const type = e ? e.type : "?";
  console.log(
    v.verdict.padEnd(15),
    type,
    "f=" + String(v.fields).padStart(2),
    "cf=" + (v.cloudflare ? "Y" : "n"),
    v.captcha.padEnd(11),
    v.name.padEnd(22),
    v.finalUrl.slice(0, 55)
  );
}

// подборка по типам (actionable)
console.log("\n=== by master-type (actionable buckets) ===");
for (const t of ["A", "B", "C", "D", "E"] as const) {
  console.log(`\n# type ${t}`);
  for (const p of MASTER_LIST.filter((x: any) => x.type === t)) {
    const pr = probe[slug(p.name)];
    const v = pr ? pr.verdict : "?";
    console.log(`  ${v.padEnd(15)} ${p.name.padEnd(22)} (${p.clientCategory})`);
  }
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}