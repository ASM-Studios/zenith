import type { Mail } from '../../src/lib/mailer.ts';

export const outbox: Mail[] = [];

export function clearOutbox() {
  outbox.length = 0;
}

export function mailsTo(email: string) {
  return outbox.filter((mail) => mail.to === email);
}

export function lastLink(email: string) {
  const text = mailsTo(email).at(-1)?.text ?? '';
  return text.match(/https?:\/\/\S+/)?.[0] ?? '';
}
