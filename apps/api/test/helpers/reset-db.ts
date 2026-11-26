import { sql } from 'drizzle-orm';
import { db } from '../../src/db/index.ts';
import { clearOutbox } from './outbox.ts';

export async function resetDb() {
  clearOutbox();
  await db.execute(sql`TRUNCATE "user", "session", "account", "verification" RESTART IDENTITY CASCADE`);
}
