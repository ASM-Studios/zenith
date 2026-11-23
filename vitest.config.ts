import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['@zenith/source'],
  },
  test: {
    include: ['{apps,packages}/*/{src,test}/**/*.test.ts'],
    environment: 'node',
  },
});
