import { useState } from 'react';
import { authErrorCode } from '../../api/auth.ts';

export type AuthActionState =
  { status: 'idle' } | { status: 'pending' } | { status: 'done' } | { status: 'failed'; code: string | undefined };

export type AuthAction = {
  state: AuthActionState;
  run: (action: () => Promise<void>) => Promise<void>;
};

export function useAuthAction(): AuthAction {
  const [state, setState] = useState<AuthActionState>({ status: 'idle' });

  async function run(action: () => Promise<void>) {
    setState({ status: 'pending' });
    try {
      await action();
      setState({ status: 'done' });
    } catch (error) {
      setState({ status: 'failed', code: authErrorCode(error) });
    }
  }

  return { state, run };
}
