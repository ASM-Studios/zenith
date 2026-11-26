import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { sitemapPlugin } from './src/seo/sitemap-plugin.ts';

const apiTarget = 'http://localhost:3000';

export default defineConfig(({ mode }) => ({
  plugins: [react(), sitemapPlugin(loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL || undefined)],
  server: {
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
}));
