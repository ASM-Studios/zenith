import { describe, expect, test } from 'vitest';
import { switchLanguage, withLanguagePrefix } from './localized-path.ts';

describe('withLanguagePrefix', () => {
  test('turns the root into the language home', () => {
    expect(withLanguagePrefix('/', 'fr')).toBe('/fr/');
  });

  test('prefixes a page path with the language', () => {
    expect(withLanguagePrefix('/some/page', 'en')).toBe('/en/some/page');
  });
});

describe('switchLanguage', () => {
  test('replaces the language segment and keeps the rest of the path', () => {
    expect(switchLanguage('/en/some/page', 'fr')).toBe('/fr/some/page');
    expect(switchLanguage('/en/', 'fr')).toBe('/fr/');
    expect(switchLanguage('/en', 'fr')).toBe('/fr');
  });
});
