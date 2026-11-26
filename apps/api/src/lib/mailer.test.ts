import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMail = vi.hoisted(() => vi.fn<(message: object) => Promise<void>>(async () => undefined));
const createTransport = vi.hoisted(() => vi.fn<(url: string) => { sendMail: typeof sendMail }>(() => ({ sendMail })));

vi.mock('nodemailer', () => ({ createTransport }));

const mail = { to: 'ada@example.com', subject: 'Hello', text: 'Body' };

async function loadMailer() {
  vi.resetModules();
  return import('./mailer.ts');
}

beforeEach(() => {
  vi.unstubAllEnvs();
  createTransport.mockClear();
  sendMail.mockClear();
});

describe('sendMail', () => {
  it('sends from MAIL_FROM through the SMTP_URL transport', async () => {
    vi.stubEnv('SMTP_URL', 'smtps://user:secret@smtp.example.com:465');
    vi.stubEnv('MAIL_FROM', 'Zenith <no-reply@zenith.example>');
    const { sendMail: send } = await loadMailer();

    await send(mail);

    expect(createTransport).toHaveBeenCalledWith('smtps://user:secret@smtp.example.com:465');
    expect(sendMail).toHaveBeenCalledWith({ from: 'Zenith <no-reply@zenith.example>', ...mail });
  });

  it('opens the transport once for several mails', async () => {
    const { sendMail: send } = await loadMailer();

    await send(mail);
    await send(mail);

    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it('refuses to send when SMTP_URL is missing', async () => {
    vi.stubEnv('SMTP_URL', '');
    const { sendMail: send } = await loadMailer();

    await expect(send(mail)).rejects.toThrow(/SMTP_URL/);
    expect(createTransport).not.toHaveBeenCalled();
  });
});
