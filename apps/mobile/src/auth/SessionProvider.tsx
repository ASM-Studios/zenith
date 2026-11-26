import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/api.ts';
import type { SignInInput, SignUpInput } from './credentials.ts';
import type { SessionUser } from './session-user.ts';

export type SessionState = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; user: SessionUser };

type SessionContextValue = {
  state: SessionState;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const signedOut: SessionState = { status: 'signedOut' };

const signedIn = (user: SessionUser): SessionState => ({ status: 'signedIn', user });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    let current = true;
    void authApi
      .getSession()
      .then((user) => (user === null ? signedOut : signedIn(user)))
      .catch(() => signedOut)
      .then((next) => {
        if (current) {
          setState(next);
        }
      });
    return () => {
      current = false;
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      signIn: async (input) => setState(signedIn(await authApi.signIn(input))),
      signUp: async (input) => setState(signedIn(await authApi.signUp(input))),
      signOut: async () => {
        await authApi.signOut();
        setState(signedOut);
      },
    }),
    [state],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return value;
}
