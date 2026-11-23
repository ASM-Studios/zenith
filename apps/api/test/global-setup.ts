import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer('postgres:17').start();
  const url = container.getConnectionUri();

  try {
    const client = postgres(url, { max: 1, onnotice: () => {} });
    await migrate(drizzle(client), { migrationsFolder: new URL('../drizzle', import.meta.url).pathname });
    await client.end();
  } catch (error) {
    await container.stop();
    throw error;
  }

  project.provide('databaseUrl', url);

  return () => container.stop();
}
