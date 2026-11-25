const KMH_PER_METER_PER_SECOND = 3.6;

export function kmhFromMetersPerSecond(value: number | null): number | null {
  return value === null ? null : Math.round(value * KMH_PER_METER_PER_SECOND * 10) / 10;
}

export function sumOrNull(values: readonly (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null);
  return present.length === 0 ? null : Math.round(present.reduce((total, value) => total + value, 0) * 10) / 10;
}

export function maxOrNull(values: readonly (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null);
  return present.length === 0 ? null : Math.max(...present);
}
