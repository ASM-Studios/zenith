import { detectLanguage, type Language, parseLanguage } from './languages.ts';

const storageKey = 'zenith.language';

export function storedLanguage(): Language | undefined {
  try {
    return parseLanguage(localStorage.getItem(storageKey) ?? undefined);
  } catch {
    return undefined;
  }
}

export function rememberLanguage(language: Language): boolean {
  try {
    localStorage.setItem(storageKey, language);
    return true;
  } catch {
    return false;
  }
}

export function preferredLanguage(browserLanguages: readonly string[]): Language {
  return storedLanguage() ?? detectLanguage(browserLanguages);
}
