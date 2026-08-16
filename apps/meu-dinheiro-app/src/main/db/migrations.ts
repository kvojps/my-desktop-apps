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

/** Helper de idempotência: a coluna já existe nesta tabela? */
export function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return columns.some((c) => c.name === column);
}

/** Helper de idempotência: a tabela já existe? */
export function hasTable(db: Database.Database, table: string): boolean {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
}

/**
 * Renomeações herdadas do vocabulário antigo (`accounts` virou `expenses`).
 * Chamada por `initDb` antes do SCHEMA — veja o comentário lá.
 */
export function renameLegacyTables(db: Database.Database): void {
  if (hasTable(db, 'default_accounts') && !hasTable(db, 'default_expenses')) {
    db.exec('ALTER TABLE default_accounts RENAME TO default_expenses');
  }
  if (hasTable(db, 'accounts') && !hasTable(db, 'expenses')) {
    db.exec('ALTER TABLE accounts RENAME TO expenses');
  }
}

const DEFAULT_CATEGORIES: { name: string; color: string }[] = [
  { name: 'Moradia', color: '#5C6BC0' },
  { name: 'Alimentação', color: '#FB8C00' },
  { name: 'Transporte', color: '#1E88E5' },
  { name: 'Saúde', color: '#E53935' },
  { name: 'Educação', color: '#7B1FA2' },
  { name: 'Lazer', color: '#43A047' },
  { name: 'Assinaturas', color: '#00ACC1' },
  { name: 'Compras', color: '#D81B60' },
  { name: 'Contas e Serviços', color: '#B85C38' },
  { name: 'Outros', color: '#757575' },
];

const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: 'expenses.bank_account_id',
    up: (db) => {
      if (!hasColumn(db, 'expenses', 'bank_account_id')) {
        db.exec(
          'ALTER TABLE expenses ADD COLUMN bank_account_id INTEGER REFERENCES bank_accounts(id)',
        );
      }
    },
  },
  {
    id: 2,
    name: 'default_incomes.bank_account_id',
    up: (db) => {
      if (!hasColumn(db, 'default_incomes', 'bank_account_id')) {
        db.exec(
          'ALTER TABLE default_incomes ADD COLUMN bank_account_id INTEGER REFERENCES bank_accounts(id)',
        );
      }
    },
  },
  {
    id: 3,
    name: 'categories',
    up: (db) => {
      // A semeadura acontece só na criação da tabela: num banco que já tem
      // categorias, repor as padrão ressuscitaria o que o usuário apagou.
      const existed = hasTable(db, 'categories');

      db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);

      if (!existed) {
        const insert = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)');
        for (const category of DEFAULT_CATEGORIES) {
          insert.run(category.name, category.color);
        }
      }
    },
  },
  {
    id: 4,
    name: 'expenses.category_id',
    up: (db) => {
      if (!hasColumn(db, 'expenses', 'category_id')) {
        db.exec('ALTER TABLE expenses ADD COLUMN category_id INTEGER REFERENCES categories(id)');
      }
    },
  },
  {
    id: 5,
    name: 'default_expenses.category_id',
    up: (db) => {
      if (!hasColumn(db, 'default_expenses', 'category_id')) {
        db.exec(
          'ALTER TABLE default_expenses ADD COLUMN category_id INTEGER REFERENCES categories(id)',
        );
      }
    },
  },
];

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
