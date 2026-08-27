import Database from 'better-sqlite3';
import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { renameLegacyTables, runMigrations } from './migrations';

let db: Database.Database | null = null;
let dbFilePath = '';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS months (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS default_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  due_day INTEGER,
  amount REAL NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  due_date TEXT,
  amount REAL NOT NULL DEFAULT 0,
  is_paid INTEGER NOT NULL DEFAULT 0,
  paid_at TEXT,
  receipt TEXT,
  notes TEXT,
  bank_account_id INTEGER REFERENCES bank_accounts(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS default_incomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  expected_day INTEGER,
  amount REAL NOT NULL DEFAULT 0,
  bank_account_id INTEGER REFERENCES bank_accounts(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  expected_date TEXT,
  amount REAL NOT NULL DEFAULT 0,
  is_received INTEGER NOT NULL DEFAULT 0,
  received_at TEXT,
  notes TEXT,
  bank_account_id INTEGER REFERENCES bank_accounts(id),
  created_at TEXT DEFAULT (datetime('now'))
);
`;

/**
 * Versões antigas guardavam o banco dentro da pasta do app. Copia uma única vez
 * para a pasta de dados do usuário, antes de qualquer conexão.
 */
function migrateLegacyDataIfNeeded(dbPath: string, uploadsDir: string) {
  if (fs.existsSync(dbPath)) return;

  const legacyDb = path.join(app.getAppPath(), 'data.db');
  if (!fs.existsSync(legacyDb)) return;

  for (const ext of ['', '-wal', '-shm']) {
    const src = legacyDb + ext;
    if (fs.existsSync(src)) fs.copyFileSync(src, dbPath + ext);
  }

  const legacyUploads = path.join(app.getAppPath(), 'backend', 'uploads');
  if (fs.existsSync(legacyUploads)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    for (const file of fs.readdirSync(legacyUploads)) {
      fs.copyFileSync(path.join(legacyUploads, file), path.join(uploadsDir, file));
    }
  }

  console.log('[migration] Dados legados copiados para', dbPath);
}

export function getUploadsDir(): string {
  return path.join(app.getPath('userData'), 'uploads');
}

/** Caminho do banco em disco, exibido na tela de Configurações. */
export function getDbPath(): string {
  return dbFilePath;
}

export function initDb(): Database.Database {
  dbFilePath = path.join(app.getPath('userData'), 'meu-dinheiro.db');
  const uploadsDir = getUploadsDir();

  migrateLegacyDataIfNeeded(dbFilePath, uploadsDir);

  fs.mkdirSync(uploadsDir, { recursive: true });

  db = new Database(dbFilePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Precisa vir antes do SCHEMA, e por isso não é uma migração comum: o
  // `CREATE TABLE IF NOT EXISTS expenses` criaria a tabela nova vazia e o
  // rename de `accounts` não teria mais para onde ir, deixando os dados
  // antigos órfãos numa tabela que ninguém mais lê.
  renameLegacyTables(db);

  db.exec(SCHEMA);
  runMigrations(db);

  return db;
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database has not been initialized yet');
  }
  return db;
}
