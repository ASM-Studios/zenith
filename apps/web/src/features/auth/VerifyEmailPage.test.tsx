import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderRoute } from '../../test/render-route.tsx';
import { json, type Reply, stubApi } from '../../test/stub-api.ts';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function openLink(reply: Reply) {
  const fetch = stubApi({
    '/api/auth/verify-email?token=t%2Bk': reply,
    '/api/auth/get-session': json(200, null),
  });
  renderRoute('/en/verify-email?token=t%2Bk');
  return fetch;
}

describe('verify-email page', () => {
  test('confirms the token once through the API, then shows the sign-in page with the confirmation', async () => {
    const fetch = openLink(json(200, { status: true }));

    expect(await screen.findByText('Your address is confirmed, you can sign in.')).toBeTruthy();
    expect(fetch.mock.calls.filter(([input]) => input.startsWith('/api/auth/verify-email'))).toHaveLength(1);
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
