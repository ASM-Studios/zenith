import { describe, expect, test } from 'vitest';
import { detectLanguage } from './languages.ts';

describe('detectLanguage', () => {
  test('picks the first supported language, ignoring the region', () => {
    expect(detectLanguage(['de-DE', 'fr-CA', 'en-US'])).toBe('fr');
  });

  test('matches language tags case-insensitively', () => {
    expect(detectLanguage(['FR'])).toBe('fr');
  });

  test('falls back to English when no preferred language is supported', () => {
    expect(detectLanguage(['de', 'ja'])).toBe('en');
    expect(detectLanguage([])).toBe('en');
  });

  test('does not mistake a longer language code for a supported prefix', () => {
    expect(detectLanguage(['fro', 'fr'])).toBe('fr');
  });
});
