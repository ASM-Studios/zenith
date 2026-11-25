export type RootStackParamList = { Home: undefined };

export const initialRoute = 'Home' as const satisfies keyof RootStackParamList;
