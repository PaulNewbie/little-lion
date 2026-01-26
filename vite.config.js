import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; //

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'Little Lions Monitoring',
        short_name: 'Little Lions',
        description: 'Monitoring system for Little Lions Learning Center',
        theme_color: '#FFA500',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },

      devOptions: {
        enabled: true, // Enables PWA in npm start
      },

      // This caches the "App Shell" (HTML, JS, CSS)
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        // Increase limit for large files if needed
        maximumFileSizeToCacheInBytes: 3000000
      }
    })
  ],
  server: {
    port: 3000,
    open: true,
  },
});