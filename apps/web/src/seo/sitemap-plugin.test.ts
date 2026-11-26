import { build } from 'vite';
import { expect, test } from 'vitest';
import { sitemapPlugin } from './sitemap-plugin.ts';

async function emittedAssets(origin: string | undefined) {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: { write: false, rollupOptions: { input: 'entry' } },
    plugins: [
      {
        name: 'entry',
        resolveId: (id) => (id === 'entry' ? id : null),
        load: (id) => (id === 'entry' ? 'export default 1' : null),
      },
      sitemapPlugin(origin),
    ],
  });
  const assets = new Map<string, string>();
  for (const item of [result].flat()) {
    if (!('output' in item)) {
      continue;
    }
    for (const chunk of item.output) {
      if (chunk.type === 'asset') {
        assets.set(chunk.fileName, String(chunk.source));
      }
    }
  }
  return assets;
}

test('emits robots.txt and sitemap.xml when the site origin is set', async () => {
  const assets = await emittedAssets('https://zenith.example');
  expect([...assets.keys()].toSorted()).toEqual(['robots.txt', 'sitemap.xml']);
  expect(assets.get('sitemap.xml')).toContain('<loc>https://zenith.example/en/</loc>');
  expect(assets.get('robots.txt')).toContain('Sitemap: https://zenith.example/sitemap.xml');
});

test('emits no sitemap.xml without a site origin', async () => {
  const assets = await emittedAssets(undefined);
  expect([...assets.keys()]).toEqual(['robots.txt']);
});
