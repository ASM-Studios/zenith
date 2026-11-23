import { describe, expect, test } from 'vitest';
import { createI18n, i18nFor, resources } from './i18n.ts';

function keysOf(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null ? keysOf(child, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe('createI18n', () => {
  test('translates synchronously in the requested language', () => {
    expect(createI18n('fr').t('notFound.title')).toBe('Page introuvable');
    expect(createI18n('en').t('notFound.title')).toBe('Page not found');
  });

  test('every locale defines the same keys as English', () => {
    const english = keysOf(resources.en.translation).toSorted();
    for (const { translation } of Object.values(resources)) {
      expect(keysOf(translation).toSorted()).toEqual(english);
    }
  });
});

describe('i18nFor', () => {
  test('reuses one instance per language', () => {
    expect(i18nFor('fr')).toBe(i18nFor('fr'));
    expect(i18nFor('fr')).not.toBe(i18nFor('en'));
    expect(i18nFor('fr').language).toBe('fr');
  });
});
