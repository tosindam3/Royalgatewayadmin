import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
        '/sanctum': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          // Optimized chunk splitting
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // React Query
              if (id.includes('@tanstack/react-query')) {
                return 'query-vendor';
              }
              // Date utilities
              if (id.includes('date-fns')) {
                return 'date-vendor';
              }
              // UI libraries
              if (id.includes('sonner') || id.includes('framer-motion')) {
                return 'ui-vendor';
              }
              // React Router
              if (id.includes('react-router')) {
                return 'router-vendor';
              }
              // Axios
              if (id.includes('axios')) {
                return 'axios-vendor';
              }
              // React core + Charts together (recharts depends on React, avoid circular deps)
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler') || 
                  id.includes('recharts') || id.includes('d3-')) {
                return 'react-vendor';
              }
            }
          },
        },
      },
      // Gzipped sizes are acceptable for production
      chunkSizeWarningLimit: 1500,
      minify: 'esbuild',
      manifest: true,
    },
  };
});
