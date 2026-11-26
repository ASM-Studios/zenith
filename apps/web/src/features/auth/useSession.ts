import { use } from 'react';
import { SessionContext, type SessionState } from './session-context.ts';

export function useSession(): SessionState {
  const session = use(SessionContext);
  if (!session) {
    throw new Error('useSession needs a SessionProvider');
  }
  return session;
}
