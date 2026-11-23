import { defineConfig } from 'vitest/config';
import { testEnv, unusedDatabaseUrl } from './apps/api/test/env.ts';

export default defineConfig({
  resolve: {
    conditions: ['@zenith/source'],
  },
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['{apps,packages}/*/{src,test}/**/*.test.ts', '.github/scripts/**/*.test.mjs'],
          exclude: ['apps/api/test/db/**'],
          env: { ...testEnv, DATABASE_URL: unusedDatabaseUrl },
        },
      },
      {
        extends: true,
        test: {
          name: 'db',
          include: ['apps/api/test/db/**/*.test.ts'],
          globalSetup: ['./apps/api/test/global-setup.ts'],
          setupFiles: ['./apps/api/test/setup-env.ts'],
          env: testEnv,
          fileParallelism: false,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['{apps,packages}/*/src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
        'apps/api/src/server.ts',
        'apps/api/src/worker.ts',
        'apps/api/src/db/migrate.ts',
        'apps/api/src/db/schema/**',
      ],
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        'packages/core/src/**': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },
    },
  },
});
