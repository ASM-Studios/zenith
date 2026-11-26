import { expect, test } from 'vitest';
import { darkPalette, lightPalette } from './palette.ts';
import type { Palette } from './palette.ts';
import { pickPalette } from './pick-palette.ts';

function channel(hex: string, offset: number): number {
  const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

function contrast(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

test('the light scheme picks the light palette', () => {
  expect(pickPalette('light')).toBe(lightPalette);
});

test('the dark scheme picks the dark palette', () => {
  expect(pickPalette('dark')).toBe(darkPalette);
});

test('an unknown scheme falls back to the dark palette', () => {
  expect(pickPalette(null)).toBe(darkPalette);
  expect(pickPalette(undefined)).toBe(darkPalette);
});

test('each palette keeps a readable contrast between text and background', () => {
  const palettes: Palette[] = [darkPalette, lightPalette];
  for (const palette of palettes) {
    expect(contrast(palette.text, palette.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.mutedText, palette.background)).toBeGreaterThanOrEqual(4.5);
  }
});
