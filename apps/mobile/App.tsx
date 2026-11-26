import { SessionProvider } from './src/auth/SessionProvider.tsx';
import { PlaceProvider } from './src/features/location/PlaceProvider.tsx';
import { AppNavigation } from './src/navigation/AppNavigation.tsx';
import { ThemeProvider } from './src/theme/ThemeProvider.tsx';

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <PlaceProvider>
          <AppNavigation />
        </PlaceProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
