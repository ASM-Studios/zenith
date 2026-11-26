export type AuthErrorKind = 'invalid-credentials' | 'email-taken' | 'network' | 'unknown';

export class AuthError extends Error {
  override name = 'AuthError';
  readonly kind: AuthErrorKind;

  constructor(kind: AuthErrorKind) {
    super(`authentication failed: ${kind}`);
    this.kind = kind;
  }
}

function errorCode(body: string): string {
  try {
    const data: unknown = JSON.parse(body);
    if (typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string') {
      return data.code;
    }
  } catch {
    return '';
  }
  return '';
}

export function errorKindOf(status: number, body: string): AuthErrorKind {
  if (errorCode(body).startsWith('USER_ALREADY_EXISTS')) {
    return 'email-taken';
  }
  return status === 401 ? 'invalid-credentials' : 'unknown';
}

const messages: Record<AuthErrorKind, string> = {
  'invalid-credentials': 'Wrong email or password.',
  'email-taken': 'An account already uses this email.',
  network: 'Cannot reach the server. Check your connection.',
  unknown: 'Something went wrong. Try again.',
};

export function authErrorMessage(error: unknown): string {
  return messages[error instanceof AuthError ? error.kind : 'unknown'];
}
