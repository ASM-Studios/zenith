import { describe, expect, test } from 'vitest';
import { hasErrors, maxPasswordLength, minPasswordLength, validateSignIn, validateSignUp } from './credentials.ts';

const valid = { name: 'Ada', email: 'ada@example.com', password: 'a-long-password' };

describe('validateSignIn', () => {
  test('a valid email and any non-empty password pass', () => {
    expect(validateSignIn({ email: ' ada@example.com ', password: 'x' })).toEqual({});
  });

  test('an email without a domain and an empty password are both reported', () => {
    expect(validateSignIn({ email: 'ada@example', password: '' })).toEqual({
      email: 'Enter a valid email address.',
      password: 'Enter your password.',
    });
  });
});

describe('validateSignUp', () => {
  test('valid input has no error', () => {
    expect(hasErrors(validateSignUp(valid))).toBe(false);
  });

  test('a blank name is reported on the name field', () => {
    expect(validateSignUp({ ...valid, name: '   ' })).toEqual({ name: 'Enter your name.' });
  });

  test('a password shorter than the minimum is reported and the minimum itself passes', () => {
    const tooShort = 'a'.repeat(minPasswordLength - 1);

    expect(validateSignUp({ ...valid, password: tooShort }).password).toBe('Use at least 8 characters.');
    expect(validateSignUp({ ...valid, password: tooShort + 'a' })).toEqual({});
  });

  test('a password longer than the maximum is reported and the maximum itself passes', () => {
    expect(validateSignUp({ ...valid, password: 'a'.repeat(maxPasswordLength + 1) }).password).toBe(
      'Use at most 128 characters.',
    );
    expect(validateSignUp({ ...valid, password: 'a'.repeat(maxPasswordLength) })).toEqual({});
  });

  test('every invalid field is reported at once', () => {
    expect(Object.keys(validateSignUp({ name: '', email: 'nope', password: 'short' })).toSorted()).toEqual([
      'email',
      'name',
      'password',
    ]);
  });
});
