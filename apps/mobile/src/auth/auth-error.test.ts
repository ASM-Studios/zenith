import { describe, expect, test } from 'vitest';
import { AuthError, authErrorMessage, errorKindOf } from './auth-error.ts';

describe('errorKindOf', () => {
  test('a 401 is a wrong email or password', () => {
    expect(errorKindOf(401, '{"code":"INVALID_EMAIL_OR_PASSWORD"}')).toBe('invalid-credentials');
  });

  test('an already used email is reported whatever the status', () => {
    expect(errorKindOf(422, '{"code":"USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"}')).toBe('email-taken');
  });

  test('other statuses and unreadable bodies are unknown', () => {
    expect(errorKindOf(500, 'oops')).toBe('unknown');
    expect(errorKindOf(400, '{"code":42}')).toBe('unknown');
  });
});

describe('authErrorMessage', () => {
  test('each error kind has its own message', () => {
    const messages = (['invalid-credentials', 'email-taken', 'network', 'unknown'] as const).map((kind) =>
      authErrorMessage(new AuthError(kind)),
    );

    expect(new Set(messages).size).toBe(4);
  });

  test('an error that is not an AuthError gets the unknown message', () => {
    expect(authErrorMessage(new TypeError('boom'))).toBe(authErrorMessage(new AuthError('unknown')));
  });
});
