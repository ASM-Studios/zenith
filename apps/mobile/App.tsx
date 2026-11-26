import { SessionProvider } from './src/auth/SessionProvider.tsx';
import { FavoritesProvider } from './src/features/favorites/FavoritesProvider.tsx';
import { PlaceProvider } from './src/features/location/PlaceProvider.tsx';
import { AppNavigation } from './src/navigation/AppNavigation.tsx';
import { ThemeProvider } from './src/theme/ThemeProvider.tsx';

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <PlaceProvider>
          <FavoritesProvider>
            <AppNavigation />
          </FavoritesProvider>
        </PlaceProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
