import { useTranslation } from 'react-i18next';
import { authErrorKey, authErrorTone } from './auth-error.ts';
import { AuthMessage } from './AuthMessage.tsx';
import type { AuthActionState } from './useAuthAction.ts';

export function AuthError({ state }: { state: AuthActionState }) {
  const { t } = useTranslation();
  if (state.status !== 'failed') {
    return null;
  }
  return (
    <AuthMessage tone={authErrorTone(state.code)} role="alert">
      {t(authErrorKey(state.code))}
    </AuthMessage>
  );
}
