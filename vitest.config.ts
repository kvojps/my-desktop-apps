import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * `@shared/*` e `@/*` são aliases do `tsconfig.base.json` resolvidos por app
 * (`${configDir}`); o Vite não lê `paths`, então cada import é resolvido aqui
 * a partir do arquivo que importa — subindo até o `src/` do app dele. Assim a
 * suíte cobre lógica pura que se apoia nos helpers de `shared/`, e um mesmo
 * alias nunca aponta para o `shared/` de outro app.
 */
function appSrcOf(importer: string | undefined): string | null {
  let dir = importer ? dirname(importer) : '';
  while (dir && dir !== dirname(dir)) {
    if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'src', 'shared'))) {
      return join(dir, 'src');
    }
    dir = dirname(dir);
  }
  return null;
}

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

function appAlias(find: RegExp, subdir: string) {
  return {
    find,
    replacement: '$1',
    customResolver(source: string, importer?: string) {
      const src = appSrcOf(importer);
      if (!src) return null;
      const base = join(src, subdir, source);
      const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')];
      return candidates.find(isFile) ?? null;
    },
  };
}

/**
 * A suíte cobre só lógica pura — nada que precise de Electron, DOM ou banco.
 * `out/`, `dist/` e `build/` são artefatos dos apps e não entram na varredura.
 */
export default defineConfig({
  resolve: {
    alias: [appAlias(/^@shared\/(.*)$/, 'shared'), appAlias(/^@\/(.*)$/, join('renderer', 'src'))],
  },
  test: {
    include: ['apps/*/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/out/**', '**/dist/**', '**/build/**'],
  },
});
