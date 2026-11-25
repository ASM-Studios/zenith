import { Platform } from 'react-native';
import { createApiClient } from './client.ts';
import { defaultApiUrl } from './default-url.ts';

export const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl(Platform.OS) });
