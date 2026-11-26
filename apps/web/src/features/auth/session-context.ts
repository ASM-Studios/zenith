import { createContext } from 'react';
import type { SessionUser } from '../../api/auth.ts';

export type SessionState = {
  user: SessionUser | null;
  ready: boolean;
  setUser: (user: SessionUser | null) => void;
};

export const SessionContext = createContext<SessionState | null>(null);
