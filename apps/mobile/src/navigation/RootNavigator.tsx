import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '../auth/SignInScreen.tsx';
import { SignUpScreen } from '../auth/SignUpScreen.tsx';
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
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign in', presentation: 'modal' }} />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ title: 'Create an account', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
