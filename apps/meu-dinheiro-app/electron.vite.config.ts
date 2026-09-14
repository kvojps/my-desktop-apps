import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import path from 'path';
import pkg from './package.json';

export default defineConfig({
  main: {
    resolve: { alias: { '@shared': path.resolve(__dirname, 'src/shared') } },
  },
  preload: {
    resolve: { alias: { '@shared': path.resolve(__dirname, 'src/shared') } },
  },
  renderer: {
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@': path.resolve(__dirname, 'src/renderer/src'),
      },
    },
  },
});
