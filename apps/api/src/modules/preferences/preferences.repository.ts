import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { userPreference } from '../../db/schema/index.ts';

export async function getSourcePreferences(userId: string) {
  const [row] = await db
    .select({ sourcePreferences: userPreference.sourcePreferences })
    .from(userPreference)
    .where(eq(userPreference.userId, userId));
  return row?.sourcePreferences ?? {};
}

export async function saveSourcePreferences(userId: string, sourcePreferences: Record<string, string>) {
  await db
    .insert(userPreference)
    .values({ userId, sourcePreferences })
    .onConflictDoUpdate({ target: userPreference.userId, set: { sourcePreferences, updatedAt: new Date() } });
  return sourcePreferences;
}
