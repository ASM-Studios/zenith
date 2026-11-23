import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function NotFoundPage() {
  const { t, i18n } = useTranslation();
  return (
    <>
      <h1>{t('notFound.title')}</h1>
      <Link to={`/${i18n.language}/`}>{t('notFound.backHome')}</Link>
    </>
  );
}
