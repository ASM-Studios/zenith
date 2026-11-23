import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['@zenith/source'],
  },
  test: {
    include: ['{apps,packages}/*/{src,test}/**/*.test.ts', '.github/scripts/**/*.test.mjs'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['{apps,packages}/*/src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
        'apps/api/src/server.ts',
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
