import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const apiTarget = process.env.API_UPSTREAM ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: { usePolling: process.env.WATCH_POLLING === 'true' },
    proxy: {
      '/api': apiTarget,
      '/ping': apiTarget,
    },
  },
  test: {
    name: 'web',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
