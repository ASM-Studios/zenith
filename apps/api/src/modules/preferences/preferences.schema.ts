import { z } from 'zod';

export const putPreferencesBody = z.object({
  sourcePreferences: z.record(z.string().min(1).max(64), z.string().min(1).max(64)),
});
