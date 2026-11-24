import { z } from 'zod';
import { InstantSchema, NonNegativeSchema } from './scalars.ts';

export const POLLEN_SPECIES = ['alder', 'birch', 'grass', 'mugwort', 'olive', 'ragweed'] as const;

export const PollenSpeciesSchema = z.enum(POLLEN_SPECIES);

export const PollenSchema = z.object({
  time: InstantSchema,
  grainsPerCubicMeter: z.record(PollenSpeciesSchema, NonNegativeSchema.nullable()),
});

export type PollenSpecies = z.infer<typeof PollenSpeciesSchema>;
export type Pollen = z.infer<typeof PollenSchema>;
