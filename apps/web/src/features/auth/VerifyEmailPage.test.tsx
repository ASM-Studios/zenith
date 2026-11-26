import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderRoute } from '../../test/render-route.tsx';
import { json, type Reply, stubApi } from '../../test/stub-api.ts';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function openLink(reply: Reply, session: Reply = json(200, null)) {
  const fetch = stubApi({
    '/api/auth/verify-email?token=t%2Bk': reply,
    '/api/auth/get-session': session,
  });
  renderRoute('/en/verify-email?token=t%2Bk');
  return fetch;
}

describe('verify-email page', () => {
  test('confirms the token once through the API, then shows the sign-in page with the confirmation', async () => {
    const fetch = openLink(json(200, { status: true }));

    expect(await screen.findByText('Your address is confirmed.')).toBeTruthy();
    expect(fetch.mock.calls.filter(([input]) => input.startsWith('/api/auth/verify-email'))).toHaveLength(1);
  });

  test('a confirmed address signs the user in, as the API opened a session', async () => {
    openLink(
      json(200, { status: true }),
      json(200, { session: {}, user: { name: 'Ada', email: 'ada@example.com', emailVerified: true } }),
    );

    expect(await screen.findByText('Signed in as ada@example.com')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ada' })).toBeTruthy();
  });

  test('a confirmed address still lands on the sign-in page when the session lookup fails', async () => {
    openLink(json(200, { status: true }), () => new Response('Bad gateway', { status: 502 }));

    expect(await screen.findByText('Your address is confirmed.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
  });

  test('an expired token lands on the sign-in page with the expired notice', async () => {
    openLink(json(401, { code: 'TOKEN_EXPIRED' }));

    expect(await screen.findByText('This link has expired. Sign in to receive a new one.')).toBeTruthy();
  });

  test('a failure without a code is reported as an invalid link', async () => {
    openLink(() => new Response('Bad gateway', { status: 502 }));

    expect(await screen.findByText('This link is not valid. Sign in to receive a new one.')).toBeTruthy();
  });
});
