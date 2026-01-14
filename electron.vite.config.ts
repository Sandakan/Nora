import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import { resolve } from 'path';

export default defineConfig({
  main: {
    build: {
      sourcemap: true,
      minify: true,
      rollupOptions: { input: '/src/main/main.ts', external: ['sharp'] },
    },
    resolve: {
      alias: {
        '@db': resolve(import.meta.dirname, './src/main/db'),
        '@main': resolve(import.meta.dirname, './src/main')
      }
    }
  },
  preload: {

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
      tanstackRouter({
        target: 'react',
        routesDirectory: 'src/renderer/src/routes',
        generatedRouteTree: 'src/renderer/src/routeTree.gen.ts',
        autoCodeSplitting: true
      }),
      react({
        // TODO: Using babel plugin breaks the tanstack-virtual package.
        babel: {
          plugins: ['babel-plugin-react-compiler']
        }
      }),
      tailwindcss()
    ]
  }
});
