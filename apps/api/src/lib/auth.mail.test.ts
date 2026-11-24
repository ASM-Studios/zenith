import { describe, expect, it } from 'vitest';
import { existingAccountMail, verificationMail } from './auth.mail.ts';

const user = { email: 'ada@example.com', name: 'Ada' };

describe('verificationMail', () => {
  it('addresses the user and carries the verification link', () => {
    const mail = verificationMail(user, 'http://localhost:3000/api/auth/verify-email?token=abc');

    expect(mail.to).toBe(user.email);
    expect(mail.text).toContain('Hello Ada');
    expect(mail.text).toContain('http://localhost:3000/api/auth/verify-email?token=abc');
  });
});

describe('existingAccountMail', () => {
  it('tells the owner about the attempt without any link', () => {
    const mail = existingAccountMail(user);

    expect(mail.to).toBe(user.email);
    expect(mail.text).toContain('already has a Zenith account');
    expect(mail.text).not.toMatch(/https?:\/\//);
  });
});
