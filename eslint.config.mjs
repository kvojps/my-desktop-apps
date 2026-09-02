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

      // Fronteira do IPC (README, §2.4). O renderer fala com o main por uma fachada
      // só; o resto chama métodos comuns e não conhece o formato do erro do IPC.
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'api',
          message:
            'Só `api/client.ts` conhece `window.api`. Use a fachada `@/api/client` (README, §2.4).',
        },
      ],
      // A outra metade da mesma fronteira: módulo do `main` que não depende de
      // `electron` importa sem erro no renderer e duplica o domínio em silêncio —
      // decidir o que atravessa o IPC é do main (ADR-0003).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Os dois caminhos que alcançam `src/main` de dentro do renderer.
              // Ancorados em `..` e em `@/` para não alcançar nome de pacote.
              group: ['../**/main/**', '@/**/main/**'],
              message:
                'O renderer não importa de `src/main`. O que atravessa o IPC entra por `@shared/` ou pela fachada `@/api/client` (ADR-0003).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/*/src/renderer/src/api/client.ts'],
    rules: { 'no-restricted-properties': 'off' },
  },
  prettier,
);
