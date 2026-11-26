import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser } from 'playwright';
import { preview } from 'vite';
import { screenshotTargets, type ScreenshotTarget } from '../src/dev/screenshot-plan.ts';

const webDir = fileURLToPath(new URL('..', import.meta.url));
const outDir = resolve(process.argv[2] ?? 'screenshots');
mkdirSync(outDir, { recursive: true });

async function capture(browser: Browser, baseUrl: string, target: ScreenshotTarget): Promise<void> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route(/\/(api|ping)(\/|$)/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.goto(new URL(target.path, baseUrl).href, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(outDir, target.file) });
  await page.close();
  process.stdout.write(`${target.file}\n`);
}

const server = await preview({ root: webDir, preview: { port: 4173, strictPort: true } });
const baseUrl = server.resolvedUrls?.local[0];
if (baseUrl === undefined) {
  throw new Error('The preview server did not report its address.');
}

const browser = await chromium.launch();
try {
  await Promise.all(screenshotTargets.map((target) => capture(browser, baseUrl, target)));
} finally {
  await browser.close();
  await server.close();
}
