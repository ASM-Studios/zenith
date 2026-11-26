import { trimTrailingSlashes } from './origin.ts';

export function buildRobots(origin: string | undefined): string {
  const lines = ['User-agent: *', 'Allow: /'];
  if (origin !== undefined) {
    lines.push(`Sitemap: ${trimTrailingSlashes(origin)}/sitemap.xml`);
  }
  return `${lines.join('\n')}\n`;
}
