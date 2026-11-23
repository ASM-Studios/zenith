import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';

export function Layout() {
  const { t, i18n } = useTranslation();
  return (
    <>
      <header>
        <Link to={`/${i18n.language}/`}>{t('app.name')}</Link>
        <LanguageSwitcher />
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
