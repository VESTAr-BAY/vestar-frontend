import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // sungje : dev 서버에서는 루트 경로로 바로 열리게 하고, 배포 빌드에서만 /vote/ base를 유지한다.
  const baseUrl = command === 'serve' ? '/' : '/vote/'

  return {
    base: baseUrl,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'PINATA_JWT', 'PINATA_GATEWAYS'],
    define: {
      __PINATA_JWT__: JSON.stringify(env.PINATA_JWT ?? ''),
      __PINATA_GATEWAYS__: JSON.stringify(env.PINATA_GATEWAYS ?? ''),
    },
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      VitePWA({
        injectRegister: false,
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-icon.svg'],
        manifest: {
          name: 'VESTAr — K-pop Fan Voting',
          short_name: 'VESTAr',
          description: '투표로 응원하세요 — K-pop 팬 투표 플랫폼',
          theme_color: '#7140FF',
          background_color: '#090A0B',
          display: 'standalone',
          orientation: 'portrait',
          scope: baseUrl,
          start_url: baseUrl,
          icons: [
            {
              src: 'pwa-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: 'pwa-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,woff2}'],
          navigateFallback: `${baseUrl}index.html`,
          navigateFallbackAllowlist: [/^(?!\/__).*/],
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-fonts',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-stylesheets' },
            },
          ],
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  }
})
