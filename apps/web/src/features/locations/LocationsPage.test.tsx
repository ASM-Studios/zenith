import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fill } from '../../test/fill-field.ts';
import { renderRoute } from '../../test/render-route.tsx';
import { json, stubApi } from '../../test/stub-api.ts';
import { clearGeolocation, stubGeolocation } from '../../test/stub-geolocation.ts';

beforeEach(() => {
  stubApi({ '/api/auth/get-session': json(200, null) });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  clearGeolocation();
});

function inputValue(label: string) {
  const field = screen.getByLabelText(label);
  return field instanceof HTMLInputElement ? field.value : undefined;
}

async function addLocation(name: string, latitude: string, longitude: string) {
  await screen.findByRole('heading', { level: 1 });
  fill('Name', name);
  fill('Latitude', latitude);
  fill('Longitude', longitude);
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
}

describe('favorite locations page without an account', () => {
  test('it shows the empty state when there is no favorite yet', async () => {
    renderRoute('/en/locations');

    expect(await screen.findByText('No favorite location yet. Add one below.')).toBeTruthy();
  });

  test('it lists an added location with its name and coordinates', async () => {
    renderRoute('/en/locations');
    await addLocation('Paris', '48.85', '2.35');

    expect(await screen.findByText('Paris')).toBeTruthy();
    expect(screen.getByText('48.85, 2.35')).toBeTruthy();
    expect(screen.queryByText('No favorite location yet. Add one below.')).toBeNull();
  });

  test('it refuses coordinates out of range', async () => {
    renderRoute('/en/locations');
    await addLocation('Nowhere', '91', '2');

    expect((await screen.findByRole('alert')).textContent).toContain('Latitude must be between -90 and 90');
    expect(screen.queryByRole('list', { name: 'Favorite locations' })).toBeNull();
  });

  test('it removes a location from the list', async () => {
    renderRoute('/en/locations');
    await addLocation('Paris', '48.85', '2.35');
    fireEvent.click(await screen.findByRole('button', { name: 'Remove Paris' }));

    await waitFor(() => expect(screen.queryByText('Paris')).toBeNull());
    expect(await screen.findByText('No favorite location yet. Add one below.')).toBeTruthy();
  });

  test('the favorites persist after a reload', async () => {
    renderRoute('/en/locations');
    await addLocation('Paris', '48.85', '2.35');
    await screen.findByText('Paris');
    cleanup();

    renderRoute('/en/locations');
    expect(await screen.findByText('Paris')).toBeTruthy();
  });

  test('opening a location links to the home page with its coordinates', async () => {
    renderRoute('/fr/locations');
    await screen.findByRole('heading', { level: 1 });
    fill('Nom', 'Paris');
    fill('Latitude', '48.85');
    fill('Longitude', '2.35');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

    const open = await screen.findByRole('link', { name: 'Ouvrir' });
    expect(open.getAttribute('href')).toBe('/fr/?lat=48.85&lon=2.35&name=Paris');
  });

  test('the header links to the page', async () => {
    renderRoute('/en/');

    const link = await screen.findByRole('link', { name: 'Locations' });
    expect(link.getAttribute('href')).toBe('/en/locations');
  });
});

describe('use my position', () => {
  test('it fills the coordinates and a default name from the browser position', async () => {
    stubGeolocation({ latitude: 48.85661, longitude: 2.35222 });
    renderRoute('/en/locations');
    await screen.findByRole('heading', { level: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Use my position' }));

    await waitFor(() => expect(inputValue('Latitude')).toBe('48.8566'));
    expect(inputValue('Longitude')).toBe('2.3522');
    expect(inputValue('Name')).toBe('My position');
  });

  test('it keeps the name already typed', async () => {
    stubGeolocation({ latitude: 1, longitude: 2 });
    renderRoute('/en/locations');
    await screen.findByRole('heading', { level: 1 });
    fill('Name', 'Home');
    fireEvent.click(screen.getByRole('button', { name: 'Use my position' }));

    await waitFor(() => expect(inputValue('Latitude')).toBe('1.0000'));
    expect(inputValue('Name')).toBe('Home');
  });

  test('it explains a refused permission', async () => {
    stubGeolocation({ code: 1 });
    renderRoute('/en/locations');
    await screen.findByRole('heading', { level: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Use my position' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Position access was refused.');
  });
});
