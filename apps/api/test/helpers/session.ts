import type { buildTestApp } from './build-test-app.ts';

type TestApp = ReturnType<typeof buildTestApp>;

export async function signUpWithCookie(app: TestApp, email: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    payload: { email, password: 'a-long-password', name: 'Test' },
    headers: { origin: 'http://localhost:3000' },
  });
  const header = response.headers['set-cookie'];
  const cookies = Array.isArray(header) ? header : [header ?? ''];
  return cookies
    .map((cookie) => cookie.split(';')[0])
    .filter((cookie) => cookie.length > 0)
    .join('; ');
}
