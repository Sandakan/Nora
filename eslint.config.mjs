import path from 'path';
import { fileURLToPath } from 'url';

import eslint from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import globals from 'globals';
import tsLint from 'typescript-eslint';

import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import electronToolkit from '@electron-toolkit/eslint-config-ts';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import promiseConfigs from 'eslint-plugin-promise';

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gitignorePath = path.resolve(__dirname, '.gitignore');
const data = includeIgnoreFile(gitignorePath);

export default tsLint.config(
  {
    ...data,
    ignores: [...data.ignores, 'prettier.config.cjs', 'postcss.config.cjs', 'eslint.config.mjs']
  },
  eslint.configs.recommended,
  electronToolkit.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/**/*.{js,ts,jsx,tsx}'],
    plugins: {
      'react-refresh': reactRefresh,
      react: react,
      'react-hooks': reactHooks
    },
    extends: [importPlugin.flatConfigs.recommended],
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      },
      react: {
        version: 'detect'
      }
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  tsLint.configs.recommended,
  promiseConfigs.configs['flat/recommended'],
  {
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'promise/always-return': ['warn', { ignoreLastCallback: true }],
      '@typescript-eslint/no-explicit-any': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-useless-escape': 'off'
    }
  }
);
