import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LocationSearchScreen } from '../features/location/LocationSearchScreen.tsx';
import type { RootStackParamList } from './routes.ts';
import { TabsNavigator } from './TabsNavigator.tsx';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="LocationSearch"
        component={LocationSearchScreen}
        options={{ title: 'Choose a place', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
