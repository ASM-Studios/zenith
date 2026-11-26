import { useTranslation } from 'react-i18next';
import { Navigate, Outlet } from 'react-router';
import { useSession } from '../auth/useSession.ts';

export function RequireSession() {
  const { i18n } = useTranslation();
  const { user, ready } = useSession();

  if (!ready) {
    return null;
  }
  if (!user) {
    return <Navigate to={`/${i18n.language}/sign-in`} replace />;
  }
  return <Outlet />;
}
