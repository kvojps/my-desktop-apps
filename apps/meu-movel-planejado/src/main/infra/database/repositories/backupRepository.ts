import type Database from 'better-sqlite3';
import {
  BACKUP_APP,
  BACKUP_VERSION,
  type BackupFile,
} from '../../../controllers/schemas/backup.schema';
import { AppError } from '../../../utils/errors/AppError';
import { type BackupRow, importColumns, rowValues } from '../backupRows';

/**
 * O backup do app inteiro: as **linhas cruas** de todas as tabelas de dados,
 * exatamente como o SQLite as guarda, com as chaves em `snake_case`.
 *
 * A escolha é deliberada e é o que mantém backups antigos importáveis. Um
 * arquivo de objetos de domínio ficaria preso ao formato dos tipos do app, e
 * toda renomeação de campo exigiria um tradutor por versão de arquivo; a linha
 * crua acompanha a tabela, e uma coluna acrescentada por migração entra sozinha
 * na exportação; num arquivo anterior a ela, a coluna não aparece em linha
 * nenhuma e fica de fora da gravação, com o default da tabela valendo
 * (`../backup/backupRows`).
 *
 * O que o backup **não** carrega é a tabela `settings`: ali mora a preferência
 * de tema, que é da máquina e não do serviço. Restaurar um backup em outro
 * computador não deve levar junto o modo escuro do computador de origem.
 */

/**
 * As tabelas de dados, na ordem em que uma referência pode ser satisfeita —
 * pai antes de filho. A importação grava nesta ordem e apaga na ordem inversa,
 * com as chaves estrangeiras ligadas: um arquivo inconsistente é recusado pelo
 * próprio banco, em vez de entrar pela metade.
 */
export const BACKUP_TABLES = [
  'projects',
  'pieces',
  'sheets',
  'plans',
  'planned_sheets',
  'placements',
  'unallocated_pieces',
  'rejected_pieces',
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];

/**
 * As colunas que a tabela tem **neste** banco. É daqui que saem os
 * identificadores que entram no SQL da importação — nunca do arquivo, que é
 * entrada externa e não pode nomear coluna.
 */
function tableColumns(db: Database.Database, table: BackupTable): string[] {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.map((row) => row.name);
}

function insertRows(db: Database.Database, table: BackupTable, rows: readonly BackupRow[]): void {
  if (rows.length === 0) return;

  const columns = importColumns(tableColumns(db, table), rows);
  if (columns.length === 0) {
    throw new AppError(400, `O arquivo traz linhas em "${table}" sem nenhuma coluna conhecida.`);
  }

  const statement = db.prepare(
    `INSERT INTO ${table} (${columns.join(', ')})
     VALUES (${columns.map((column) => `@${column}`).join(', ')})`,
  );

  for (const row of rows) statement.run(rowValues(columns, row));
}

export function makeBackupRepository(db: Database.Database) {
  return {
    /**
     * Toda linha de toda tabela, na ordem de inserção (`rowid`).
     *
     * A ordem importa no plano: é dela que sai o número de cada peça na legenda
     * do desenho, e um backup que a embaralhasse devolveria um plano com a
     * legenda trocada em relação ao papel que já foi para a bancada.
     */
    exportRows(): BackupFile {
      const read = (table: BackupTable) =>
        db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all() as BackupRow[];

      // As tabelas são escritas uma a uma, e não varridas a partir de
      // `BACKUP_TABLES`, porque é o `tsc` que precisa cobrar a lista: o tipo vem
      // do schema, então uma tabela declarada lá e esquecida aqui não compila.
      return {
        app: BACKUP_APP,
        version: BACKUP_VERSION,
        exported_at: new Date().toISOString(),
        projects: read('projects'),
        pieces: read('pieces'),
        sheets: read('sheets'),
        plans: read('plans'),
        planned_sheets: read('planned_sheets'),
        placements: read('placements'),
        unallocated_pieces: read('unallocated_pieces'),
        rejected_pieces: read('rejected_pieces'),
      };
    },

    /**
     * Substitui **todo** o conteúdo do banco pelo do arquivo.
     *
     * Não abre transação: quem chama envolve a chamada numa `repos.transaction`,
     * e é isso que garante que uma falha no meio — chave estrangeira órfã, coluna
     * `NOT NULL` ausente, disco cheio — devolva o banco intacto. É o que permite
     * à tela prometer que nada foi alterado quando a importação é recusada, e a
     * única razão pela qual uma ação irreversível pode ser oferecida com
     * segurança.
     *
     * O apagamento é explícito, tabela por tabela na ordem inversa, e não
     * delegado ao `ON DELETE CASCADE` de `projects`: o efeito fica escrito onde
     * ele acontece, em vez de depender de o schema continuar cascateando amanhã.
     */
    importRows(file: BackupFile): void {
      for (const table of [...BACKUP_TABLES].reverse()) {
        db.prepare(`DELETE FROM ${table}`).run();
      }

      for (const table of BACKUP_TABLES) {
        insertRows(db, table, file[table]);
      }
    },
  };
}

export type BackupRepository = ReturnType<typeof makeBackupRepository>;
