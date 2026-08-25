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

export function makeScanPathsRepository(db: Database.Database) {
  function findByPath(path: string): ScanPath | null {
    const row = db.prepare('SELECT * FROM scan_paths WHERE path = ?').get(path) as
      ScanPathRow | undefined;
    return row ? rowToScanPath(row) : null;
  }

  return {
    list(): ScanPath[] {
      const rows = db
        .prepare('SELECT * FROM scan_paths ORDER BY created_at ASC')
        .all() as ScanPathRow[];
      return rows.map(rowToScanPath);
    },

    findById(id: string): ScanPath | null {
      const row = db.prepare('SELECT * FROM scan_paths WHERE id = ?').get(id) as
        ScanPathRow | undefined;
      return row ? rowToScanPath(row) : null;
    },

    findByPath,

    create(data: { path: string }): ScanPath {
      // O 409 é decisão de service, não de repositório: sai daqui no ticket 08,
      // quando existir `scanPathsService` para consultar `findByPath` e decidir.
      if (findByPath(data.path)) {
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
    },

    delete(id: string): void {
      db.prepare('DELETE FROM scan_paths WHERE id = ?').run(id);
    },
  };
}

export type ScanPathsRepository = ReturnType<typeof makeScanPathsRepository>;
