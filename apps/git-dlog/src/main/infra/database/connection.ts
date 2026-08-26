import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import { runMigrations } from './migrations';

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

/**
 * Abre o banco e devolve a conexão a quem a pediu — o `index.ts`, uma única
 * vez. Não existe getter de módulo aqui de propósito: a conexão desce por
 * parâmetro até `makeRepositories(db)`, e um `getDb()` global seria o atalho
 * que permitiria a qualquer camada alcançar o banco por fora da unidade de
 * trabalho (ADR-0002).
 */
export function initDb(): Database.Database {
  const db = new Database(path.join(app.getPath('userData'), 'git-dlog.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  runMigrations(db);
  return db;
}
