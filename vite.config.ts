import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        // El JS de la app suele pesar >2MB con Recharts/PhpSpreadsheet-sized deps;
        // el default de workbox (2MB) rechaza precachear el bundle principal.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: {
        name: 'UparVital',
        short_name: 'UparVital',
        description: 'Gestión de salud familiar by UparTechnology',
        theme_color: '#1B5E20',
        background_color: '#F1F8E9',
        display: 'standalone',
        start_url: '/dashboard',
        // TODO producción: generar los PNG reales (192/512/maskable) con
        // `npx pwa-asset-generator public/icons/source.svg public/icons`
        // (ver README) y reemplazar estas entradas — el SVG funciona para
        // desarrollo pero los PNG dan mejor compatibilidad de "maskable" en Android.
        icons: [
          { src: '/icons/source.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/source.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: '/icons/source.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      // Nota: `workbox.runtimeCaching` solo aplica a la estrategia `generateSW`.
      // Con `injectManifest` el cacheo en runtime (si se necesita) se define
      // a mano dentro de src/sw.ts usando workbox-routing/workbox-strategies.
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
