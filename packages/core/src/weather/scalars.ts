import { z } from 'zod';

export const InstantSchema = z.iso.datetime({ offset: true });
export const LocalDateSchema = z.iso.date();
export const PercentSchema = z.number().min(0).max(100);
export const NonNegativeSchema = z.number().nonnegative();
export const CompassDegreesSchema = z.number().min(0).max(360);
