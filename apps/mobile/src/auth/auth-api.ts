import { defaultFetch, type Fetch } from '../api/client.ts';
import { AuthError, errorKindOf } from './auth-error.ts';
import { parseSessionUser, type SessionUser } from './session-user.ts';
import type { SignInInput, SignUpInput } from './credentials.ts';
import type { TokenStore } from './token-store.ts';

export type AuthApiOptions = { baseUrl: string; fetch?: Fetch; tokenStore: TokenStore };

const tokenHeader = 'set-auth-token';

function parseUser(text: string): SessionUser | null {
  try {
    return parseSessionUser(JSON.parse(text));
  } catch {
    return null;
  }
}

export function createAuthApi({ baseUrl, fetch = defaultFetch, tokenStore }: AuthApiOptions) {
  async function call(method: string, path: string, token: string | null, body?: object): Promise<Response> {
    try {
      return await fetch(`${baseUrl}${path}`, {
        method,
        credentials: 'omit',
        headers: {
          accept: 'application/json',
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
          ...(token === null ? {} : { authorization: `Bearer ${token}` }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new AuthError('network');
    }
  }

  async function authenticate(path: string, body: object): Promise<SessionUser> {
    const response = await call('POST', path, null, body);
    const text = await response.text();
    if (!response.ok) {
      throw new AuthError(errorKindOf(response.status, text));
    }
    const token = response.headers.get(tokenHeader);
    const user = parseUser(text);
    if (token === null || token === '' || user === null) {
      throw new AuthError('unknown');
    }
    await tokenStore.save(token);
    return user;
  }

  return {
    signUp: ({ name, email, password }: SignUpInput) =>
      authenticate('/api/auth/sign-up/email', { name: name.trim(), email: email.trim(), password }),
    signIn: ({ email, password }: SignInInput) =>
      authenticate('/api/auth/sign-in/email', { email: email.trim(), password }),
    signOut: async (): Promise<void> => {
      const token = await tokenStore.get();
      try {
        if (token !== null) {
          await call('POST', '/api/auth/sign-out', token, {});
        }
      } catch {
        return;
      } finally {
        await tokenStore.clear();
      }
    },
    getSession: async (): Promise<SessionUser | null> => {
      const token = await tokenStore.get();
      if (token === null) {
        return null;
      }
      const response = await call('GET', '/api/auth/get-session', token);
      if (response.status === 401) {
        await tokenStore.clear();
        return null;
      }
      if (!response.ok) {
        throw new AuthError('unknown');
      }
      const user = parseUser(await response.text());
      if (user === null) {
        await tokenStore.clear();
      }
      return user;
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
