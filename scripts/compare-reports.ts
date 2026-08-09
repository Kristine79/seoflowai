#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");

// Get previous report from git
const oldText = execSync('git show HEAD:client-report/client-directory-report.md', { encoding: 'utf8' });
const curText = fs.readFileSync('client-report/client-directory-report.md', 'utf8');

function parseReport(text) {
  const map = {};
  const lines = text.split('\n');
  let inTable = false;
  for (const line of lines) {
    if (line.includes('| Каталог')) { inTable = true; continue; }
    if (line.includes('---|---|---')) continue;
    if (!inTable || !line.startsWith('| ')) { if (inTable && line.trim() === '') break; continue; }
    const cols = line.split('|').map(c => c.trim());
    if (cols.length >= 5) {
      map[cols[1]] = { status: cols[4], result: cols[5], next: cols[6], reason: cols[7] };
    }
  }
  return map;
}

function countByStatus(map) {
  const counts = {};
  Object.values(map).forEach(v => {
    counts[v.status] = (counts[v.status] || 0) + 1;
  });
  return counts;
}

const oldMap = parseReport(oldText);
const curMap = parseReport(curText);

const oldCounts = countByStatus(oldMap);
const curCounts = countByStatus(curMap);

console.log("========================================");
console.log("REPORT CHANGES — client-directory-report");
console.log("========================================\n");

console.log("PREVIOUS REPORT (07.08):");
Object.entries(oldCounts)
  .sort((a, b) => (b[1] - a[1]))
  .forEach(([k, v]) => console.log(`  ${k.padEnd(40)} ${v}`));

console.log("\nCURRENT REPORT (08.08):");
Object.entries(curCounts)
  .sort((a, b) => (b[1] - a[1]))
  .forEach(([k, v]) => console.log(`  ${k.padEnd(40)} ${v}`));

// Platform-level changes
const allNames = [...new Set([...Object.keys(oldMap), ...Object.keys(curMap)])].sort();
const changes = [];
allNames.forEach(name => {
  const oldS = oldMap[name];
  const curS = curMap[name];
  if (!oldS) { changes.push({ name, oldStatus: '—', newStatus: curS.status, note: 'NEW' }); }
  else if (!curS) { changes.push({ name, oldStatus: oldS.status, newStatus: '—', note: 'REMOVED' }); }
  else if (oldS.status !== curS.status) { changes.push({ name, oldStatus: oldS.status, newStatus: curS.status, note: '' }); }
});

if (changes.length > 0) {
  console.log("\n--- STATUS CHANGES ---\n");
  console.log("Platform".padEnd(28) + " | Previous Status".padEnd(40) + " | Current Status".padEnd(40));
  console.log("-".repeat(110));
  changes.forEach(c => {
    console.log(c.name.padEnd(28) + " | " + (c.oldStatus || '—').padEnd(38) + " | " + (c.newStatus || '—'));
  });
}

// VERIFIED_SUCCESS
console.log("\n--- VERIFIED SUCCESS ---");
Object.entries(curMap)
  .filter(([_, v]) => v.status === "Размещено (подтверждено)")
  .forEach(([name, v]) => console.log(`  ${name.padEnd(22)} ${v.reason || v.result || ''}`));

// SUBMITTED
console.log("\n--- SUBMITTED / PENDING ---");
Object.entries(curMap)
  .filter(([_, v]) => v.status === "Заявка отправлена")
  .forEach(([name, v]) => console.log(`  ${name.padEnd(22)} ${v.reason || ''}`));

// NEEDS_MANUAL
console.log("\n--- NEEDS MANUAL ---");
Object.entries(curMap)
  .filter(([_, v]) => v.status === "Требуется ручное действие")
  .forEach(([name, v]) => console.log(`  ${name.padEnd(22)} ${v.reason || ''}`));

console.log("\n========================================");
console.log("TOTAL PLATFORMS");
console.log("Previous: " + Object.keys(oldMap).length);
console.log("Current:  " + Object.keys(curMap).length);
console.log("Changes:  " + changes.length);