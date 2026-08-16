import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import path from 'path';

export default defineConfig({
  main: {
    resolve: { alias: { '@shared': path.resolve(__dirname, 'src/shared') } },
  },
  preload: {
    resolve: { alias: { '@shared': path.resolve(__dirname, 'src/shared') } },
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@': path.resolve(__dirname, 'src/renderer/src'),
      },
    },
  },
});
