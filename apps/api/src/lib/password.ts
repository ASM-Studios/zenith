import { hash, verify } from '@node-rs/argon2';
import { authEnv, parseEnv } from './env.ts';

const { PASSWORD_PEPPER } = parseEnv(authEnv.pick({ PASSWORD_PEPPER: true }), process.env);
const secret = Buffer.from(PASSWORD_PEPPER);

export function hashPassword(password: string): Promise<string> {
  return hash(password, { secret });
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password, { secret });
}
