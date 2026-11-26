import type { FormEvent, ReactNode } from 'react';
import { AuthError } from './AuthError.tsx';
import type { AuthAction } from './useAuthAction.ts';

type AuthFormProps = {
  action: AuthAction;
  submitLabel: string;
  onSubmit: (form: FormData) => Promise<void>;
  children: ReactNode;
};

export function AuthForm({ action, submitLabel, onSubmit, children }: AuthFormProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void action.run(() => onSubmit(form));
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {children}
      <button className="button button--primary" type="submit" disabled={action.state.status === 'pending'}>
        {submitLabel}
      </button>
      <AuthError state={action.state} />
    </form>
  );
}
