import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createAuthApi } from '../auth/auth-api.ts';
import { createTokenStore } from '../auth/token-store.ts';
import { createApiClient } from './client.ts';
import { defaultApiUrl } from './default-url.ts';

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl(Platform.OS);

export const tokenStore = createTokenStore(SecureStore);

export const api = createApiClient({ baseUrl, getToken: tokenStore.get });

export const authApi = createAuthApi({ baseUrl, tokenStore });
