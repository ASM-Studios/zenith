import { sql } from 'drizzle-orm';
import { db } from '../../src/db/index.ts';

export async function resetDb() {
  await db.execute(sql`TRUNCATE "user", "session", "account", "verification" RESTART IDENTITY CASCADE`);
}
