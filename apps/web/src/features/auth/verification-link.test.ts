import { describe, expect, test } from 'vitest';
import { authErrorKey, authErrorTone } from './auth-error.ts';
import {
  signInAfterVerification,
  verificationCallback,
  verificationNotice,
  verificationNoticeTone,
} from './verification-link.ts';

describe('verification link', () => {
  test('the mailed link opens the verify-email page of the web origin and the given language', () => {
    expect(verificationCallback('http://localhost:8080', 'fr')).toBe('http://localhost:8080/fr/verify-email');
  });

  test('after the token check, the sign-in page gets the outcome the notice reads', () => {
    expect(verificationNotice(signInAfterVerification('fr').split('?')[1] ?? '')).toBe('verified');
    expect(signInAfterVerification('fr', 'TOKEN_EXPIRED')).toBe('/fr/sign-in?verified=1&error=TOKEN_EXPIRED');
  });

  test('the notice reads the redirect Better Auth makes after the link', () => {
    expect(verificationNotice('?verified=1')).toBe('verified');
    expect(verificationNotice('?verified=1&error=TOKEN_EXPIRED')).toBe('expired');
    expect(verificationNotice('?verified=1&error=INVALID_TOKEN')).toBe('invalid');
    expect(verificationNotice('?error=USER_NOT_FOUND')).toBe('invalid');
    expect(verificationNotice('')).toBeUndefined();
  });
});

describe('message tones', () => {
  test('a confirmed address is ok, an expired link a watch and an invalid link a danger', () => {
    expect(verificationNoticeTone('verified')).toBe('ok');
    expect(verificationNoticeTone('expired')).toBe('watch');
    expect(verificationNoticeTone('invalid')).toBe('danger');
  });

  test('an unverified address is a watch and every other failure a danger', () => {
    expect(authErrorTone('EMAIL_NOT_VERIFIED')).toBe('watch');
    expect(authErrorTone('INVALID_EMAIL_OR_PASSWORD')).toBe('danger');
    expect(authErrorTone(undefined)).toBe('danger');
  });
});

describe('authErrorKey', () => {
  test('maps the known Better Auth codes and falls back to the generic message', () => {
    expect(authErrorKey('INVALID_EMAIL_OR_PASSWORD')).toBe('auth.errors.invalidCredentials');
    expect(authErrorKey('toString')).toBe('auth.errors.generic');
    expect(authErrorKey(undefined)).toBe('auth.errors.generic');
  });
});
