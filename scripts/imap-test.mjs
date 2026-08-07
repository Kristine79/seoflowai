import 'dotenv/config';
import { ImapFlow } from 'imapflow';
const pass = process.env.EMAIL_PASS || '';
for (let i = 1; i <= 4; i++) {
  console.log(`--- attempt ${i} ---`);
  const c = new ImapFlow({
    host: 'imap.gmail.com', port: 993, secure: true,
    auth: { user: process.env.EMAIL_USER, pass },
    logger: false,
    connectionTimeout: 60000, greetingTimeout: 60000, socketTimeout: 120000,
  });
  c.on('error', () => {});
  try {
    await c.connect();
    console.log('CONNECTED OK');
    const st = await c.status('INBOX', { messages: true, unseen: true });
    console.log('INBOX:', st.messages, 'messages,', st.unseen, 'unseen');
    await c.logout();
    process.exit(0);
  } catch (e) {
    console.log('ERR:', e.code || e.name, '|', (e.message || '').slice(0, 120), '| resp:', e.responseText, '| auth:', e.authenticationFailed);
  }
}
