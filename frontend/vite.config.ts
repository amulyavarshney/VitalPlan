import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages project site: https://amulyavarshney.github.io/VitalPlan/
const base = process.env.VITE_BASE || '/';
// Workbox/terser can flake in CI; Pages still works without a service worker.
const disablePwa = process.env.VITE_DISABLE_PWA === '1' || Boolean(process.env.VITE_BASE);

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      disable: disablePwa,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'VitalPlan - AI Diet Guide',
        short_name: 'VitalPlan',
        description: 'AI-Powered Diet Guide and Nutrition Tracker',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
