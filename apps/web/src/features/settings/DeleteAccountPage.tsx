import { useTranslation } from 'react-i18next';
import { deleteAccount } from '../../api/auth.ts';
import { AuthAltLink } from '../auth/AuthAltLink.tsx';
import { AuthCard } from '../auth/AuthCard.tsx';
import { AuthForm } from '../auth/AuthForm.tsx';
import { textValue } from '../auth/form-text.ts';
import { TextField } from '../auth/TextField.tsx';
import { useAuthAction } from '../auth/useAuthAction.ts';
import { useSession } from '../auth/useSession.ts';

export function DeleteAccountPage() {
  const { t, i18n } = useTranslation();
  const { setUser } = useSession();
  const action = useAuthAction();

  async function submit(form: FormData) {
    await deleteAccount(textValue(form, 'password'));
    setUser(null);
  }

  return (
    <AuthCard>
      <h1>{t('settings.delete.title')}</h1>
      <p className="settings-warning">{t('settings.delete.warning')}</p>
      <AuthForm action={action} submitLabel={t('settings.delete.submit')} tone="danger" onSubmit={submit}>
        <TextField label={t('auth.fields.password')} name="password" type="password" autoComplete="current-password" />
      </AuthForm>
      <AuthAltLink to={`/${i18n.language}/settings`}>{t('settings.delete.cancel')}</AuthAltLink>
    </AuthCard>
  );
}
