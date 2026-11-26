import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { currentUser, type SessionUser } from '../../api/auth.ts';
import { SessionContext } from './session-context.ts';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    currentUser()
      .then(
        (found) => setUser((signedIn) => signedIn ?? found),
        () => undefined,
      )
      .finally(() => setReady(true));
  }, []);

  const session = useMemo(() => ({ user, ready, setUser }), [user, ready]);
  return <SessionContext value={session}>{children}</SessionContext>;
}
