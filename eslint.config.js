import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'readonly',
        strapi: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['config/**/*.js'],
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^env$', varsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: [
      'node_modules/',
      'build/',
      'dist/',
      '.strapi/',
      'data/',
      'public/uploads/',
      '*.config.js',
      'types/generated/',
    ],
  },
];
