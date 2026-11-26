import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { useMemo } from 'react';
import { StatusBar } from 'react-native';
import { darkPalette } from '../theme/palette.ts';
import { navigationColors } from '../theme/navigation-colors.ts';
import { useTheme } from '../theme/ThemeProvider.tsx';
import { RootNavigator } from './RootNavigator.tsx';

export function AppNavigation() {
  const palette = useTheme();
  const dark = palette === darkPalette;
  const theme = useMemo<Theme>(() => ({ ...DefaultTheme, dark, colors: navigationColors(palette) }), [palette, dark]);
  return (
    <NavigationContainer theme={theme}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </NavigationContainer>
  );
}
