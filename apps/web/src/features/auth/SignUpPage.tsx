import { useTranslation } from 'react-i18next';
import { signUp } from '../../api/auth.ts';
import { AuthAltLink } from './AuthAltLink.tsx';
import { AuthCard } from './AuthCard.tsx';
import { AuthForm } from './AuthForm.tsx';
import { AuthMessage } from './AuthMessage.tsx';
import { textValue } from './form-text.ts';
import { TextField } from './TextField.tsx';
import { useAuthAction } from './useAuthAction.ts';
import { verificationCallback } from './verification-link.ts';

export function SignUpPage() {
  const { t, i18n } = useTranslation();
  const action = useAuthAction();

  function submit(form: FormData) {
    return signUp({
      name: textValue(form, 'name'),
      email: textValue(form, 'email'),
      password: textValue(form, 'password'),
      callbackURL: verificationCallback(window.location.origin, i18n.language),
    });
  }

  return (
    <AuthCard>
      <h1>{t('auth.signUp.title')}</h1>
      {action.state.status === 'done' ? (
        <AuthMessage tone="ok" role="status">
          {t('auth.signUp.checkInbox')}
        </AuthMessage>
      ) : (
        <AuthForm action={action} submitLabel={t('auth.signUp.submit')} onSubmit={submit}>
          <TextField label={t('auth.fields.name')} name="name" type="text" autoComplete="name" />
          <TextField label={t('auth.fields.email')} name="email" type="email" autoComplete="email" />
          <TextField label={t('auth.fields.password')} name="password" type="password" autoComplete="new-password" />
        </AuthForm>
      )}
      <AuthAltLink to={`/${i18n.language}/sign-in`}>{t('auth.signUp.haveAccount')}</AuthAltLink>
    </AuthCard>
  );
}
