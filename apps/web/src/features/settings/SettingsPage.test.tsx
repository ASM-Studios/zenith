import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderRoute } from '../../test/render-route.tsx';
import { json, stubApi } from '../../test/stub-api.ts';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const session = json(200, { session: {}, user: { name: 'Ada', email: 'ada@example.com' } });

describe('settings guard', () => {
  test('a visitor without a session lands on the sign-in page', async () => {
    stubApi({ '/api/auth/get-session': json(200, null) });
    const router = renderRoute('/en/settings');

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/en/sign-in');
  });

  test('a visitor without a session cannot open the account deletion page either', async () => {
    stubApi({ '/api/auth/get-session': json(200, null) });
    const router = renderRoute('/fr/settings/delete-account');

    await screen.findByRole('button', { name: 'Se connecter' });
    expect(router.state.location.pathname).toBe('/fr/sign-in');
  });

  test('nothing is shown before the session lookup answers', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    );
    const router = renderRoute('/en/settings');

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(router.state.location.pathname).toBe('/en/settings');
  });
});

describe('settings page', () => {
  test('it shows the account name and email from the session', async () => {
    stubApi({ '/api/auth/get-session': session });
    renderRoute('/en/settings');

    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Settings');
    const details = within(screen.getByRole('region', { name: 'Account' }));
    expect(details.getByText('Ada')).toBeTruthy();
    expect(details.getByText('ada@example.com')).toBeTruthy();
  });

  test('it badges the email as verified for a verified session', async () => {
    stubApi({
      '/api/auth/get-session': json(200, {
        session: {},
        user: { name: 'Ada', email: 'ada@example.com', emailVerified: true },
      }),
    });
    renderRoute('/en/settings');

    await screen.findByRole('heading', { level: 1 });
    expect(within(screen.getByRole('region', { name: 'Account' })).getByText('Verified')).toBeTruthy();
  });

  test('it badges the email as not verified when the session does not say it is verified', async () => {
    stubApi({ '/api/auth/get-session': session });
    renderRoute('/en/settings');

    await screen.findByRole('heading', { level: 1 });
    expect(within(screen.getByRole('region', { name: 'Account' })).getByText('Not verified')).toBeTruthy();
  });

  test('it is translated in French', async () => {
    stubApi({ '/api/auth/get-session': session });
    renderRoute('/fr/settings');

    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Réglages');
    expect(screen.getByRole('button', { name: 'Se déconnecter' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Supprimer mon compte' }).getAttribute('href')).toBe(
      '/fr/settings/delete-account',
    );
  });

  test('the profile name in the header opens it', async () => {
    stubApi({ '/api/auth/get-session': session });
    const router = renderRoute('/en/');

    fireEvent.click(await screen.findByRole('link', { name: 'Ada' }));

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/en/settings');
  });

  test('signing out brings back the sign-in page and the header links', async () => {
    stubApi({ '/api/auth/get-session': session, '/api/auth/sign-out': json(200, { success: true }) });
    const router = renderRoute('/en/settings');

    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('link', { name: 'Sign up' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Ada' })).toBeNull();
    await waitFor(() => expect(router.state.location.pathname).toBe('/en/sign-in'));
  });

  test('a failed sign-out keeps the session and shows the error', async () => {
    stubApi({ '/api/auth/get-session': session, '/api/auth/sign-out': json(500, {}) });
    renderRoute('/en/settings');

    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Something went wrong, try again.');
    expect(screen.getByRole('link', { name: 'Ada' })).toBeTruthy();
  });
});
