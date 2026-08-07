import { ImapFlow } from "imapflow";

export interface EmailConfig {
  user: string;
  pass: string;
  host: string;
  port: number;
}

export function getEmailConfig(): EmailConfig {
  return {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    host: process.env.EMAIL_HOST || "imap.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "993", 10),
  };
}

/**
 * Ждёт письмо с verification link от указанного отправителя/темы.
 * Polls IMAP каждые 5с до timeoutMs.
 * Возвращает первый URL, найденный в письме, или null.
 */
export async function waitForVerificationLink(
  senderPattern: string,
  subjectPattern: string,
  timeoutMs = 120000
): Promise<string | null> {
  const cfg = getEmailConfig();
  if (!cfg.user || !cfg.pass) {
    console.warn("  Email config not set — skipping email check");
    return null;
  }

  const client = new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: true,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
  });

  const seenIds = new Set<number>();

  try {
    await client.connect();
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const lock = await client.getMailboxLock("INBOX");
      try {
        for await (const msg of client.fetch({ unseen: true }, { uid: true, envelope: true, source: true })) {
          if (seenIds.has(msg.uid)) continue;
          seenIds.add(msg.uid);

          const env = msg.envelope;
          if (!env) continue;

          const from = (env.from || []).map((a: any) => (a.address || "").toLowerCase()).join(",");
          const subject = (env.subject || "").toLowerCase();

          const senderMatch = from.includes(senderPattern.toLowerCase());
          const subjectMatch = subject.includes(subjectPattern.toLowerCase());

          if (senderMatch || subjectMatch) {
            const raw = msg.source?.toString() || "";
            const urls = extractUrls(raw);
            if (urls.length > 0) {
              return urls[0];
            }
          }
        }
      } finally {
        lock.release();
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
    return null;
  } catch (err) {
    console.warn(`  Email check error: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  } finally {
    await client.logout().catch(() => {});
  }
}

/**
 * Извлекает все URL из текста письма (html + text).
 */
function extractUrls(raw: string): string[] {
  const urls: string[] = [];
  // HTML href
  const hrefRe = /href=["'](https?:\/\/[^"']+)["']/gi;
  let m;
  while ((m = hrefRe.exec(raw)) !== null) urls.push(m[1]);
  // Plain text URLs
  const textRe = /https?:\/\/[^\s<>"']+/gi;
  while ((m = textRe.exec(raw)) !== null) {
    const url = m[0];
    if (!urls.includes(url)) urls.push(url);
  }
  // Filter out tracking/analytics
  return urls.filter((u) => !u.includes("google-analytics") && !u.includes("doubleclick"));
}

/**
 * Ждёт verification code (6-8 цифр) из письма.
 */
export async function waitForVerificationCode(
  senderPattern: string,
  subjectPattern: string,
  timeoutMs = 120000
): Promise<string | null> {
  const cfg = getEmailConfig();
  if (!cfg.user || !cfg.pass) return null;

  const client = new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: true,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
  });

  const seenIds = new Set<number>();

  try {
    await client.connect();
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const lock = await client.getMailboxLock("INBOX");
      try {
        for await (const msg of client.fetch({ unseen: true }, { uid: true, envelope: true, source: true })) {
          if (seenIds.has(msg.uid)) continue;
          seenIds.add(msg.uid);

          const env = msg.envelope;
          if (!env) continue;

          const from = (env.from || []).map((a: any) => (a.address || "").toLowerCase()).join(",");
          const subject = (env.subject || "").toLowerCase();

          if (from.includes(senderPattern.toLowerCase()) || subject.includes(subjectPattern.toLowerCase())) {
            const raw = msg.source?.toString() || "";
            const codeMatch = raw.match(/(\b\d{4,8}\b)/);
            if (codeMatch) return codeMatch[1];
          }
        }
      } finally {
        lock.release();
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
    return null;
  } catch {
    return null;
  } finally {
    await client.logout().catch(() => {});
  }
}
