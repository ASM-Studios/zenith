import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';
import { SessionProvider } from '../features/auth/SessionProvider.tsx';
import { HeaderAccount } from './HeaderAccount.tsx';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';

export function Layout() {
  const { t, i18n } = useTranslation();
  return (
    <SessionProvider>
      <header className="site-header">
        <Link className="site-brand" to={`/${i18n.language}/`}>
          {t('app.name')}
        </Link>
        <div className="site-header__actions">
          <HeaderAccount />
          <LanguageSwitcher />
        </div>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
    </SessionProvider>
  );
}
