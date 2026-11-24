import { z } from 'zod';
import { InstantSchema } from './scalars.ts';

export const ALERT_TYPES = [
  'wind',
  'rain',
  'flood',
  'thunderstorm',
  'snow-ice',
  'heat',
  'cold',
  'avalanche',
  'coastal',
  'fog',
  'forest-fire',
  'other',
] as const;

export const ALERT_SEVERITIES = ['minor', 'moderate', 'severe', 'extreme'] as const;

export const AlertTypeSchema = z.enum(ALERT_TYPES);
export const AlertSeveritySchema = z.enum(ALERT_SEVERITIES);

export const AlertSchema = z
  .object({
    id: z.string().min(1),
    type: AlertTypeSchema,
    severity: AlertSeveritySchema,
    title: z.string().min(1),
    description: z.string().nullable(),
    startsAt: InstantSchema,
    endsAt: InstantSchema.nullable(),
  })
  .refine((alert) => alert.endsAt === null || Date.parse(alert.startsAt) <= Date.parse(alert.endsAt), {
    message: 'endsAt must not be before startsAt',
    path: ['endsAt'],
  });

export type AlertType = z.infer<typeof AlertTypeSchema>;
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;
export type Alert = z.infer<typeof AlertSchema>;
