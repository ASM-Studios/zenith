import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Outlet, useParams } from 'react-router';
import { i18nFor } from '../i18n/i18n.ts';
import { parseLanguage } from '../i18n/languages.ts';
import { rememberLanguage } from '../i18n/preferred-language.ts';
import { LanguageRedirect } from './LanguageRedirect.tsx';

export function LanguageRoute() {
  const language = parseLanguage(useParams().lang);

  useEffect(() => {
    if (language) {
      document.documentElement.lang = language;
      rememberLanguage(language);
    }
  }, [language]);

  if (!language) {
    return <LanguageRedirect />;
  }
  return (
    <I18nextProvider i18n={i18nFor(language)}>
      <Outlet />
    </I18nextProvider>
  );
}
