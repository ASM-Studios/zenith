import { describe, expect, test } from 'vitest';
import { parseSessionUser } from './session-user.ts';

const user = { id: 'u1', email: 'a@b.co', name: 'Ada' };

describe('parseSessionUser', () => {
  test('keeps only the id, email and name of the user in the response', () => {
    expect(parseSessionUser({ token: 't', user: { ...user, image: null, emailVerified: false } })).toEqual(user);
  });

  test('a null response is no user', () => {
    expect(parseSessionUser(null)).toBeNull();
  });

  test('a response without a user, or with an incomplete one, is no user', () => {
    expect(parseSessionUser({ session: {} })).toBeNull();
    expect(parseSessionUser({ user: { id: 'u1', email: 'a@b.co' } })).toBeNull();
    expect(parseSessionUser({ user: { id: 1, email: 'a@b.co', name: 'Ada' } })).toBeNull();
  });
});
