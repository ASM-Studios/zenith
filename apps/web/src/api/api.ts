import { createApiClient } from './client.ts';

export const api = createApiClient({ baseUrl: import.meta.env.VITE_API_URL ?? '' });
