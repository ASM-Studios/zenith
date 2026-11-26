import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { signOut } from '../../api/auth.ts';
import { AuthCard } from '../auth/AuthCard.tsx';
import { AuthError } from '../auth/AuthError.tsx';
import { useAuthAction } from '../auth/useAuthAction.ts';
import { useSession } from '../auth/useSession.ts';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useSession();
  const action = useAuthAction();

  function leave() {
    void action.run(async () => {
      await signOut();
      setUser(null);
    });
  }

  return (
    <AuthCard>
      <h1>{t('settings.title')}</h1>
      <section className="settings-section" aria-labelledby="settings-account">
        <h2 className="settings-section__title" id="settings-account">
          {t('settings.account.title')}
        </h2>
        <dl className="settings-list">
          <dt>{t('settings.account.name')}</dt>
          <dd>{user?.name}</dd>
          <dt>{t('settings.account.email')}</dt>
          <dd className="settings-list__email">
            {user?.email}
            <span className={`badge badge--${user?.emailVerified ? 'ok' : 'watch'}`}>
              {t(user?.emailVerified ? 'settings.account.verified' : 'settings.account.unverified')}
            </span>
          </dd>
        </dl>
      </section>
      <section className="settings-section">
        <h2 className="settings-section__title">{t('settings.session.title')}</h2>
        <div className="settings-actions">
          <button
            className="button button--secondary"
            type="button"
            onClick={leave}
            disabled={action.state.status === 'pending'}
          >
            {t('settings.session.signOut')}
          </button>
          <AuthError state={action.state} />
        </div>
      </section>
      <section className="settings-section">
        <h2 className="settings-section__title">{t('settings.danger.title')}</h2>
        <Link className="button button--danger" to={`/${i18n.language}/settings/delete-account`}>
          {t('settings.danger.deleteAccount')}
        </Link>
      </section>
    </AuthCard>
  );
}
