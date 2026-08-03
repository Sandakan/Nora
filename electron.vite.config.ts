import { resolve } from 'path';

import { transformSync } from '@babel/core';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import reactCompilerPlugin from 'babel-plugin-react-compiler';
import { defineConfig } from 'electron-vite';
import type { Plugin } from 'vite';

function reactCompiler(): Plugin {
  return {
    name: 'vite:react-compiler',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (id.includes('node_modules') || !/\.[tj]sx?$/.test(id)) return null;
      if (!/forwardRef|memo|\b(?:[A-Z]|use[A-Z0-9])/.test(code)) return null;

      const result = transformSync(code, {
        filename: id,
        plugins: [reactCompilerPlugin],
        parserOpts: {
          plugins: ['jsx', 'typescript']
        },
        configFile: false,
        babelrc: false,
        sourceMaps: true
      });

      return result ? { code: result.code ?? code, map: result.map } : null;
    }
  };
}

export default defineConfig({
  main: {
    build: {
      sourcemap: true,
      minify: false,
      rollupOptions: { input: '/src/main/main.ts', external: ['sharp'] }
    },
    resolve: {
      alias: {
        '@db': resolve(import.meta.dirname, './src/main/db'),
        '@main': resolve(import.meta.dirname, './src/main'),
        '@common': resolve(import.meta.dirname, './src/common')
      }
    }
  },
  preload: {
    build: {
      sourcemap: true,
      minify: false,
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
        routesDirectory: 'src/routes',
        generatedRouteTree: 'src/routeTree.gen.ts',
        autoCodeSplitting: true
      }),
      reactCompiler(),
      react(),
      tailwindcss()
    ]
  }
});
