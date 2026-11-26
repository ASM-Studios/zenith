import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { pickPalette } from './pick-palette.ts';
import type { Palette } from './palette.ts';

const ThemeContext = createContext<Palette | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const palette = useMemo(() => pickPalette(scheme), [scheme]);
  return <ThemeContext.Provider value={palette}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Palette {
  const palette = useContext(ThemeContext);
  if (palette === null) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return palette;
}
