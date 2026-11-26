import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fill } from '../../test/fill-field.ts';
import { renderRoute } from '../../test/render-route.tsx';
import { json, sentBody, stubApi } from '../../test/stub-api.ts';
import { favoritesStorageKey } from './favorites-storage.ts';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

const signedIn = json(200, { session: {}, user: { name: 'Ada', email: 'ada@example.com' } });
const abisko = { id: 'a1', name: 'Abisko', latitude: 68.35, longitude: 18.83 };
const paris = { id: 'p1', name: 'Paris', latitude: 48.85, longitude: 2.35 };

describe('favorite locations page with an account', () => {
  test('it lists the favorites of the account', async () => {
    stubApi({ '/api/auth/get-session': signedIn, 'GET /api/me/locations': json(200, { locations: [abisko] }) });
    renderRoute('/en/locations');

    expect(await screen.findByText('Abisko')).toBeTruthy();
    expect(screen.getByText('68.35, 18.83')).toBeTruthy();
  });

  test('the local favorites are sent to the account at sign-in and the local cache is emptied', async () => {
    localStorage.setItem(favoritesStorageKey, JSON.stringify([paris]));
    const fetch = stubApi({
      '/api/auth/get-session': signedIn,
      'POST /api/me/locations': json(200, { locations: [abisko, paris] }),
    });
    renderRoute('/en/locations');

    expect(await screen.findByText('Paris')).toBeTruthy();
    expect(screen.getByText('Abisko')).toBeTruthy();
    expect(sentBody(fetch, '/api/me/locations')).toEqual({
      locations: [{ name: 'Paris', latitude: 48.85, longitude: 2.35 }],
    });
    expect(localStorage.getItem(favoritesStorageKey)).toBeNull();
  });

  test('adding a location saves it in the account, not in the local cache', async () => {
    const fetch = stubApi({
      '/api/auth/get-session': signedIn,
      'GET /api/me/locations': json(200, { locations: [] }),
      'POST /api/me/locations': json(200, { locations: [paris] }),
    });
    renderRoute('/en/locations');
    await screen.findByText('No favorite location yet. Add one below.');
    fill('Name', 'Paris');
    fill('Latitude', '48.85');
    fill('Longitude', '2.35');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Paris')).toBeTruthy();
    expect(sentBody(fetch, '/api/me/locations')).toEqual({
      locations: [{ name: 'Paris', latitude: 48.85, longitude: 2.35 }],
    });
    expect(localStorage.getItem(favoritesStorageKey)).toBeNull();
  });

  test('removing a location deletes it from the account', async () => {
    const fetch = stubApi({
      '/api/auth/get-session': signedIn,
      'GET /api/me/locations': json(200, { locations: [abisko] }),
      'DELETE /api/me/locations/a1': () => new Response(null, { status: 204 }),
    });
    renderRoute('/en/locations');
    fireEvent.click(await screen.findByRole('button', { name: 'Remove Abisko' }));

    await waitFor(() => expect(screen.queryByText('Abisko')).toBeNull());
    expect(fetch).toHaveBeenCalledWith('/api/me/locations/a1', expect.objectContaining({ method: 'DELETE' }));
  });

  test('a failed removal keeps the location and shows an error', async () => {
    stubApi({
      '/api/auth/get-session': signedIn,
      'GET /api/me/locations': json(200, { locations: [abisko] }),
      'DELETE /api/me/locations/a1': json(500, {}),
    });
    renderRoute('/en/locations');
    fireEvent.click(await screen.findByRole('button', { name: 'Remove Abisko' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Something went wrong, try again.');
    expect(screen.getByText('Abisko')).toBeTruthy();
  });

  test('when the sync fails the local favorites stay visible and stored', async () => {
    localStorage.setItem(favoritesStorageKey, JSON.stringify([paris]));
    stubApi({ '/api/auth/get-session': signedIn, 'POST /api/me/locations': json(500, {}) });
    renderRoute('/en/locations');

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Paris')).toBeTruthy();
    expect(localStorage.getItem(favoritesStorageKey)).not.toBeNull();
  });
});
