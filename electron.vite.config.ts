/**
 * @type {import('electron-vite').UserConfig}
 */
import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin, swcPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    build: {
      sourcemap: true,
      rollupOptions: { input: '/src/main/main.ts' }
    },
    plugins: [externalizeDepsPlugin(), swcPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()],

    build: {
      sourcemap: true,
      rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].mjs' } }
    }
  },
  renderer: {
    build: {
      sourcemap: true
    },
    resolve: {
      alias: {
        '@renderer': resolve(import.meta.dirname, './src/renderer/src')
      }
    },
    plugins: [react()]
  }
});
