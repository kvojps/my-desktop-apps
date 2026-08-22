import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import { runMigrations } from './migrations';

let db: Database.Database | null = null;
let dbFilePath = '';

/**
 * Schema de instalação nova, completo desde a primeira versão: o plano de corte
 * e suas tabelas nascem aqui, mesmo antes de existir a tela que os preenche.
 *
 * Duas convenções valem para o arquivo inteiro:
 *
 * - **Medida é sempre décimo de milímetro, como inteiro** (`*_tenths_mm`).
 *   `2750 mm` é `27500`. Ponto flutuante transformaria "cabe exatamente" em
 *   "não cabe por 0,0000001 mm", e o empacotamento é feito dessas comparações.
 * - **O plano é snapshot, não derivação.** As tabelas do plano não apontam para
 *   `pieces` nem para `sheets`: elas copiam rótulo e medida. Uma chapa excluída
 *   depois da geração não pode apagar a folha que já foi impressa e levada à
 *   bancada.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  material TEXT NOT NULL,
  kerf_tenths_mm INTEGER NOT NULL,
  trim_tenths_mm INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pieces (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  length_tenths_mm INTEGER NOT NULL,
  width_tenths_mm INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pieces_project_id ON pieces (project_id);

CREATE TABLE IF NOT EXISTS sheets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  length_tenths_mm INTEGER NOT NULL,
  width_tenths_mm INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sheets_project_id ON sheets (project_id);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  generated_at TEXT NOT NULL,
  project_updated_at TEXT NOT NULL,
  kerf_tenths_mm INTEGER NOT NULL,
  trim_tenths_mm INTEGER NOT NULL,
  utilization REAL NOT NULL,
  deficit_area_tenths_mm2 INTEGER NOT NULL,
  equivalent_sheets INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS planned_sheets (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  sheet_index INTEGER NOT NULL,
  length_tenths_mm INTEGER NOT NULL,
  width_tenths_mm INTEGER NOT NULL,
  utilization REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_planned_sheets_plan_id ON planned_sheets (plan_id);

CREATE TABLE IF NOT EXISTS placements (
  id TEXT PRIMARY KEY,
  planned_sheet_id TEXT NOT NULL REFERENCES planned_sheets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  length_tenths_mm INTEGER NOT NULL,
  width_tenths_mm INTEGER NOT NULL,
  x_tenths_mm INTEGER NOT NULL,
  y_tenths_mm INTEGER NOT NULL,
  rotated INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_placements_planned_sheet_id ON placements (planned_sheet_id);

CREATE TABLE IF NOT EXISTS unallocated_pieces (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  length_tenths_mm INTEGER NOT NULL,
  width_tenths_mm INTEGER NOT NULL,
  quantity INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_unallocated_pieces_plan_id ON unallocated_pieces (plan_id);

CREATE TABLE IF NOT EXISTS rejected_pieces (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  length_tenths_mm INTEGER NOT NULL,
  width_tenths_mm INTEGER NOT NULL,
  quantity INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rejected_pieces_plan_id ON rejected_pieces (plan_id);

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
  dbFilePath = path.join(app.getPath('userData'), 'meu-movel-planejado.db');
  db = new Database(dbFilePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  runMigrations(db);
  return db;
}
