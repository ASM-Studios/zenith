import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { client, db } from './index.ts';

try {
  await migrate(db, { migrationsFolder: new URL('../../drizzle', import.meta.url).pathname });
  console.log('Migrations applied');
} finally {
  await client.end();
}
