/**
 * BollaLabz Vite Configuration
 * Production-grade build configuration with security and performance optimizations
 * Aligned with Zero Cognitive Load and Production Reliability principles
 * Last Modified: 2025-11-25 00:00
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
// Legacy plugin removed - causing build issues with empty modern bundles
// import legacy from '@vitejs/plugin-legacy';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get Git commit hash for release tracking
 */
function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (error) {
    return 'unknown';
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      // React plugin with Fast Refresh
      react({
        fastRefresh: true,
        // Use automatic JSX runtime (React 17+)
        jsxRuntime: 'automatic',
        // Babel configuration for better compatibility
        babel: {
          plugins: [
            // Add runtime automatic for better performance
            ['@babel/plugin-transform-runtime', {
              regenerator: true,
              useESModules: true, // Use ES modules to prevent initialization issues
            }],
          ],
          // Ensure proper module ordering
          compact: false, // Don't compact output to preserve initialization order
        },
      }),

      // PWA Support for offline functionality
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'BollaLabz Command Center',
          short_name: 'BollaLabz',
          description: 'AI-powered personal command center with zero cognitive load',
          theme_color: '#3b82f6',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          cleanupOutdatedCaches: true,
          sourcemap: true,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit to handle unminified files
          runtimeCaching: [
            {
              // API caching - Update regex pattern to match your VPS domain
              // Default assumes api.bollalabz.com or similar subdomain structure
              urlPattern: ({ url }) => {
                return url.pathname.startsWith('/api/') ||
                       url.hostname.includes('api.');
              },
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false, // Enable in development for testing
        },
      }),

      // Legacy browser support REMOVED - was causing empty modern bundles
      // Modern browsers (ES2020+) only - aligns with target: 'es2020' in build config
      // If legacy browser support is needed in the future, the plugin conflicts
      // with manualChunks and needs different configuration

      // Compression for better performance
      compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240, // Only compress files larger than 10kb
        deleteOriginFile: false,
      }),

      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
        deleteOriginFile: false,
      }),

      // Bundle visualizer (only in analyze mode)
      mode === 'analyze' &&
        visualizer({
          open: true,
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true,
        }),

      // Sentry source maps upload (only in production builds)
      mode === 'production' &&
        env.VITE_SENTRY_DSN &&
        env.SENTRY_AUTH_TOKEN &&
        sentryVitePlugin({
          org: env.SENTRY_ORG || 'bollalabz',
          project: env.VITE_SENTRY_PROJECT || 'javascript-react',
          authToken: env.SENTRY_AUTH_TOKEN,
          sourcemaps: {
            assets: './dist/**',
            ignore: ['node_modules'],
            filesToDeleteAfterUpload: ['./dist/**/*.map'],
          },
          release: {
            name: `bollalabz-frontend@${getGitCommitHash()}`,
            cleanArtifacts: true,
            setCommits: {
              auto: true,
            },
          },
          telemetry: false,
        }),
    ].filter(Boolean),

    // Path resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@types': path.resolve(__dirname, './src/types'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@features': path.resolve(__dirname, './src/features'),
      },
    },

    // Development server configuration
    server: {
      port: 3000,
      strictPort: false,
      host: true, // Listen on all addresses
      open: true, // Open browser on start
      cors: true,

      // Security headers for development - DISABLED for dev mode
      // CSP and Document-Policy removed to allow Vite HMR, React DevTools, and profiling
      // Production security is handled by nginx.conf
      headers: {
        // NO CSP in development - browser will use permissive defaults
        // This allows unsafe-eval for Vite HMR without configuration issues

        // CORS headers for API requests
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },

      // Proxy API requests in development
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/ws': {
          target: 'ws://localhost:4000',
          ws: true,
          changeOrigin: true,
        },
      },

      // HMR configuration
      hmr: {
        overlay: true,
      },
    },

    // Build configuration
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'production' ? 'hidden' : true,

      // Module preload polyfill for older browsers
      modulePreload: {
        polyfill: true, // Ensure modules load in correct order
        resolveDependencies: (filename, deps) => {
          // Filter out circular dependencies that cause initialization errors
          return deps.filter(dep => !dep.includes(filename));
        },
      },

      // Rollup options
      rollupOptions: {
        // Prevent circular dependencies
        onwarn(warning, warn) {
          // Suppress circular dependency warnings (we handle them)
          if (warning.code === 'CIRCULAR_DEPENDENCY') return;
          warn(warning);
        },

        output: {
          // Optimized chunk splitting for route-based code splitting
          // Last Modified: 2025-11-25 07:55 - Enhanced granularity for vendor bundle reduction
          manualChunks(id) {
            // Node modules chunking strategy - OPTIMIZED for smaller vendor bundle
            if (id.includes('node_modules')) {
              // Ant Design components (lazy load only when needed)
              // Split by component for better granularity
              if (id.includes('antd/es/')) {
                const match = id.match(/antd\/es\/([^/]+)/)
                if (match) {
                  return `antd-${match[1].toLowerCase()}`
                }
                return 'antd-components'
              }

              // Core React (absolutely needed for initial load)
              if (id.includes('react/') || id.includes('react-dom/') || id.includes('scheduler')) {
                return 'react-core'
              }

              // Router (small, needed early for navigation)
              if (id.includes('react-router')) {
                return 'react-router'
              }

              // React Query (split from other state management)
              if (id.includes('@tanstack/react-query')) {
                return 'react-query'
              }

              // Zustand (small state management)
              if (id.includes('zustand')) {
                return 'zustand'
              }

              // UI components - split large libraries
              if (id.includes('@radix-ui')) {
                // Split Radix UI by component for better granularity
                const match = id.match(/@radix-ui\/react-([^/]+)/)
                if (match) {
                  return `radix-${match[1]}`
                }
                return 'ui-radix'
              }

              // Icons (separate from other UI)
              if (id.includes('lucide-react')) {
                return 'icons-lucide'
              }

              // Heavy charting libraries (lazy loaded with Analytics page)
              if (id.includes('recharts')) {
                return 'charts-recharts'
              }

              if (id.includes('d3-') || id.includes('victory')) {
                return 'charts-d3'
              }

              // Calendar libraries (lazy loaded with Calendar page)
              if (id.includes('@fullcalendar')) {
                return 'calendar-fullcalendar'
              }

              if (id.includes('rrule') || id.includes('moment-timezone') || id.includes('dayjs')) {
                return 'calendar-utils'
              }

              // Form libraries (lazy loaded with forms)
              if (id.includes('react-hook-form')) {
                return 'forms-react-hook-form'
              }

              if (id.includes('@hookform')) {
                return 'forms-hookform'
              }

              // HTTP client (used frequently)
              if (id.includes('axios')) {
                return 'http-axios'
              }

              // Date utilities
              if (id.includes('date-fns')) {
                return 'utils-date-fns'
              }

              // Lodash/utility libraries
              if (id.includes('lodash')) {
                return 'utils-lodash'
              }

              // Validation and parsing
              if (id.includes('zod')) {
                return 'validation-zod'
              }

              if (id.includes('yup')) {
                return 'validation-yup'
              }

              // CSS utilities (small, but used everywhere)
              if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
                return 'css-utils'
              }

              // Security libraries
              if (id.includes('dompurify')) {
                return 'security-dompurify'
              }

              if (id.includes('sanitize-html')) {
                return 'security-sanitize'
              }

              // Rich text editors (lazy loaded)
              if (id.includes('quill') || id.includes('lexical') || id.includes('tiptap')) {
                return 'editor'
              }

              // Socket.IO
              if (id.includes('socket.io-client')) {
                return 'socket-io'
              }

              // Sentry (monitoring)
              if (id.includes('@sentry')) {
                return 'monitoring-sentry'
              }

              // Framer Motion (animations)
              if (id.includes('framer-motion')) {
                return 'animation-framer'
              }

              // All other vendor libraries (should be small now)
              return 'vendor-misc'
            }

            // Application code chunking
            if (!id.includes('node_modules')) {
              // Each lazy-loaded page gets its own chunk
              if (id.includes('/pages/')) {
                const pageName = id.split('/pages/')[1]?.split('.')[0]
                if (pageName) {
                  return `page-${pageName.toLowerCase()}`
                }
              }

              // Layout components (needed early)
              if (id.includes('/components/layout/') || id.includes('/components/providers/')) {
                return 'app-layout'
              }

              // Authentication components (needed early)
              if (id.includes('/components/auth/')) {
                return 'app-auth'
              }

              // Common UI components
              if (id.includes('/components/ui/')) {
                return 'app-ui'
              }

              // AI-specific components
              if (id.includes('/components/ai/')) {
                return 'app-ai'
              }

              // State management
              if (id.includes('/stores/')) {
                return 'app-stores'
              }

              // API and utilities
              if (id.includes('/lib/') || id.includes('/utils/')) {
                return 'app-lib'
              }

              // Types don't need their own chunk
              if (id.includes('/types/')) {
                return undefined // Let Vite handle it automatically
              }
            }
          },

          // Asset file naming
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/\.(woff2?|ttf|eot)$/i.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            if (extType === 'css') {
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },

          // Chunk file naming
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `assets/js/[name]-[hash].js`;
          },

          // Entry file naming
          entryFileNames: 'assets/js/[name]-[hash].js',
        },

        // External dependencies (if needed for CDN)
        external: [],

        // Tree shaking - FIXED: was removing entire app!
        // moduleSideEffects must be true or 'auto' for React apps
        treeshake: {
          moduleSideEffects: true,  // CRITICAL: false removes React initialization!
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },

      // Minification options - FIXED configuration for safe minification
      minify: mode === 'production' ? 'esbuild' : false, // esbuild is faster and safer than terser
      // Use esbuild minifier with conservative settings to avoid initialization errors

      // Chunk size warnings
      chunkSizeWarningLimit: 1000, // 1MB

      // CSS code splitting
      cssCodeSplit: true,

      // Asset inlining threshold
      assetsInlineLimit: 4096, // 4kb

      // Report compressed size
      reportCompressedSize: false, // Disable to speed up builds

      // Empty outDir on build
      emptyOutDir: true,
    },

    // CSS configuration
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
        generateScopedName: mode === 'production'
          ? '[hash:base64:8]'
          : '[name]__[local]__[hash:base64:5]',
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
      devSourcemap: true,
    },

    // Optimizations
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'zustand',
        'axios',
        'date-fns',
        '@fullcalendar/react',
        '@fullcalendar/core',
        '@fullcalendar/daygrid',
        '@fullcalendar/timegrid',
        '@fullcalendar/interaction',
        '@fullcalendar/list',
      ],
      exclude: [],
      entries: [
        'src/main.tsx',
      ],
      force: true, // Force rebuild to fix fullcalendar
    },

    // Environment variable configuration
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
      'import.meta.env.VITE_GIT_COMMIT_HASH': JSON.stringify(getGitCommitHash()),
    },

    // Enable esbuild optimizations - SAFE MINIFICATION SETTINGS
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      treeShaking: true,
      // Conservative minification to avoid "Cannot access before initialization" errors
      minifyIdentifiers: false, // DISABLED: Can cause TDZ (Temporal Dead Zone) errors with certain variable names
      minifySyntax: mode === 'production', // Safe: optimizes syntax
      minifyWhitespace: mode === 'production', // Safe: removes whitespace
      // CRITICAL: Keep original names to prevent initialization errors
      keepNames: true, // Preserves function/class names - prevents TDZ errors
      legalComments: 'external',
      target: 'es2020',
      // Explicitly handle JSX
      jsx: 'automatic',
      jsxDev: mode !== 'production',
      // Preserve original variable names to prevent hoisting issues
      mangleProps: undefined,
      // Don't mangle quoted properties
      mangleQuoted: false,
    },

    // Preview server (for testing production builds)
    preview: {
      port: 3000,
      strictPort: false,
      host: true,
      headers: {
        // Security headers for preview - balanced to allow app functionality
        // Note: 'unsafe-inline' for scripts is needed for React and HMR
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'", // Allow inline scripts for React
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https:",
          "connect-src 'self' https://bollalabz.com wss://bollalabz.com http://localhost:* ws://localhost:*",
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
  };
});