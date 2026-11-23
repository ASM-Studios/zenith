import { afterEach, describe, expect, test, vi } from 'vitest';
import { preferredLanguage, rememberLanguage, storedLanguage } from './preferred-language.ts';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

function failingStorage() {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('storage disabled');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('storage disabled');
  });
}

describe('preferredLanguage', () => {
  test('uses the browser language when none is remembered', () => {
    expect(preferredLanguage(['fr-FR'])).toBe('fr');
  });

  test('prefers the remembered language over the browser language', () => {
    rememberLanguage('fr');
    expect(preferredLanguage(['en-US'])).toBe('fr');
  });

  test('ignores a remembered value that is not a supported language', () => {
    localStorage.setItem('zenith.language', 'de');
    expect(storedLanguage()).toBeUndefined();
    expect(preferredLanguage(['en'])).toBe('en');
  });

  test('falls back to the browser language when storage is unavailable', () => {
    failingStorage();
    expect(rememberLanguage('fr')).toBe(false);
    expect(preferredLanguage(['en'])).toBe('en');
  });
});
