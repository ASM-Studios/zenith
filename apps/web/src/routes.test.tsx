import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { renderRoute } from './test/render-route.tsx';

afterEach(cleanup);

function heading() {
  return screen.getByRole('heading', { level: 1 }).textContent;
}

describe('routes', () => {
  test('the root path renders the home page inside the layout', () => {
    renderRoute('/');
    expect(heading()).toBe('When and where the sky is worth watching');
    expect(screen.getByRole('link', { name: 'Zenith' }).getAttribute('href')).toBe('/');
  });

  test('an unknown path renders the not-found page with a link home', () => {
    renderRoute('/no/such/page');
    expect(heading()).toBe('Page not found');
    expect(screen.getByRole('link', { name: 'Back to home' }).getAttribute('href')).toBe('/');
  });

  test('pages render in French when the language is French', () => {
    renderRoute('/', 'fr');
    expect(heading()).toBe("Quand et où le ciel vaut le coup d'œil");
  });
});
