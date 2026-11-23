import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderRoute } from './test/render-route.tsx';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

function browserLanguages(languages: string[]) {
  vi.spyOn(Navigator.prototype, 'languages', 'get').mockReturnValue(languages);
}

async function heading() {
  return (await screen.findByRole('heading', { level: 1 })).textContent;
}

function hrefOf(name: string) {
  return screen.getByRole('link', { name }).getAttribute('href');
}

describe('routes', () => {
  test('the English home renders inside the layout with a link to itself', async () => {
    renderRoute('/en/');
    expect(await heading()).toBe('When and where the sky is worth watching');
    expect(hrefOf('Zenith')).toBe('/en/');
  });

  test('the French prefix renders French and sets the document language', async () => {
    renderRoute('/fr/');
    expect(await heading()).toBe("Quand et où le ciel vaut le coup d'œil");
    expect(document.documentElement.lang).toBe('fr');
  });

  test('an unknown page renders the not-found page with a link to the language home', async () => {
    renderRoute('/fr/no/such/page');
    expect(await heading()).toBe('Page introuvable');
    expect(hrefOf("Retour à l'accueil")).toBe('/fr/');
  });

  test('the root redirects to the browser language', async () => {
    browserLanguages(['fr-FR', 'en']);
    const router = renderRoute('/');
    expect(await heading()).toBe("Quand et où le ciel vaut le coup d'œil");
    expect(router.state.location.pathname).toBe('/fr/');
  });

  test('the root redirects to the remembered language before the browser language', async () => {
    browserLanguages(['en']);
    localStorage.setItem('zenith.language', 'fr');
    const router = renderRoute('/');
    await heading();
    expect(router.state.location.pathname).toBe('/fr/');
  });

  test('a path without a supported language prefix keeps its path under the preferred language', async () => {
    browserLanguages(['en']);
    const router = renderRoute('/de/page?x=1#top');
    expect(await heading()).toBe('Page not found');
    expect(router.state.location).toMatchObject({ pathname: '/en/de/page', search: '?x=1', hash: '#top' });
  });

  test('the switcher moves to the same page in the other language and remembers it', async () => {
    const router = renderRoute('/en/some/page');
    await heading();
    expect(hrefOf('Français')).toBe('/fr/some/page');
    expect(screen.getByRole('link', { name: 'English' }).getAttribute('aria-current')).toBe('true');
    fireEvent.click(screen.getByRole('link', { name: 'Français' }));
    expect(await heading()).toBe('Page introuvable');
    expect(router.state.location.pathname).toBe('/fr/some/page');
    expect(localStorage.getItem('zenith.language')).toBe('fr');
  });
});
