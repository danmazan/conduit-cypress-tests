const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const cypressPlugin = require('eslint-plugin-cypress');
const prettierConfig = require('eslint-config-prettier');
import chaiFriendly from 'eslint-plugin-chai-friendly';

module.exports = [
  {
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
  js.configs.recommended,
  ...(Array.isArray(cypressPlugin.configs.recommended)
    ? cypressPlugin.configs.recommended
    : [cypressPlugin.configs.recommended]),
  {
    files: ['cypress/**/*.ts', 'cypress.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'chai-friendly': chaiFriendly,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  chaiFriendly.configs.recommended,
  prettierConfig,
];