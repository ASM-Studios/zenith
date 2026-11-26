import { inject, vi } from 'vitest';

process.env.DATABASE_URL = inject('databaseUrl');

vi.mock('../src/lib/mailer.ts', async () => {
  const { outbox } = await import('./helpers/outbox.ts');
  return { sendMail: async (mail: (typeof outbox)[number]) => void outbox.push(mail) };
});
