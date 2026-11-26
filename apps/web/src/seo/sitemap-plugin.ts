import type { Plugin } from 'vite';
import { supportedLanguages } from '../i18n/languages.ts';
import { indexablePaths } from './indexable-paths.ts';
import { buildRobots } from './robots.ts';
import { buildSitemap } from './sitemap.ts';

export function sitemapPlugin(origin: string | undefined): Plugin {
  return {
    name: 'zenith-sitemap',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobots(origin) });
      if (origin) {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: buildSitemap(origin, indexablePaths, supportedLanguages),
        });
      }
    },
  };
}
