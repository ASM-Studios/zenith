import { darkPalette, lightPalette } from './palette.ts';
import type { Palette } from './palette.ts';

export type ColorScheme = 'light' | 'dark' | null | undefined;

export function pickPalette(scheme: ColorScheme): Palette {
  return scheme === 'light' ? lightPalette : darkPalette;
}
