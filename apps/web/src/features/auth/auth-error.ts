import type { MessageTone } from './message-tone.ts';

const messageKeys = {
  INVALID_EMAIL: 'auth.errors.invalidEmail',
  PASSWORD_TOO_SHORT: 'auth.errors.passwordTooShort',
  INVALID_EMAIL_OR_PASSWORD: 'auth.errors.invalidCredentials',
  EMAIL_NOT_VERIFIED: 'auth.errors.emailNotVerified',
} as const;

type KnownCode = keyof typeof messageKeys;

export type AuthErrorKey = (typeof messageKeys)[KnownCode] | 'auth.errors.generic';

function isKnownCode(code: string): code is KnownCode {
  return Object.hasOwn(messageKeys, code);
}

export function authErrorTone(code: string | undefined): MessageTone {
  return code === 'EMAIL_NOT_VERIFIED' ? 'watch' : 'danger';
}

export function authErrorKey(code: string | undefined): AuthErrorKey {
  return code !== undefined && isKnownCode(code) ? messageKeys[code] : 'auth.errors.generic';
}
