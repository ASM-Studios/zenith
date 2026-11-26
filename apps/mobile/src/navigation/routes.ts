export type TabParamList = { Home: undefined; Favorites: undefined; Account: undefined };

export const tabRoutes = ['Home', 'Favorites', 'Account'] as const satisfies readonly (keyof TabParamList)[];

export const initialRoute = 'Home' as const satisfies keyof TabParamList;
