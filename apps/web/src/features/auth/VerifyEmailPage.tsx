import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { authErrorCode, verifyEmail } from '../../api/auth.ts';
import { AuthCard } from './AuthCard.tsx';
import { AuthMessage } from './AuthMessage.tsx';
import { signInAfterVerification } from './verification-link.ts';

export function VerifyEmailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const token = new URLSearchParams(useLocation().search).get('token') ?? '';
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    const leave = (error?: string) => navigate(signInAfterVerification(i18n.language, error), { replace: true });
    void verifyEmail(token).then(
      () => leave(),
      (error: unknown) => leave(authErrorCode(error) ?? 'INVALID_TOKEN'),
    );
  }, [token, navigate, i18n.language]);

  return (
    <AuthCard>
      <AuthMessage tone="neutral" role="status">
        {t('auth.notice.verifying')}
      </AuthMessage>
    </AuthCard>
  );
}
