import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { signIn } from '../../api/auth.ts';
import { AuthAltLink } from './AuthAltLink.tsx';
import { AuthCard } from './AuthCard.tsx';
import { AuthForm } from './AuthForm.tsx';
import { AuthMessage } from './AuthMessage.tsx';
import { textValue } from './form-text.ts';
import { TextField } from './TextField.tsx';
import { useAuthAction } from './useAuthAction.ts';
import { useSession } from './useSession.ts';
import { verificationCallback, verificationNotice, verificationNoticeTone } from './verification-link.ts';

export function SignInPage() {
  const { t, i18n } = useTranslation();
  const notice = verificationNotice(useLocation().search);
  const { user, setUser } = useSession();
  const action = useAuthAction();

  async function submit(form: FormData) {
    const signedIn = await signIn({
      email: textValue(form, 'email'),
      password: textValue(form, 'password'),
      callbackURL: verificationCallback(window.location.origin, i18n.language),
    });
    setUser(signedIn);
  }

  return (
    <AuthCard>
      <h1>{t('auth.signIn.title')}</h1>
      {notice && <AuthMessage tone={verificationNoticeTone(notice)}>{t(`auth.notice.${notice}`)}</AuthMessage>}
      {user ? (
        <>
          <AuthMessage tone="ok" role="status">
            {t('auth.session.signedInAs', { email: user.email })}
          </AuthMessage>
          <Link className="button button--secondary" to={`/${i18n.language}/settings`}>
            {t('auth.session.openSettings')}
          </Link>
        </>
      ) : (
        <AuthForm action={action} submitLabel={t('auth.signIn.submit')} onSubmit={submit}>
          <TextField label={t('auth.fields.email')} name="email" type="email" autoComplete="email" />
          <TextField
            label={t('auth.fields.password')}
            name="password"
            type="password"
            autoComplete="current-password"
          />
        </AuthForm>
      )}
      <AuthAltLink to={`/${i18n.language}/sign-up`}>{t('auth.signIn.noAccount')}</AuthAltLink>
    </AuthCard>
  );
}
