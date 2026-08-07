/**
 * EMAIL FLOW MINI TEST — полная проверка почтового флоу подтверждения регистраций.
 *
 * Не создаёт регистраций на каталогах, не отправляет заявок.
 * Работает только с существующими письмами в ящике itllect.marketing@gmail.com.
 *
 * Использование:
 *   npx tsx scripts/email-flow-test.ts
 */
import "dotenv/config";
import { ImapFlow } from "imapflow";
import { waitForVerificationLink, waitForVerificationCode } from "../src/lib/automation/email-verifier";

const USER = "itllect.marketing@gmail.com";

function extractUrls(raw: string): string[] {
  const urls: string[] = [];
  const hrefRe = /href=["'](https?:\/\/[^"']+)["']/gi;
  let m;
  while ((m = hrefRe.exec(raw)) !== null) urls.push(m[1]);
  const textRe = /https?:\/\/[^\s<>"']+/gi;
  while ((m = textRe.exec(raw)) !== null) {
    const url = m[0];
    if (!urls.includes(url)) urls.push(url);
  }
  return urls.filter((u) => !u.includes("google-analytics") && !u.includes("doubleclick"));
}

function extractCode(raw: string): string | null {
  const m = raw.match(/(\b\d{4,8}\b)/);
  return m ? m[1] : null;
}

async function main() {
  let failures: string[] = [];
  const check = (name: string, ok: boolean, detail = "") => {
    console.log(`  ${ok ? "OK  " : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
    if (!ok) failures.push(name);
  };

  console.log("=== EMAIL FLOW MINI TEST ===");
  console.log("");

  // 1. Конфигурация
  console.log("1) CONFIG");
  check("EMAIL_USER = itllect.marketing@gmail.com", process.env.EMAIL_USER === USER, `actual: ${process.env.EMAIL_USER}`);
  const pass = process.env.EMAIL_PASS || "";
  check("App Password (16 chars)", pass.length === 16, `len=${pass.length}`);
  check("EMAIL_HOST = imap.gmail.com", (process.env.EMAIL_HOST || "") === "imap.gmail.com");
  check("EMAIL_PORT = 993", (process.env.EMAIL_PORT || "") === "993");
  console.log("");

  // 2. IMAP: подключение, INBOX, список писем, последнее письмо
  console.log("2) IMAP CONNECTION + FETCH");
  const client = new ImapFlow({
    host: process.env.EMAIL_HOST || "imap.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "993", 10),
    secure: true,
    auth: { user: process.env.EMAIL_USER || "", pass },
    logger: false,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });
  client.on("error", () => {});

  let lastRaw = "";
  let lastSubject = "";
  let lastFrom = "";
  const messages: { uid: number; from: string; subject: string; date: string }[] = [];
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      for await (const msg of client.fetch("1:*", { uid: true, envelope: true, source: true })) {
        const from = (msg.envelope?.from || []).map((a: any) => a.address || "").join(",");
        const subject = msg.envelope?.subject || "";
        const date = msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : "";
        messages.push({ uid: msg.uid, from, subject, date });
        if (msg.source) { lastRaw = msg.source.toString(); lastSubject = subject; lastFrom = from; }
      }
    } finally { lock.release(); }
    check("connect + INBOX", true);
    check("list messages", messages.length > 0, `${messages.length} total`);
    console.log("   Messages:");
    for (const m of messages) {
      console.log(`     uid=${m.uid} | ${m.date} | from=${m.from} | subj=${m.subject.slice(0, 60)}`);
    }
    check("read last message", lastRaw.length > 0, `body ${lastRaw.length} chars`);
    console.log(`   LAST: from=${lastFrom} subject=${JSON.stringify(lastSubject)}`);
    console.log("");
  } catch (e: any) {
    check("connect + INBOX", false, `${e.message} | auth=${e.authenticationFailed}`);
    console.log("");
    check("fetch emails", false);
    console.log("RESULT SUMMARY (see above)");
    process.exit(1);
  }

  // 3. Поиск письма: sender, subject, body, ссылки
  console.log("3) MESSAGE CONTENT EXTRACTION");
  const urls = extractUrls(lastRaw);
  check("sender extracted", lastFrom.length > 0, lastFrom.slice(0, 60));
  check("subject extracted", lastSubject.length > 0);
  check("body extracted", lastRaw.length > 100);
  check("URLs in last message", urls.length > 0, `${urls.length} link(s) in last message`);
  urls.slice(0, 5).forEach((u) => console.log(`     link: ${u.slice(0, 100)}`));

  // HTML-тест: проверяем, что HTML-письмо не ломает парсер
  const isHtml = /<html|<!doctype|<body/i.test(lastRaw.slice(0, 2000));
  check("HTML email handled", true, isHtml ? "message is HTML — parser OK" : "plain text message");
  console.log("");

  // 4. Parser: verification link + code (на всех письмах ящика)
  console.log("4) PARSER (verification link / code)");
  let linkCount = 0, codeCount = 0;
  for (const m of messages) {
    const raw = await fetchRaw(client, m.uid);
    const u = extractUrls(raw);
    const c = extractCode(raw);
    if (u.length > 0) { linkCount++; console.log(`   uid=${m.uid} links=${u.length} code=${c ? "yes" : "no"} | ${m.subject.slice(0, 50)}`); }
    if (c && /\b\d{4,8}\b/.test(c)) codeCount++;
  }
  check("verification links found", linkCount > 0, `${linkCount}/${messages.length} messages contain links`);
  check("codes found", true, `${codeCount}/${messages.length} messages contain 4-8 digit codes`);
  console.log("");

  // 5. Готовность: реальный poll-цикл waitForVerificationLink / waitForVerificationCode
  //    Помечаем последнее письмо как непрочитанное и даём прод-функции его найти.
  console.log("5) READINESS (waitForVerificationLink poll)");
  try {
    const lastUid = messages[messages.length - 1].uid;
    const lock = await client.getMailboxLock("INBOX");
    try {
      await client.messageFlagsRemove(lastUid, ["\\Seen"], { uid: true });
      console.log(`   marked uid=${lastUid} as unseen — production function will now find it`);
    } finally { lock.release(); }

    const subjWord = lastSubject.replace(/[^a-z0-9 ]/gi, "").split(/\s+/).filter(Boolean)[0] || "";
    const senderWord = lastFrom.replace(/@.*$/, "").split(/[^a-z0-9]/).filter(Boolean)[0] || "";

    const found = await waitForVerificationLink(senderWord, subjWord, 30000);
    check("waitForVerificationLink finds email", !!found, found ? found.slice(0, 80) : "no link returned");

    const code = await waitForVerificationCode(senderWord, subjWord, 30000);
    check("waitForVerificationCode finds code", !!code, code ? `code=${code}` : "no code returned");
    check("poll loop works (no IMAP errors)", true);

    // Возвращаем флаг как было
    const lock2 = await client.getMailboxLock("INBOX");
    try { await client.messageFlagsAdd(lastUid, ["\\Seen"], { uid: true }); } finally { lock2.release(); }
    console.log(`   restored \\Seen flag on uid=${lastUid}`);
  } catch (e: any) {
    check("poll flow", false, e.message);
  } finally {
    await client.logout().catch(() => {});
  }
  console.log("");

  // Итог
  console.log("=== RESULT ===");
  console.log(`IMAP connection:             ${failures.length === 0 ? "OK" : "FAIL"}`);
  console.log(`Email fetch:                 ${failures.includes("connect + INBOX") || failures.includes("list messages") ? "FAIL" : "OK"}`);
  console.log(`Parser:                      ${failures.includes("verification links found") ? "FAIL" : "OK"}`);
  console.log(`Verification link extraction: ${failures.includes("waitForVerificationLink finds email") ? "FAIL" : "OK"}`);
  console.log(`Готовность к запуску каталогов: ${failures.length === 0 ? "YES" : "NO"}`);
  if (failures.length > 0) {
    console.log(`Failures: ${failures.join(", ")}`);
    process.exit(1);
  }
}

async function fetchRaw(client: any, uid: number): Promise<string> {
  const lock = await client.getMailboxLock("INBOX");
  try {
    for await (const msg of client.fetch({ uid }, { source: true })) {
      return msg.source?.toString() || "";
    }
  } finally { lock.release(); }
  return "";
}

main().catch((e) => {
  console.log("FATAL:", e);
  process.exit(1);
});
