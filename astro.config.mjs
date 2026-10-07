import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://nirengi.app',
  integrations: [react()],
  devToolbar: { enabled: false },
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // three.js is lazy-loaded only by the landing hero, so its chunk size is expected.
  vite: { plugins: [tailwindcss()], build: { chunkSizeWarningLimit: 700 } },
});
