import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { fill } from '../../test/fill-field.ts';
import { renderRoute } from '../../test/render-route.tsx';
import { json, sentBody, stubApi } from '../../test/stub-api.ts';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function submitSignUp() {
  fill('Name', 'Ada');
  fill('Email', 'ada@example.com');
  fill('Password', 'a-long-password');
  fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
}

test('sign-up sends the form with a link back to the sign-in page and asks to check the inbox', async () => {
  const fetch = stubApi({ '/api/auth/sign-up/email': json(200, { token: null, user: {} }) });
  renderRoute('/en/sign-up');

  submitSignUp();

  expect((await screen.findByRole('status')).textContent).toMatch(/^Check your inbox/);
  expect(screen.queryByRole('button', { name: 'Sign up' })).toBeNull();
  expect(sentBody(fetch, '/api/auth/sign-up/email')).toEqual({
    name: 'Ada',
    email: 'ada@example.com',
    password: 'a-long-password',
    callbackURL: `${window.location.origin}/en/verify-email`,
  });
});

test('a password the API finds too short keeps the form and explains why', async () => {
  stubApi({ '/api/auth/sign-up/email': json(400, { code: 'PASSWORD_TOO_SHORT' }) });
  renderRoute('/en/sign-up');

  submitSignUp();

  expect((await screen.findByRole('alert')).textContent).toBe('The password needs at least 8 characters.');
  expect(screen.getByRole('button', { name: 'Sign up' })).toBeTruthy();
});

test('an unexpected failure shows the generic message in the page language', async () => {
  stubApi({ '/api/auth/sign-up/email': () => new Response('Bad gateway', { status: 502 }) });
  renderRoute('/fr/sign-up');

  fill('Nom', 'Ada');
  fill('E-mail', 'ada@example.com');
  fill('Mot de passe', 'a-long-password');
  fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }));

  expect((await screen.findByRole('alert')).textContent).toBe('Une erreur est survenue, réessayez.');
});
