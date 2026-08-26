import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { ScanPathEntity } from '../../../domain/scanPath';

interface ScanPathRow {
  id: string;
  path: string;
  created_at: string;
  updated_at: string;
}

function rowToScanPath(row: ScanPathRow): ScanPathEntity {
  return {
    id: row.id,
    path: row.path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function makeScanPathsRepository(db: Database.Database) {
  return {
    list(): ScanPathEntity[] {
      const rows = db
        .prepare('SELECT * FROM scan_paths ORDER BY created_at ASC')
        .all() as ScanPathRow[];
      return rows.map(rowToScanPath);
    },

    findById(id: string): ScanPathEntity | null {
      const row = db.prepare('SELECT * FROM scan_paths WHERE id = ?').get(id) as
        ScanPathRow | undefined;
      return row ? rowToScanPath(row) : null;
    },

    /** Quem consulta é o `scanPathsService`, para decidir o 409 de duplicata. */
    findByPath(path: string): ScanPathEntity | null {
      const row = db.prepare('SELECT * FROM scan_paths WHERE path = ?').get(path) as
        ScanPathRow | undefined;
      return row ? rowToScanPath(row) : null;
    },

    create(data: { path: string }): ScanPathEntity {
      const now = new Date().toISOString();
      const scanPath: ScanPathEntity = {
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
