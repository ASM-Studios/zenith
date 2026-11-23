import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';

export function Layout() {
  const { t } = useTranslation();
  return (
    <>
      <header>
        <Link to="/">{t('app.name')}</Link>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
