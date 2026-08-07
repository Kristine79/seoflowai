/**
 * audit-inbox.ts — READ-ONLY скан почты itllect.marketing@gmail.com.
 * Выводит отправителя/тему/дату всех писем (envelope only — письма НЕ помечаются прочитанными).
 * Цель: доказательства созданных аккаунтов + список pending email-verification.
 *
 * Run: npx tsx scripts/audit-inbox.ts
 */
import "dotenv/config";
import { ImapFlow } from "imapflow";
import { getEmailConfig } from "../src/lib/automation/email-verifier";

async function main() {
  const cfg = getEmailConfig();
  if (!cfg.user || !cfg.pass) {
    console.error("EMAIL_USER/EMAIL_PASS not set in .env");
    process.exit(1);
  }
  console.log(`Connecting to ${cfg.host} as ${cfg.user}...`);

  const client = new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: true,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  try {
    const status = await client.status("INBOX", { messages: true, unseen: true });
    console.log(`INBOX: ${status.messages} messages, ${status.unseen} unseen\n`);

    const rows: { date: string; from: string; subject: string; unseen: boolean }[] = [];
    for await (const msg of client.fetch("1:*", { uid: true, envelope: true, flags: true })) {
      const env = msg.envelope;
      if (!env) continue;
      const from = (env.from || [])
        .map((a) => `${a.name || ""} <${a.address || ""}>`)
        .join(", ");
      rows.push({
        date: env.date ? new Date(env.date).toISOString().slice(0, 16) : "?",
        from: from.slice(0, 60),
        subject: (env.subject || "").slice(0, 90),
        unseen: !(msg.flags?.has("\\Seen") ?? false),
      });
    }
    rows.sort((a, b) => a.date.localeCompare(b.date));
    for (const r of rows) {
      console.log(`${r.unseen ? "●" : " "} ${r.date} | ${r.from} | ${r.subject}`);
    }
    console.log(`\nTotal: ${rows.length}`);
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
}

main().catch((e) => {
  console.error("FATAL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
