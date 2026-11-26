import { describe, expect, it } from 'vitest';
import { webVerificationLink } from './web-verification-link.ts';

const apiLink = (callbackURL?: string) => {
  const link = new URL('http://localhost:3000/api/auth/verify-email?token=abc');
  if (callbackURL !== undefined) {
    link.searchParams.set('callbackURL', callbackURL);
  }
  return link.toString();
};

describe('webVerificationLink', () => {
  it('points the mailed link to the web page given as callbackURL, with the token', () => {
    expect(webVerificationLink(apiLink('http://localhost:8080/en/verify-email'))).toBe(
      'http://localhost:8080/en/verify-email?token=abc',
    );
  });

  it.each([undefined, '/en/verify-email', 'javascript:alert(1)'])(
    'keeps the API link when the callbackURL is %s',
    (callbackURL) => {
      expect(webVerificationLink(apiLink(callbackURL))).toBe(apiLink(callbackURL));
    },
  );

  it('keeps the API link when it carries no token', () => {
    const link = 'http://localhost:3000/api/auth/verify-email?callbackURL=http%3A%2F%2Flocalhost%3A8080%2Fen';
    expect(webVerificationLink(link)).toBe(link);
  });
});
