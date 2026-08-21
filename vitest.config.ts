import { defineConfig } from 'vitest/config';

/**
 * A suíte cobre só lógica pura — nada que precise de Electron, DOM ou banco.
 * `out/`, `dist/` e `build/` são artefatos dos apps e não entram na varredura.
 */
export default defineConfig({
  test: {
    include: ['apps/*/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/out/**', '**/dist/**', '**/build/**'],
  },
});
