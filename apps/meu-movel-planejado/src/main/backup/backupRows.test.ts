import { describe, expect, it } from 'vitest';
import { importColumns, rowValues } from './backupRows';

/**
 * A conciliação entre as colunas que o arquivo traz e as que a tabela tem hoje.
 *
 * É ela que faz a promessa do formato valer: o backup carrega as linhas cruas
 * das tabelas, e um backup gerado por uma versão anterior do app continua
 * importável mesmo depois de uma migração acrescentar coluna.
 *
 * Os nomes de coluna que entram no SQL saem **sempre** da tabela viva, nunca do
 * arquivo — é o que impede um arquivo forjado de nomear coluna.
 */
describe('importColumns', () => {
  it('usa as colunas que a tabela e o arquivo têm em comum', () => {
    expect(importColumns(['id', 'name', 'material'], [{ id: 'a', name: 'Cozinha' }])).toEqual([
      'id',
      'name',
    ]);
  });

  it('ignora coluna que o arquivo traz e a tabela não tem mais', () => {
    // Backup de uma versão futura, ou de uma coluna removida por migração.
    expect(importColumns(['id', 'name'], [{ id: 'a', name: 'Cozinha', legacy: 1 }])).toEqual([
      'id',
      'name',
    ]);
  });

  it('preserva a ordem da tabela, e não a ordem do arquivo', () => {
    expect(importColumns(['id', 'name', 'material'], [{ material: 'MDF', id: 'a' }])).toEqual([
      'id',
      'material',
    ]);
  });

  it('reúne as colunas de todas as linhas', () => {
    // Arquivo editado à mão pode ter linhas de formatos diferentes; a coluna que
    // aparece em uma linha só continua sendo gravada.
    expect(importColumns(['id', 'name', 'material'], [{ id: 'a' }, { material: 'MDF' }])).toEqual([
      'id',
      'material',
    ]);
  });

  it('não devolve coluna nenhuma para tabela vazia', () => {
    expect(importColumns(['id', 'name'], [])).toEqual([]);
  });
});

describe('rowValues', () => {
  it('devolve um valor por coluna pedida', () => {
    expect(rowValues(['id', 'name'], { id: 'a', name: 'Cozinha' })).toEqual({
      id: 'a',
      name: 'Cozinha',
    });
  });

  it('completa com nulo a coluna que falta na linha', () => {
    // O `better-sqlite3` recusa a gravação se um parâmetro nomeado não for
    // vinculado; sem isto, uma linha mais curta derrubaria a importação inteira.
    expect(rowValues(['id', 'name'], { id: 'a' })).toEqual({ id: 'a', name: null });
  });

  it('descarta o que a linha traz além das colunas pedidas', () => {
    expect(rowValues(['id'], { id: 'a', legacy: 1 })).toEqual({ id: 'a' });
  });
});
