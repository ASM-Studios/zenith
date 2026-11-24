export function toInstant(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().replace('.000Z', 'Z');
}

export function toLocalDate(unixSeconds: number, utcOffsetSeconds: number): string {
  return new Date((unixSeconds + utcOffsetSeconds) * 1000).toISOString().slice(0, 10);
}
