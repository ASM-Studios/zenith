import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { location } from '../../db/schema/index.ts';

export type LocationInput = { name: string; latitude: number; longitude: number };

const columns = {
  id: location.id,
  name: location.name,
  latitude: location.latitude,
  longitude: location.longitude,
};

export function listLocations(userId: string) {
  return db
    .select(columns)
    .from(location)
    .where(eq(location.userId, userId))
    .orderBy(asc(location.createdAt), asc(location.id));
}

function lastPerCoordinates(inputs: LocationInput[]) {
  const byCoordinates = new Map(inputs.map((input) => [`${input.latitude},${input.longitude}`, input]));
  return [...byCoordinates.values()];
}

export async function upsertLocations(userId: string, inputs: LocationInput[]) {
  await db
    .insert(location)
    .values(lastPerCoordinates(inputs).map(({ name, latitude, longitude }) => ({ userId, name, latitude, longitude })))
    .onConflictDoUpdate({
      target: [location.userId, location.latitude, location.longitude],
      set: { name: sql`excluded.name` },
    });
  return listLocations(userId);
}

export async function deleteLocation(userId: string, id: string) {
  const deleted = await db
    .delete(location)
    .where(and(eq(location.id, id), eq(location.userId, userId)))
    .returning({ id: location.id });
  return deleted.length > 0;
}
