import { z } from 'zod';

export const optionalNumber = z.number().nullable().default(null);

export const GmtMinuteSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  .transform((minute) => `${minute}:00Z`);
