import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    // Apps Script roda no Google, com globais próprios (SpreadsheetApp, LockService...).
    files: ['apps-script/**/*.js'],
    languageOptions: {
      globals: {
        SpreadsheetApp: 'readonly',
        LockService: 'readonly',
        ContentService: 'readonly',
        PropertiesService: 'readonly',
        Utilities: 'readonly',
        module: 'writable',
      },
    },
  },
);
