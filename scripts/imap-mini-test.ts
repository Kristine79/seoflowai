/**
 * Минимальный IMAP-тест: подключение к Gmail, чтение INBOX.
 * Не запускает pipeline и ничего не меняет в коде регистрации.
 *
 * Использование:
 *   npx tsx scripts/imap-mini-test.ts
 */
import "dotenv/config";
import { ImapFlow } from "imapflow";

async function main() {
  const user = "itllect.marketing@gmail.com";
  const pass = process.env.IMAP_PASSWORD || process.env.EMAIL_PASS || "";

  console.log("=== IMAP MINI TEST ===");
  console.log(`Host: imap.gmail.com:993 (secure: true)`);
  console.log(`User: ${user}`);
  console.log(`Password: ${pass ? "present (" + pass.length + " chars)" : "MISSING"}`);
  console.log("");

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });
  client.on("error", () => {});

  try {
    console.log("1) Connecting...");
    await client.connect();
    console.log("   CONNECTED OK");

    console.log("2) Opening INBOX...");
    const lock = await client.getMailboxLock("INBOX");
    try {
      console.log("   INBOX locked OK");
    } finally {
      lock.release();
    }

    console.log("3) Getting message count...");
    const st = await client.status("INBOX", { messages: true, unseen: true });
    console.log(`   messages: ${st.messages}, unseen: ${st.unseen}`);

    console.log("4) Last message subject...");
    if (st.messages && st.messages > 0) {
      const last = st.messages - 1; // uid-папки: берём самое новое
      let lastSubject: string | null = null;
      for await (const msg of client.fetch(
        { uid: last },
        { envelope: true }
      )) {
        lastSubject = msg.envelope?.subject ?? null;
      }
      if (!lastSubject) {
        // fallback: берём первое из списка последних
        for await (const msg of client.fetch("1:*", { envelope: true }, { uid: false })) {
          lastSubject = msg.envelope?.subject ?? null;
        }
      }
      console.log(`   last subject: ${lastSubject ? JSON.stringify(lastSubject) : "(not readable)"}`);
    } else {
      console.log("   (no messages)");
    }

    console.log("5) Closing connection...");
    await client.logout();
    console.log("   CLOSED OK");
    console.log("");
    console.log("RESULT: IMAP OK");
    process.exit(0);
  } catch (err: any) {
    console.log("");
    console.log("RESULT: IMAP FAIL");
    console.log("Error details:");
    console.log(`  code:     ${err?.code ?? "N/A"}`);
    console.log(`  name:     ${err?.name ?? "N/A"}`);
    console.log(`  message:  ${err?.message ?? String(err)}`);
    console.log(`  responseText: ${err?.responseText ?? "N/A"}`);
    console.log(`  authenticationFailed: ${err?.authenticationFailed ?? "N/A"}`);
    try { await client.logout().catch(() => {}); } catch {}
    process.exit(1);
  }
}

main().catch((e) => {
  console.log("RESULT: IMAP FAIL");
  console.log("FATAL:", e);
  process.exit(1);
});
