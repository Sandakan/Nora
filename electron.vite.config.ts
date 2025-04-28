/**
 * @type {import('electron-vite').UserConfig}
 */
import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin, swcPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig({
  main: {
    build: {
      sourcemap: true,
      minify: true,
      rollupOptions: { input: '/src/main/main.ts', external: ['sharp'] }
    },
    plugins: [externalizeDepsPlugin(), swcPlugin()]
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
        '@types': resolve(import.meta.dirname, './src/@types')
      }
    },
    plugins: [
      TanStackRouterVite({
        target: 'react',
        routesDirectory: 'src/renderer/src/routes',
        autoCodeSplitting: true
      }),
      react(),
      tailwindcss(),
    ]
  }
});
