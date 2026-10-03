import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import type { Plugin } from 'vite';

function getFilesRecursively(dir: string, ext = '.rs'): string[] {
  let results: string[] = [];
  try {
    const list = readdirSync(dir);
    for (const file of list) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(getFilesRecursively(fullPath, ext));
      } else if (file.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist or be accessible yet
  }
  return results;
}

function watchAudioEnginePlugin(): Plugin {
  const engineDir = resolve(import.meta.dirname, 'audio-engine');
  const srcDir = resolve(engineDir, 'src');
  const cargoToml = resolve(engineDir, 'Cargo.toml');

  return {
    name: 'watch-audio-engine',
    buildStart() {
      // In watch/dev mode, register Rust sources and Cargo.toml to Rollup watch graph
      const rustFiles = getFilesRecursively(srcDir);
      for (const file of rustFiles) {
        this.addWatchFile(file);
      }
      this.addWatchFile(cargoToml);
    },
    watchChange(id: string) {
      if (id.includes('audio-engine') && (id.endsWith('.rs') || id.endsWith('Cargo.toml'))) {
        console.log(`\n[audio-engine] Change detected in ${id}. Rebuilding native audio engine...`);
        try {
          execSync('npx --package=@napi-rs/cli napi build --platform -o dist', {
            cwd: engineDir,
            stdio: 'inherit'
          });
          console.log('[audio-engine] Rebuild complete.\n');
        } catch (err) {
          console.error('[audio-engine] Rebuild failed:', err);
        }
      }
    }
  };
}

export default defineConfig({
  main: {
    plugins: [watchAudioEnginePlugin()],
    build: {
      sourcemap: true,
      minify: false,
      rollupOptions: { input: '/src/main/main.ts', external: ['sharp', 'audio-engine'] }
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
      react(),
      // babel({ presets: [reactCompilerPreset()] }),
      tailwindcss()
    ]
  }
});
