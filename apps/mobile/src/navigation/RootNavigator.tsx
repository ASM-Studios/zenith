import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AccountScreen } from '../features/account/AccountScreen.tsx';
import { FavoritesScreen } from '../features/favorites/FavoritesScreen.tsx';
import { HomeScreen } from '../features/home/HomeScreen.tsx';
import { initialRoute, type TabParamList } from './routes.ts';

const Tabs = createBottomTabNavigator<TabParamList>();

export function RootNavigator() {
  return (
    <Tabs.Navigator initialRouteName={initialRoute}>
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Favorites" component={FavoritesScreen} />
      <Tabs.Screen name="Account" component={AccountScreen} />
    </Tabs.Navigator>
  );
}
