export const supportedLanguages = ['en', 'fr'] as const;

export type Language = (typeof supportedLanguages)[number];

export const fallbackLanguage: Language = 'en';

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
