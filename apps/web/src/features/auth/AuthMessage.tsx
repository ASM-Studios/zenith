import type { ReactNode } from 'react';
import type { MessageTone } from './message-tone.ts';

type AuthMessageProps = {
  tone: MessageTone;
  role?: 'alert' | 'status';
  children: ReactNode;
};

export function AuthMessage({ tone, role, children }: AuthMessageProps) {
  return (
    <p className={`auth-message auth-message--${tone}`} role={role}>
      {children}
    </p>
  );
}
