import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';
import { SessionProvider } from '../features/auth/SessionProvider.tsx';
import { FavoritesProvider } from '../features/locations/FavoritesProvider.tsx';
import { HeaderAccount } from './HeaderAccount.tsx';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';
import { MainNav } from './MainNav.tsx';

export function Layout() {
  const { t, i18n } = useTranslation();
  return (
    <SessionProvider>
      <FavoritesProvider>
        <header className="site-header">
          <Link className="site-brand" to={`/${i18n.language}/`}>
            {t('app.name')}
          </Link>
          <div className="site-header__actions">
            <MainNav />
            <HeaderAccount />
            <LanguageSwitcher />
          </div>
        </header>
        <main className="site-main">
          <Outlet />
        </main>
      </FavoritesProvider>
    </SessionProvider>
  );
}
