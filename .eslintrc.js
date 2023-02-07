module.exports = {
  extends: 'erb',
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'error',
    // Since React 17 and typescript 4.1 you can safely disable the rule
    'react/react-in-jsx-scope': 'off',
    'prettier/prettier': [
      'warn',
      {
        endOfLine: 'auto',
      },
    ],
    // custom eslint rules
    'react/require-default-props': [0],
    'no-nested-ternary': 'off',
    'import/no-cycle': 'off',
    'import/no-named-as-default': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'no-undef': 'off',
    'prefer-const': 'warn',
    'import/extensions': ['off'],
    'react/function-component-definition': ['off'],
    // '@typescript-eslint/naming-convention': [
    //   'warn',
    //   {
    //     leadingUnderscore: 'allowSingleOrDouble',
    //     trailingUnderscore: 'allowSingleOrDouble',
    //   },
    // ],
    'react/no-unescaped-entities': [
      'error',
      {
        forbid: [
          {
            char: '>',
            alternatives: ['&gt;'],
          },
          {
            char: '}',
            alternatives: ['&#125;'],
          },
        ],
      },
    ],
    'react/jsx-filename-extension': 'off',
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./.erb/configs/webpack.config.eslint.ts'),
      },
      typescript: {},
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
