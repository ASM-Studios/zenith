import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { languageNames, supportedLanguages } from '../i18n/languages.ts';
import { switchLanguage } from '../i18n/localized-path.ts';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { pathname, search, hash } = useLocation();
  return (
    <nav aria-label={t('language.label')}>
      {supportedLanguages.map((code) => (
        <Link
          key={code}
          to={{ pathname: switchLanguage(pathname, code), search, hash }}
          lang={code}
          hrefLang={code}
          aria-current={code === i18n.language ? 'true' : undefined}
        >
          {languageNames[code]}
        </Link>
      ))}
    </nav>
  );
}
