// apps/marketplace/astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: {
      prefixDefaultLocale: true
    },
    fallback: {
      en: "es"
    },
    // Prevent API routes from being prefixed with /es or /en
    // This fixes 404s when fetching /api/... from the browser
    exclude: ['/api/**/*']
  }
});