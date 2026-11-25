import { describe, expect, it } from 'vitest';
import { screenshotFile, screenshotTargets } from './screenshot-plan.ts';

describe('screenshot plan', () => {
  it('names a file after its platform and screen', () => {
    expect(screenshotFile('home')).toBe('web-home.png');
  });

  it('gives every target a distinct file', () => {
    const files = screenshotTargets.map((target) => target.file);
    expect(new Set(files).size).toBe(files.length);
  });

  it('keeps every target on a language path', () => {
    expect(screenshotTargets.every((target) => /^\/(en|fr)(\/|$)/.test(target.path))).toBe(true);
  });
});
