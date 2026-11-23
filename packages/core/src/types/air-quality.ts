export interface AirQuality {
  readonly time: string;
  readonly europeanAqi?: number;
  readonly pm2_5?: number;
  readonly pm10?: number;
  readonly ozone?: number;
  readonly nitrogenDioxide?: number;
  readonly sulphurDioxide?: number;
  readonly carbonMonoxide?: number;
}

export const POLLEN_SPECIES = ['alder', 'birch', 'grass', 'mugwort', 'olive', 'ragweed'] as const;

export type PollenSpecies = (typeof POLLEN_SPECIES)[number];

export interface Pollen {
  readonly time: string;
  readonly grainsPerM3: Readonly<Partial<Record<PollenSpecies, number>>>;
}
