import { describe, expect, it } from 'vitest';
import { BACKUP_TABLES } from '../../infra/database/repositories/backupRepository';
import { BACKUP_APP, BACKUP_VERSION, backupSchema } from './backup.schema';

/**
 * O portão de entrada da importação. O que ele recusa nunca chega ao banco, e o
 * que ele aceita será gravado por cima de tudo que o usuário tem — não há
 * segunda chance depois daqui.
 *
 * O caso que importa não é o arquivo aleatório: é o **backup do app vizinho**.
 * Os apps do monorepo geram arquivos parecidos, e o do Meu Dinheiro também é um
 * JSON com `version: 1` e `exported_at`. Recusá-lo é o que impede a importação
 * de esvaziar o banco antes de descobrir que não havia nada para pôr no lugar.
 */

function validFile(overrides: Record<string, unknown> = {}) {
  const tables = Object.fromEntries(BACKUP_TABLES.map((table) => [table, []]));
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exported_at: '2026-08-24T18:00:00.000Z',
    ...tables,
    ...overrides,
  };
}

describe('backupSchema', () => {
  it('aceita um arquivo gerado pelo próprio app', () => {
    expect(backupSchema.safeParse(validFile()).success).toBe(true);
  });

  it('aceita as linhas cruas das tabelas', () => {
    const file = validFile({
      projects: [
        {
          id: 'p1',
          name: 'Cozinha da Ana',
          material: 'MDF 18mm',
          kerf_tenths_mm: 3,
          trim_tenths_mm: 100,
          created_at: '2026-08-24T18:00:00.000Z',
          updated_at: '2026-08-24T18:00:00.000Z',
        },
      ],
      plans: [{ id: 'pl1', project_id: 'p1', reference_length_tenths_mm: null }],
    });

    expect(backupSchema.safeParse(file).success).toBe(true);
  });

  it('recusa o backup de outro app do monorepo', () => {
    // O do Meu Dinheiro: mesma versão, mesmo `exported_at`, outras tabelas.
    const otherApp = {
      version: 1,
      exported_at: '2026-08-24T18:00:00.000Z',
      months: [],
      expenses: [],
      categories: [],
    };

    expect(backupSchema.safeParse(otherApp).success).toBe(false);
  });

  it('recusa arquivo de uma versão que este app não conhece', () => {
    expect(backupSchema.safeParse(validFile({ version: 99 })).success).toBe(false);
  });

  it('recusa arquivo a que falta uma das tabelas', () => {
    // Tabela ausente não é tabela vazia: importar apagaria o que havia nela sem
    // ter o que gravar de volta.
    const incomplete = validFile();
    delete (incomplete as Record<string, unknown>).pieces;

    expect(backupSchema.safeParse(incomplete).success).toBe(false);
  });

  it('recusa o que nem objeto é', () => {
    for (const value of [null, 'texto', 42, []]) {
      expect(backupSchema.safeParse(value).success, JSON.stringify(value)).toBe(false);
    }
  });

  it('recusa linha com valor que não cabe numa coluna do SQLite', () => {
    const nested = validFile({ projects: [{ id: 'p1', name: { first: 'Ana' } }] });

    expect(backupSchema.safeParse(nested).success).toBe(false);
  });

  it('aceita coluna que este app ainda não conhece', () => {
    // Backup de uma versão mais nova: a coluna a mais é descartada na gravação,
    // e não recusada aqui — recusar tornaria o arquivo inútil por completo.
    const file = validFile({ projects: [{ id: 'p1', coluna_futura: 'x' }] });

    expect(backupSchema.safeParse(file).success).toBe(true);
  });

  it('cobre exatamente as tabelas que a exportação grava', () => {
    // As duas listas se separando em silêncio é a falha que não avisa: a tabela
    // exportada e não validada entraria sem conferência, e a validada e não
    // exportada tornaria todo arquivo inválido.
    const parsed: Record<string, unknown> = backupSchema.parse(validFile());
    const validated = Object.keys(parsed).filter((key) => Array.isArray(parsed[key]));

    expect(new Set(validated)).toEqual(new Set(BACKUP_TABLES));
  });
});
