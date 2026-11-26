import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderRoute } from '../test/render-route.tsx';
import { json, stubApi } from '../test/stub-api.ts';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const session = json(200, { session: {}, user: { name: 'Ada', email: 'ada@example.com' } });

describe('header account', () => {
  test('a visitor sees the sign-in and sign-up links', async () => {
    stubApi({ '/api/auth/get-session': json(200, null) });
    renderRoute('/en/');

    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeTruthy();
  });

  test('a signed-in user sees the profile name linking to the settings instead of the links', async () => {
    stubApi({ '/api/auth/get-session': session });
    renderRoute('/en/');

    const profile = await screen.findByRole('link', { name: 'Ada' });
    expect(profile.getAttribute('href')).toBe('/en/settings');
    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Sign up' })).toBeNull();
  });

  test('nothing is offered before the session lookup answers', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    );
    renderRoute('/en/');

    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Ada' })).toBeNull();
  });

  test('signing in swaps the links for the profile name and signing out brings them back', async () => {
    stubApi({
      '/api/auth/get-session': json(200, null),
      '/api/auth/sign-in/email': json(200, { token: 't', user: { name: 'Ada', email: 'ada@example.com' } }),
      '/api/auth/sign-out': json(200, { success: true }),
    });
    renderRoute('/en/sign-in');
    await screen.findByRole('link', { name: 'Sign up' });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'a-long-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('link', { name: 'Ada' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Sign up' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('link', { name: 'Sign up' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Ada' })).toBeNull();
  });
});
