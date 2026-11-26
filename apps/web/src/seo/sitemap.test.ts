import { describe, expect, test } from 'vitest';
import { buildSitemap } from './sitemap.ts';

describe('buildSitemap', () => {
  test('lists every page once per supported language', () => {
    const sitemap = buildSitemap('https://zenith.test', ['/', '/about'], ['en', 'fr']);
    const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    expect(locations).toEqual([
      'https://zenith.test/en/',
      'https://zenith.test/fr/',
      'https://zenith.test/en/about',
      'https://zenith.test/fr/about',
    ]);
  });

  test('links each page to its translations', () => {
    const sitemap = buildSitemap('https://zenith.test', ['/about'], ['en', 'fr']);
    expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="en" href="https://zenith.test/en/about"/>');
    expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="fr" href="https://zenith.test/fr/about"/>');
  });

  test('points x-default at the fallback language', () => {
    const sitemap = buildSitemap('https://zenith.test', ['/about'], ['fr', 'en']);
    expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="x-default" href="https://zenith.test/en/about"/>');
  });

  test('strips the trailing slash of the origin', () => {
    const sitemap = buildSitemap('https://zenith.test//', ['/'], ['en']);
    expect(sitemap).toContain('<loc>https://zenith.test/en/</loc>');
    expect(sitemap).not.toContain('zenith.test//');
  });

  test('escapes XML special characters in the origin', () => {
    const sitemap = buildSitemap('https://zenith.test/?a=1&b="2"', ['/'], ['en']);
    expect(sitemap).toContain('<loc>https://zenith.test/?a=1&amp;b=&quot;2&quot;/en/</loc>');
    expect(sitemap).not.toContain('&b=');
  });
});
