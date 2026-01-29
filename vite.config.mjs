import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5174
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-native-web', 'axios'],
          zxing: ['@zxing/browser', '@zxing/library']
        }
      }
    }
  }
});
