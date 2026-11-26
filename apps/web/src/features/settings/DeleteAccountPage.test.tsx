import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fill } from '../../test/fill-field.ts';
import { renderRoute } from '../../test/render-route.tsx';
import { json, type Reply, sentBody, stubApi } from '../../test/stub-api.ts';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const session = json(200, { session: {}, user: { name: 'Ada', email: 'ada@example.com' } });

async function deleteWith(reply: Reply) {
  const fetch = stubApi({ '/api/auth/get-session': session, '/api/auth/delete-user': reply });
  const router = renderRoute('/en/settings/delete-account');
  await screen.findByRole('heading', { name: 'Delete your account' });
  fill('Password', 'a-long-password');
  fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }));
  return { fetch, router };
}

describe('delete account page', () => {
  test('the settings page links to it and the page warns that the deletion is permanent', async () => {
    stubApi({ '/api/auth/get-session': session });
    renderRoute('/en/settings');

    fireEvent.click(await screen.findByRole('link', { name: 'Delete account' }));

    expect(await screen.findByRole('heading', { name: 'Delete your account' })).toBeTruthy();
    expect(screen.getByText(/cannot be undone/)).toBeTruthy();
  });

  test('the password is sent, then the session ends and the sign-in page shows the visitor links', async () => {
    const { fetch, router } = await deleteWith(json(200, { success: true }));

    expect(await screen.findByRole('link', { name: 'Sign up' })).toBeTruthy();
    expect(sentBody(fetch, '/api/auth/delete-user')).toEqual({ password: 'a-long-password' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/en/sign-in'));
    expect(screen.queryByRole('link', { name: 'Ada' })).toBeNull();
  });

  test('a wrong password shows an error and keeps the account', async () => {
    const { router } = await deleteWith(json(400, { code: 'INVALID_PASSWORD' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Wrong password.');
    expect(router.state.location.pathname).toBe('/en/settings/delete-account');
    expect(screen.getByRole('link', { name: 'Ada' })).toBeTruthy();
  });

  test('cancel goes back to the settings without deleting anything', async () => {
    const fetch = stubApi({ '/api/auth/get-session': session });
    const router = renderRoute('/en/settings/delete-account');

    fireEvent.click(await screen.findByRole('link', { name: 'Cancel' }));

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/en/settings');
    expect(sentBody(fetch, '/api/auth/delete-user')).toBeUndefined();
  });
});
