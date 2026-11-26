import { AppNavigation } from './src/navigation/AppNavigation.tsx';
import { ThemeProvider } from './src/theme/ThemeProvider.tsx';

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigation />
    </ThemeProvider>
  );
}
