import { lastLink } from './outbox.ts';
import type { buildTestApp } from './build-test-app.ts';

type TestApp = ReturnType<typeof buildTestApp>;

const origin = 'http://localhost:3000';
const password = 'a-long-password';

export function cookiesOf(response: { headers: Record<string, unknown> }) {
  const header = response.headers['set-cookie'];
  const cookies = Array.isArray(header) ? header : [header ?? ''];
  return cookies
    .map((cookie) => String(cookie).split(';')[0] ?? '')
    .filter((cookie) => cookie.length > 0)
    .join('; ');
}

export function confirmEmail(app: TestApp, email: string) {
  const link = new URL(lastLink(email));
  return app.inject({ method: 'GET', url: `${link.pathname}${link.search}`, headers: { origin } });
}

export async function signUpWithCookie(app: TestApp, email: string) {
  await app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    payload: { email, password, name: 'Test' },
    headers: { origin },
  });
  await confirmEmail(app, email);
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/sign-in/email',
    payload: { email, password },
    headers: { origin },
  });
  return cookiesOf(response);
}
