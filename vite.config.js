import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// App servido a partir da raiz do domínio (Vercel) — base sempre '/'.
const base = '/';

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
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'sw-notifications.js',
      ],
      manifest: {
        // `id` deve ser estável entre deploys — é a identidade única do PWA pro
        // navegador. Se mudar a cada build, o Chrome desktop trata como app novo
        // e isso atrapalha o ícone de instalar e a atualização do app instalado.
        id: '/',
        name: 'MyCounts',
        short_name: 'MyCounts',
        description: 'Gestão financeira pessoal',
        lang: 'pt-BR',
        theme_color: '#6E4FF6',
        background_color: '#FBF7F2',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cacheId: `finca-${buildId}`,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        // O jspdf traz html2canvas/canvg/dompurify como deps opcionais do
        // `doc.html()` — que o relatório não usa (desenhamos tudo na mão).
        // Eles viram chunks próprios e só entrariam por dynamic import, então
        // ficam fora do precache: são ~380 KB que nenhum usuário baixaria.
        globIgnores: [
          '**/assets/html2canvas-*.js',
          '**/assets/purify.es-*.js',
          '**/assets/index.es-*.js',
        ],
        importScripts: ['sw-notifications.js'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
});
