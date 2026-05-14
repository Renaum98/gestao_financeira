import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Em GitHub Actions, GITHUB_REPOSITORY = "usuario/repo".
// Em dev local, base = '/'.
const ghRepo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.GITHUB_ACTIONS && ghRepo ? `/${ghRepo}/` : '/';

// Versão única por build: package.json + hash curto do git (fallback: timestamp).
// Cada build gera um manifest/service-worker diferente, forçando o PWA a atualizar.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
let gitHash = '';
try {
  gitHash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString().trim();
} catch {}
const buildId = `${pkg.version}+${gitHash || Date.now().toString(36)}`;

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icon.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'sw-notifications.js',
      ],
      manifest: {
        id: `${base}?v=${buildId}`,
        name: 'Financeiro',
        short_name: 'Financeiro',
        description: 'Gestão financeira pessoal',
        version: buildId,
        theme_color: '#6E4FF6',
        background_color: '#FBF7F2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cacheId: `finca-${buildId}`,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        importScripts: ['sw-notifications.js'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
});
