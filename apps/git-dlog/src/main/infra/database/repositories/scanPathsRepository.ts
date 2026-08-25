import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { ScanPath } from '@shared/types/scanPath';
import { AppError } from '../../../utils/errors/AppError';

interface ScanPathRow {
  id: string;
  path: string;
  created_at: string;
  updated_at: string;
}

function rowToScanPath(row: ScanPathRow): ScanPath {
  return {
    id: row.id,
    path: row.path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllScanPaths(db: Database.Database): ScanPath[] {
  const rows = db
    .prepare('SELECT * FROM scan_paths ORDER BY created_at ASC')
    .all() as ScanPathRow[];
  return rows.map(rowToScanPath);
}

export function addScanPath(db: Database.Database, data: { path: string }): ScanPath {
  const existing = db.prepare('SELECT 1 FROM scan_paths WHERE path = ?').get(data.path);
  if (existing) {
    throw new AppError(409, `Diretório já cadastrado: ${data.path}`);
  }

  const now = new Date().toISOString();
  const scanPath: ScanPath = {
    id: randomUUID(),
    path: data.path,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO scan_paths (id, path, created_at, updated_at)
     VALUES (@id, @path, @createdAt, @updatedAt)`,
  ).run(scanPath);

  return scanPath;
}

export function deleteScanPath(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM scan_paths WHERE id = ?').run(id);
}
