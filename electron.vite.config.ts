/**
 * @type {import('electron-vite').UserConfig}
 */
import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

const pino = (): Plugin => ({
  name: 'pino',
  apply: 'build',
  config() {
    return {
      define: {
        globalThis: {
          __bundlerPathsOverrides: {
            'thread-stream-worker': '',
            'pino-worker': '',
            'pino-pipeline-worker': '',
            'pino-pretty': ''
          }
        }
      }
    };
  },
  renderChunk(code) {
    return code.replace('commonjsGlobal.process', 'process');
  }
});

export default defineConfig({
  main: {
    build: {
      rollupOptions: { input: '/src/main/main.ts', external: ['sharp'] }
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [pino(), externalizeDepsPlugin()],

    build: {
      rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].mjs' } }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve(import.meta.dirname, './src/renderer/src')
      }
    },
    plugins: [react()]
  }
});
