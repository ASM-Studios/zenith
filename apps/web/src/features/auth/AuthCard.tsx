import type { ReactNode } from 'react';

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <section className="auth-card">{children}</section>
    </div>
  );
}
