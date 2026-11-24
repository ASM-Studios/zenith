import { createApiClient } from './client.ts';

export const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000' });
