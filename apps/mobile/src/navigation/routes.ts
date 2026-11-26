import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = { Home: undefined; Favorites: undefined; Account: undefined };

export type RootStackParamList = { Tabs: NavigatorScreenParams<TabParamList> | undefined; LocationSearch: undefined };

export const tabRoutes = ['Home', 'Favorites', 'Account'] as const satisfies readonly (keyof TabParamList)[];

export const initialRoute = 'Home' as const satisfies keyof TabParamList;
