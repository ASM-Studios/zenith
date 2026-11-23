import { createInstance, type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { fallbackLanguage, type Language } from './languages.ts';
import en from './locales/en.json';
import fr from './locales/fr.json';

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

export function createI18n(language: Language) {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: fallbackLanguage,
    resources,
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  return instance;
}

const instances = new Map<Language, i18n>();

export function i18nFor(language: Language): i18n {
  const existing = instances.get(language);
  if (existing) {
    return existing;
  }
  const created = createI18n(language);
  instances.set(language, created);
  return created;
}
