import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import { runMigrations } from './migrations';

let db: Database.Database | null = null;
let dbFilePath = '';

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

/** Caminho do banco em disco, exibido na tela de Configurações. */
export function getDbPath(): string {
  return dbFilePath;
}

export function initDb(): Database.Database {
  dbFilePath = path.join(app.getPath('userData'), 'git-dlog.db');
  db = new Database(dbFilePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  runMigrations(db);
  return db;
}
