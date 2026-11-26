import { PlaceProvider } from './src/features/location/PlaceProvider.tsx';
import { AppNavigation } from './src/navigation/AppNavigation.tsx';
import { ThemeProvider } from './src/theme/ThemeProvider.tsx';

export default function App() {
  return (
    <ThemeProvider>
      <PlaceProvider>
        <AppNavigation />
      </PlaceProvider>
    </ThemeProvider>
  );
}
