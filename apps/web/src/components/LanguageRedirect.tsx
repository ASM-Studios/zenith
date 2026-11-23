import { Navigate, useLocation } from 'react-router';
import { withLanguagePrefix } from '../i18n/localized-path.ts';
import { preferredLanguage } from '../i18n/preferred-language.ts';

export function LanguageRedirect() {
  const { pathname, search, hash } = useLocation();
  const pathnameInLanguage = withLanguagePrefix(pathname, preferredLanguage(navigator.languages));
  return <Navigate replace to={{ pathname: pathnameInLanguage, search, hash }} />;
}
