import { ApiError } from './api-error.ts';
import { api } from './api.ts';

export type SessionUser = {
  name: string;
  email: string;
};

export type SignInInput = {
  email: string;
  password: string;
  callbackURL: string;
};

export type SignUpInput = SignInInput & { name: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseUserOf(data: unknown): SessionUser {
  const user = isRecord(data) ? data.user : undefined;
  if (isRecord(user) && typeof user.name === 'string' && typeof user.email === 'string') {
    return { name: user.name, email: user.email };
  }
  throw new TypeError('the user must have a name and an email');
}

function parseSession(data: unknown): SessionUser | null {
  return data === null ? null : parseUserOf(data);
}

const ignoreBody = () => undefined;

export function signUp(input: SignUpInput): Promise<void> {
  return api.post('/api/auth/sign-up/email', input, ignoreBody);
}

export function signIn(input: SignInInput): Promise<SessionUser> {
  return api.post('/api/auth/sign-in/email', input, parseUserOf);
}

export function currentUser(): Promise<SessionUser | null> {
  return api.get('/api/auth/get-session', parseSession);
}

export function verifyEmail(token: string): Promise<void> {
  return api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, ignoreBody);
}

export function signOut(): Promise<void> {
  return api.post('/api/auth/sign-out', {}, ignoreBody);
}

export function authErrorCode(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) {
    return undefined;
  }
  try {
    const data: unknown = JSON.parse(error.body);
    return isRecord(data) && typeof data.code === 'string' ? data.code : undefined;
  } catch {
    return undefined;
  }
}
