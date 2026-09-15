import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getThemeVariables } from './index';

/**
 * A tabela de docs/orca-theme.md é a fonte; `getThemeVariables` é o que o
 * renderer publica. Os dois já divergiram uma vez (issue 01: a paleta do tema
 * antigo passou por Orca porque ninguém conferiu), e é isso que este teste
 * impede. O terceiro lado — o fundo que o processo main pinta na janela — é
 * conferido contra a mesma tabela em `main/domain/theme.test.ts`.
 */
const doc = readFileSync(new URL('../../../../docs/orca-theme.md', import.meta.url), 'utf8');

/** As linhas `| nome | claro | escuro |` da primeira tabela após o título. */
function tableAfter(heading: string): Array<{ name: string; light: string; dark: string }> {
  const start = doc.indexOf(heading);
  expect(start, heading).toBeGreaterThanOrEqual(0);
  const body = doc.slice(start).split(/\n(?=#)/)[0];
  return body
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .map(([, name, light, dark]) => ({ name: name.split(' ')[0], light, dark }))
    .filter((row) => row.light !== 'Claro' && !row.light.startsWith('---'));
}

/** A tabela escreve `#rrggbb` entre crases e os valores sem hex por extenso. */
function value(cell: string): string {
  if (cell === 'preto 87%') return 'rgba(0, 0, 0, 0.87)';
  if (cell === 'branco') return '#ffffff';
  return cell.replace(/`/g, '');
}

/** A coluna "Rótulo claro/escuro" da tabela de ladrilhos: "branco / preto 87%" ou um valor só para os dois modos. */
function labelPair(cell: string): { light: string; dark: string } {
  const [light, dark = light] = cell.split(' / ').map((part) => value(part.trim()));
  return { light, dark };
}

/** As linhas cruas de uma tabela, com todas as células. */
function rowsAfter(heading: string): string[][] {
  const start = doc.indexOf(heading);
  const body = doc.slice(start).split(/\n(?=#)/)[0];
  return body
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .filter((cells) => cells[2] !== 'Claro' && !cells[2].startsWith('---'));
}

const light = getThemeVariables('light') as Record<string, string>;
const dark = getThemeVariables('dark') as Record<string, string>;

describe('docs/orca-theme.md and getThemeVariables agree', () => {
  it('on every token of the main table, in both modes', () => {
    const rows = tableAfter('## Tokens locais');
    expect(rows.length).toBeGreaterThanOrEqual(16);
    for (const row of rows) {
      expect(light[`--negocio-${row.name}`], row.name).toBe(value(row.light));
      expect(dark[`--negocio-${row.name}`], row.name).toBe(value(row.dark));
    }
  });

  it('on the tile fills', () => {
    const rows = tableAfter('### Identidade de indicador');
    expect(rows.length).toBe(6);
    for (const row of rows) {
      expect(light[`--negocio-tile-${row.name}`], row.name).toBe(value(row.light));
      expect(dark[`--negocio-tile-${row.name}`], row.name).toBe(value(row.dark));
    }
  });

  it('on the chart series', () => {
    const rows = tableAfter('### Gráficos');
    expect(rows.length).toBe(6);
    for (const row of rows) {
      expect(light[`--negocio-series-${row.name}`], row.name).toBe(value(row.light));
      expect(dark[`--negocio-series-${row.name}`], row.name).toBe(value(row.dark));
    }
  });

  it('on the declared label over each tile, and the amber pair that mirrors it', () => {
    const rows = rowsAfter('### Identidade de indicador');
    expect(rows.length).toBe(6);
    for (const [, accent, , , label] of rows) {
      const pair = labelPair(label);
      expect(light[`--negocio-tile-${accent}-label`], accent).toBe(pair.light);
      expect(dark[`--negocio-tile-${accent}-label`], accent).toBe(pair.dark);
    }
    // Âmbar é só preenchimento (§1.4): `--negocio-warning` é o ladrilho, e o
    // rótulo sobre ele é o mesmo par declarado.
    for (const vars of [light, dark]) {
      expect(vars['--negocio-warning']).toBe(vars['--negocio-tile-warning']);
      expect(vars['--negocio-on-warning']).toBe(vars['--negocio-tile-warning-label']);
    }
  });

  // A outra direção: nada é publicado sem estar na tabela. Uma variável nova
  // sem linha no documento falha aqui, e não só quando alguém lembrar de olhar.
  it('publishes exactly the documented variables, plus the two font stacks', () => {
    const documented = [
      ...tableAfter('## Tokens locais').map((row) => `--negocio-${row.name}`),
      ...tableAfter('### Identidade de indicador').flatMap((row) => [
        `--negocio-tile-${row.name}`,
        `--negocio-tile-${row.name}-label`,
      ]),
      ...tableAfter('### Gráficos').map((row) => `--negocio-series-${row.name}`),
      '--negocio-warning',
      '--negocio-on-warning',
      '--negocio-font',
      '--negocio-mono',
    ];
    expect(Object.keys(light).sort()).toEqual([...new Set(documented)].sort());
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });
});
