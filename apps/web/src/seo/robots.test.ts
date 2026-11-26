import { describe, expect, test } from 'vitest';
import { buildRobots } from './robots.ts';

describe('buildRobots', () => {
  test('omits the Sitemap line without a site origin', () => {
    expect(buildRobots(undefined)).toBe('User-agent: *\nAllow: /\n');
  });

  test('points to the sitemap of the site origin', () => {
    expect(buildRobots('https://zenith.test/')).toBe(
      'User-agent: *\nAllow: /\nSitemap: https://zenith.test/sitemap.xml\n',
    );
  });

  test('allows every crawler', () => {
    expect(buildRobots(undefined).split('\n')[0]).toBe('User-agent: *');
    expect(buildRobots(undefined)).toContain('Allow: /');
  });
});
