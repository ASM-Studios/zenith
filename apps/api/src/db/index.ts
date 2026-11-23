import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { databaseEnv, parseEnv } from '../lib/env.ts';
import * as schema from './schema/index.ts';

const { DATABASE_URL } = parseEnv(databaseEnv, process.env);

export const client = postgres(DATABASE_URL, { onnotice: () => {} });
export const db = drizzle(client, { schema });
