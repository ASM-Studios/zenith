import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fill } from '../../test/fill-field.ts';
import { renderRoute } from '../../test/render-route.tsx';
import { json, type Reply, sentBody, stubApi } from '../../test/stub-api.ts';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const user = { name: 'Ada', email: 'ada@example.com' };
const noSession = json(200, null);

function signInWith(reply: Reply) {
  const fetch = stubApi({ '/api/auth/get-session': noSession, '/api/auth/sign-in/email': reply });
  renderRoute('/en/sign-in');
  fill('Email', user.email);
  fill('Password', 'a-long-password');
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  return fetch;
}

describe('sign-in page', () => {
  test('the verification redirect shows that the address is confirmed', async () => {
    stubApi({ '/api/auth/get-session': noSession });
    renderRoute('/en/sign-in?verified=1');
    expect(await screen.findByText('Your address is confirmed.')).toBeTruthy();
  });

  test('an expired verification link says a new one comes with the next sign-in', async () => {
    stubApi({ '/api/auth/get-session': noSession });
    renderRoute('/en/sign-in?verified=1&error=TOKEN_EXPIRED');
    expect(await screen.findByText('This link has expired. Sign in to receive a new one.')).toBeTruthy();
  });

  test('a failed session lookup still offers the sign-in form', async () => {
    const fetch = stubApi({ '/api/auth/get-session': () => new Response('Bad gateway', { status: 502 }) });
    renderRoute('/en/sign-in');

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('an unverified address is told to confirm it, and the new link opens the verify-email page', async () => {
    const fetch = signInWith(json(403, { code: 'EMAIL_NOT_VERIFIED' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Confirm your address first: we sent you a new link.');
    expect(sentBody(fetch, '/api/auth/sign-in/email')).toEqual({
      email: user.email,
      password: 'a-long-password',
      callbackURL: `${window.location.origin}/en/verify-email`,
    });
  });

  test('wrong credentials show one message for an unknown address and a wrong password', async () => {
    signInWith(json(401, { code: 'INVALID_EMAIL_OR_PASSWORD' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Wrong email or password.');
  });

  test('wrong credentials are flagged as a danger and an unverified address as a watch', async () => {
    signInWith(json(401, { code: 'INVALID_EMAIL_OR_PASSWORD' }));
    expect((await screen.findByRole('alert')).className).toContain('auth-message--danger');

    cleanup();
    signInWith(json(403, { code: 'EMAIL_NOT_VERIFIED' }));
    expect((await screen.findByRole('alert')).className).toContain('auth-message--watch');
  });

  test('the verification notice is flagged by its outcome', async () => {
    stubApi({ '/api/auth/get-session': noSession });
    renderRoute('/en/sign-in?verified=1&error=TOKEN_EXPIRED');
    expect((await screen.findByText('This link has expired. Sign in to receive a new one.')).className).toContain(
      'auth-message--watch',
    );
  });

  test('a successful sign-in shows the user and a link to the settings, where signing out lives', async () => {
    signInWith(json(200, { token: 't', user }));

    expect((await screen.findByRole('status')).textContent).toBe('Signed in as ada@example.com');
    expect(screen.getByRole('link', { name: 'Open settings' }).getAttribute('href')).toBe('/en/settings');
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
  });
});
