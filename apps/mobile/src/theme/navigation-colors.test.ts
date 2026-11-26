import { expect, test } from 'vitest';
import { darkPalette, lightPalette } from './palette.ts';
import type { Palette } from './palette.ts';
import { navigationColors } from './navigation-colors.ts';

test('the navigation colors come from the palette', () => {
  const palette: Palette = lightPalette;
  expect(navigationColors(palette)).toEqual({
    primary: palette.accent,
    background: palette.background,
    card: palette.surface,
    text: palette.text,
    border: palette.border,
    notification: palette.accent,
  });
  expect(navigationColors(darkPalette).card).toBe(darkPalette.surface);
});
