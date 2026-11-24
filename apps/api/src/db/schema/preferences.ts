import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';

export const userPreference = pgTable('user_preference', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  sourcePreferences: jsonb('source_preferences').$type<Record<string, string>>().notNull().default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
