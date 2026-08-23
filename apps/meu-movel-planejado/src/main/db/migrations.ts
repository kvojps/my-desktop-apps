import type Database from 'better-sqlite3';

/**
 * Migrações incrementais do banco.
 *
 * `SCHEMA`, em `connection.ts`, cobre instalações novas; aqui ficam as
 * alterações em bancos que já existem. Cada migração roda uma vez por banco,
 * na ordem do array, e o `id` da última aplicada fica gravado em
 * `PRAGMA user_version`.
 *
 * Duas regras, ambas por causa dos bancos que já estão instalados na máquina
 * dos usuários (todos com `user_version = 0`, o que faz a lista inteira rodar
 * neles na primeira atualização):
 *
 * 1. Cada `up` precisa ser idempotente — verifique antes de alterar
 *    (`pragma_table_info`, `sqlite_master`), nunca um `ALTER TABLE` seco.
 * 2. `id` é sequencial e definitivo: não reordene, não reaproveite e não
 *    edite uma migração já publicada. Corrija com uma nova.
 */
interface Migration {
  id: number;
  name: string;
  up: (db: Database.Database) => void;
}

const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: 'plans.reference_sheet',
    // O déficit já era gravado em área e em número de chapas, mas não dizia
    // **qual formato** entrou na divisão — e sem isso a tela não tem como
    // dizer "pelo menos N chapas de 2750 × 1850". Nulo nos planos que já
    // existiam: eles foram gerados sem essa informação, e inventá-la a partir
    // do estoque de hoje contaria uma chapa que pode nem existir mais.
    up: (db) => {
      if (!hasColumn(db, 'plans', 'reference_length_tenths_mm')) {
        db.exec('ALTER TABLE plans ADD COLUMN reference_length_tenths_mm INTEGER');
      }
      if (!hasColumn(db, 'plans', 'reference_width_tenths_mm')) {
        db.exec('ALTER TABLE plans ADD COLUMN reference_width_tenths_mm INTEGER');
      }
    },
  },
];

/** Helper de idempotência: a coluna já existe nesta tabela? */
export function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return columns.some((c) => c.name === column);
}

/** Helper de idempotência: a tabela já existe? */
export function hasTable(db: Database.Database, table: string): boolean {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
}

export function runMigrations(db: Database.Database): void {
  const current = db.pragma('user_version', { simple: true }) as number;

  for (const migration of MIGRATIONS) {
    if (migration.id <= current) continue;

    const apply = db.transaction(() => {
      migration.up(db);
      // PRAGMA não aceita parâmetro vinculado; o id vem do array acima, nunca
      // de entrada externa.
      db.pragma(`user_version = ${migration.id}`);
    });
    apply();
  }
}
