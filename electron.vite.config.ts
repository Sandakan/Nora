/**
 * @type {import('electron-vite').UserConfig}
 */
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, externalizeDepsPlugin, swcPlugin } from 'electron-vite';
import { resolve } from 'path';

export default defineConfig({
  main: {
    build: {
      sourcemap: true,
      minify: true,
      rollupOptions: { input: '/src/main/main.ts', external: ['sharp'] }
    },
    plugins: [externalizeDepsPlugin(), swcPlugin()],
    resolve: {
      alias: {
        '@db': resolve(import.meta.dirname, './src/main/db'),
        '@main': resolve(import.meta.dirname, './src/main')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],

    build: {
      sourcemap: true,
      minify: true,
      rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].mjs' } }
    }
  },
  renderer: {
    build: {
      minify: true,
      sourcemap: true
    },
    resolve: {
      alias: {
        '@renderer': resolve(import.meta.dirname, './src/renderer/src'),
        '@types': resolve(import.meta.dirname, './src/@types'),
        '@common': resolve(import.meta.dirname, './src/common'),
        '@assets': resolve(import.meta.dirname, './src/renderer/src/assets')
      }
    },
    plugins: [
      TanStackRouterVite({
        target: 'react',
        routesDirectory: 'src/renderer/src/routes',
        autoCodeSplitting: true
      }),
      react(),
      tailwindcss()
    ]
  }
});
