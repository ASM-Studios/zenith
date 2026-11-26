import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

export function MainNav() {
  const { t, i18n } = useTranslation();
  return (
    <nav className="site-nav" aria-label={t('nav.label')}>
      <NavLink to={`/${i18n.language}/locations`}>{t('nav.locations')}</NavLink>
    </nav>
  );
}
