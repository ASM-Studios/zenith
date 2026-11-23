import { createInstance } from 'i18next';
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
