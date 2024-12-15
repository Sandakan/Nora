import path from 'path';
import { fileURLToPath } from 'url';

// import * as eslintConfigs from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import { fixupConfigRules } from '@eslint/compat';

import reactRefresh from 'eslint-plugin-react-refresh';
import reactConfigs from 'eslint-plugin-react';
import reactHooksConfigs from 'eslint-plugin-react-hooks';
import electronConfigs from '@electron-toolkit/eslint-config-ts/recommended.js';
import importConfigs from 'eslint-plugin-import';
import jsxConfigs from 'eslint-plugin-jsx-a11y';
import promiseConfigs from 'eslint-plugin-promise';

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default {
  // ...eslintConfigs.configs.recommended,
  ...reactConfigs.configs.flat.recommended,
  ...reactHooksConfigs.configs.recommended,
  ...importConfigs.configs.recommended,
  ...jsxConfigs.flatConfigs.recommended,
  ...reactConfigs.configs.flat['jsx-runtime'],
  // ...promiseConfigs.configs['flat/recommended'],
  ...fixupConfigRules(electronConfigs),
  plugins: { 'react-refresh': reactRefresh },
  ignorePatterns: ['**/dist/**', '**/node_modules/**', '**/build/**', '**/out/**', '.gitignore'],
  rules: {
    'react-refresh/only-export-components': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'import/no-unresolved': 'off',
    'import/named': 'off',
    'promise/always-return': ['warn', { ignoreLastCallback: true }],
    '@typescript-eslint/no-explicit-any': 'off',
    'react/no-unescaped-entities': 'off',
    '@typescript-eslint/no-unused-vars': 'off'
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    },
    react: {
      version: 'detect'
    }
  }
};
