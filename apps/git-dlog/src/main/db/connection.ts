import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';

let db: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS scan_paths (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database has not been initialized yet');
  }
  return db;
}

export function initDb(): Database.Database {
  const dbPath = path.join(app.getPath('userData'), 'git-dlog.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

// Migrações incrementais: o SCHEMA acima cobre instalações novas; para bancos
// já existentes, adicione aqui verificações idempotentes. Exemplo:
//
//   const hasColumn = db
//     .prepare("SELECT 1 FROM pragma_table_info('scan_paths') WHERE name = 'nova_coluna'")
//     .get();
//   if (!hasColumn) {
//     db.exec("ALTER TABLE scan_paths ADD COLUMN nova_coluna TEXT NOT NULL DEFAULT ''");
//   }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function migrate(db: Database.Database): void {}
