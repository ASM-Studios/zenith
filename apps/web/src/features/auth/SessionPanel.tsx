import { useTranslation } from 'react-i18next';
import { type SessionUser, signOut } from '../../api/auth.ts';
import { AuthError } from './AuthError.tsx';
import { AuthMessage } from './AuthMessage.tsx';
import { useAuthAction } from './useAuthAction.ts';

type SessionPanelProps = {
  user: SessionUser;
  onSignedOut: () => void;
};

export function SessionPanel({ user, onSignedOut }: SessionPanelProps) {
  const { t } = useTranslation();
  const { state, run } = useAuthAction();

  function leave() {
    void run(async () => {
      await signOut();
      onSignedOut();
    });
  }

  return (
    <>
      <AuthMessage tone="ok" role="status">
        {t('auth.session.signedInAs', { email: user.email })}
      </AuthMessage>
      <button className="button button--secondary" type="button" onClick={leave} disabled={state.status === 'pending'}>
        {t('auth.session.signOut')}
      </button>
      <AuthError state={state} />
    </>
  );
}
