import type { Language } from './languages.ts';

export function withLanguagePrefix(pathname: string, language: Language): string {
  return pathname === '/' ? `/${language}/` : `/${language}${pathname}`;
}

export function switchLanguage(pathname: string, language: Language): string {
  return pathname.replace(/^\/[^/]*/, `/${language}`);
}
