import { hash, verify } from '@node-rs/argon2';

const pepper = process.env.PASSWORD_PEPPER;
if (!pepper || pepper.length < 32) {
  throw new Error('PASSWORD_PEPPER must be set to at least 32 characters');
}
const secret = Buffer.from(pepper);

export function hashPassword(password: string): Promise<string> {
  return hash(password, { secret });
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password, { secret });
}
