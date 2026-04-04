// apps/marketplace/astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../..');

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [react()],
  vite: {
    ssr: {
      noExternal: ['lucide-react']
    },
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@escapemaster/ui-components': path.resolve(workspaceRoot, 'packages/escapemaster-ui-components/dist/index.mjs')
      }
    }
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
    exclude: ['/api/**/*']
  }
});