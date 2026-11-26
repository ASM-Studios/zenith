import type { Palette } from './palette.ts';

export type NavigationColors = {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
};

export function navigationColors(palette: Palette): NavigationColors {
  return {
    primary: palette.accent,
    background: palette.background,
    card: palette.surface,
    text: palette.text,
    border: palette.border,
    notification: palette.accent,
  };
}
