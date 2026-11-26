export type SessionUser = { id: string; email: string; name: string };

function isSessionUser(value: unknown): value is SessionUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'email' in value &&
    typeof value.email === 'string' &&
    'name' in value &&
    typeof value.name === 'string'
  );
}

export function parseSessionUser(data: unknown): SessionUser | null {
  if (typeof data !== 'object' || data === null || !('user' in data)) {
    return null;
  }
  const user = data.user;
  return isSessionUser(user) ? { id: user.id, email: user.email, name: user.name } : null;
}
