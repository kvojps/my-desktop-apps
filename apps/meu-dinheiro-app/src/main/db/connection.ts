import Database from 'better-sqlite3';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

let db: Database.Database;

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

function migrateLegacyTableNames() {
  const tableExists = (name: string) =>
    !!db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name);

  if (tableExists('default_accounts') && !tableExists('default_expenses')) {
    db.exec('ALTER TABLE default_accounts RENAME TO default_expenses');
  }
  if (tableExists('accounts') && !tableExists('expenses')) {
    db.exec('ALTER TABLE accounts RENAME TO expenses');
  }
}

function ensureExpenseBankAccountColumn() {
  const columns = db.prepare('PRAGMA table_info(expenses)').all() as { name: string }[];
  if (!columns.some((c) => c.name === 'bank_account_id')) {
    db.exec('ALTER TABLE expenses ADD COLUMN bank_account_id INTEGER REFERENCES bank_accounts(id)');
  }
}

function ensureDefaultIncomeBankAccountColumn() {
  const columns = db.prepare('PRAGMA table_info(default_incomes)').all() as { name: string }[];
  if (!columns.some((c) => c.name === 'bank_account_id')) {
    db.exec(
      'ALTER TABLE default_incomes ADD COLUMN bank_account_id INTEGER REFERENCES bank_accounts(id)',
    );
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

function ensureCategoriesTable() {
  const tableExists = !!db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'categories'")
    .get();

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  if (!tableExists) {
    const insert = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)');
    for (const category of DEFAULT_CATEGORIES) {
      insert.run(category.name, category.color);
    }
  }
}

function ensureExpenseCategoryColumn() {
  const columns = db.prepare('PRAGMA table_info(expenses)').all() as { name: string }[];
  if (!columns.some((c) => c.name === 'category_id')) {
    db.exec('ALTER TABLE expenses ADD COLUMN category_id INTEGER REFERENCES categories(id)');
  }
}

function ensureDefaultExpenseCategoryColumn() {
  const columns = db.prepare('PRAGMA table_info(default_expenses)').all() as { name: string }[];
  if (!columns.some((c) => c.name === 'category_id')) {
    db.exec(
      'ALTER TABLE default_expenses ADD COLUMN category_id INTEGER REFERENCES categories(id)',
    );
  }
}

function initializeSchema() {
  migrateLegacyTableNames();

  db.exec(`
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
  `);

  ensureExpenseBankAccountColumn();
  ensureDefaultIncomeBankAccountColumn();
  ensureCategoriesTable();
  ensureExpenseCategoryColumn();
  ensureDefaultExpenseCategoryColumn();
}

export function getUploadsDir(): string {
  return path.join(app.getPath('userData'), 'uploads');
}

export function initDb(): Database.Database {
  const dbPath = path.join(app.getPath('userData'), 'meu-dinheiro.db');
  const uploadsDir = getUploadsDir();

  migrateLegacyDataIfNeeded(dbPath, uploadsDir);

  fs.mkdirSync(uploadsDir, { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initializeSchema();

  return db;
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database has not been initialized yet');
  }
  return db;
}
