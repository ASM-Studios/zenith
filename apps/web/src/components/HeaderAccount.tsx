import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router';
import { useSession } from '../features/auth/useSession.ts';

export function HeaderAccount() {
  const { t, i18n } = useTranslation();
  const { user, ready } = useSession();

  if (!ready) {
    return null;
  }
  if (user) {
    return (
      <Link className="site-profile" to={`/${i18n.language}/settings`}>
        {user.name}
      </Link>
    );
  }
  return (
    <nav className="site-nav" aria-label={t('auth.nav.label')}>
      <NavLink to={`/${i18n.language}/sign-in`}>{t('auth.nav.signIn')}</NavLink>
      <NavLink to={`/${i18n.language}/sign-up`}>{t('auth.nav.signUp')}</NavLink>
    </nav>
  );
}
