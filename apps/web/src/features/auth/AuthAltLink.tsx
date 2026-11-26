import type { ReactNode } from 'react';
import { Link } from 'react-router';

export function AuthAltLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <p className="auth-card__alt">
      <Link to={to}>{children}</Link>
    </p>
  );
}
