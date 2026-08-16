import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules', '**/out', '**/dist', '**/build'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      'apps/*/src/main/**/*.ts',
      'apps/*/src/preload/**/*.ts',
      'apps/*/electron.vite.config.ts',
    ],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/*/src/renderer/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  prettier,
);
