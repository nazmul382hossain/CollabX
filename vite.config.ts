import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    base: './',
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router') || id.includes('node_modules/react-router-dom/')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
              return 'firebase-bundle';
            }
            if (id.includes('node_modules/jspdf/')) {
              return 'jspdf-bundle';
            }
            if (id.includes('node_modules/html2canvas/') || id.includes('node_modules/dompurify/')) {
              return 'html2canvas-bundle';
            }
            if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-vendor/')) {
              return 'charts-bundle';
            }
            if (id.includes('node_modules/motion/') || id.includes('node_modules/framer-motion/') || id.includes('node_modules/canvas-confetti/')) {
              return 'animation-bundle';
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'icons-bundle';
            }
            if (id.includes('node_modules/@google/genai/')) {
              return 'genai-bundle';
            }
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
