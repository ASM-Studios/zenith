export const supportedLanguages = ['en', 'fr'] as const;

export type Language = (typeof supportedLanguages)[number];

export const fallbackLanguage: Language = 'en';

export const languageNames: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
};

export function parseLanguage(value: string | undefined): Language | undefined {
  return supportedLanguages.find((code) => code === value);
}

function supportedLanguageOf(tag: string): Language | undefined {
  const lower = tag.toLowerCase();
  return supportedLanguages.find((code) => lower === code || lower.startsWith(`${code}-`));
}

export function detectLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const language = supportedLanguageOf(tag);
    if (language) {
      return language;
    }
  }
  return fallbackLanguage;
}
