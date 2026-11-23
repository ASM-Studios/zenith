import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/password.ts';

describe('password hashing', () => {
  it('verifies the password that was hashed', async () => {
    const hash = await hashPassword('correct horse battery');

    await expect(verifyPassword(hash, 'correct horse battery')).resolves.toBe(true);
  });

  it('rejects a different password', async () => {
    const hash = await hashPassword('correct horse battery');

    await expect(verifyPassword(hash, 'wrong password')).resolves.toBe(false);
  });

  it('produces a different hash on each call for the same password', async () => {
    const [first, second] = await Promise.all([hashPassword('same'), hashPassword('same')]);

    expect(first).not.toBe(second);
  });
});
