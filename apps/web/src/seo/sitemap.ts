import { fallbackLanguage } from '../i18n/languages.ts';
import type { Language } from '../i18n/languages.ts';
import { withLanguagePrefix } from '../i18n/localized-path.ts';
import { trimTrailingSlashes } from './origin.ts';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function alternateLinks(origin: string, path: string, languages: readonly Language[]): string[] {
  const alternates = languages.map(
    (language) =>
      `    <xhtml:link rel="alternate" hreflang="${language}" href="${escapeXml(origin + withLanguagePrefix(path, language))}"/>`,
  );
  const fallbackHref = escapeXml(origin + withLanguagePrefix(path, fallbackLanguage));
  return [...alternates, `    <xhtml:link rel="alternate" hreflang="x-default" href="${fallbackHref}"/>`];
}

function urlEntries(origin: string, path: string, languages: readonly Language[]): string[] {
  return languages.map((language) => {
    const location = escapeXml(origin + withLanguagePrefix(path, language));
    return ['  <url>', `    <loc>${location}</loc>`, ...alternateLinks(origin, path, languages), '  </url>'].join('\n');
  });
}

export function buildSitemap(origin: string, paths: readonly string[], languages: readonly Language[]): string {
  const base = trimTrailingSlashes(origin);
  const entries = paths.flatMap((path) => urlEntries(base, path, languages));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}
