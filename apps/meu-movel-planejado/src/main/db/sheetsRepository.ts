import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Sheet, SheetInput } from '@shared/types/sheet';
import { AppError } from '../errors/AppError';
import { touchProject } from './projectsRepository';

interface SheetRow {
  id: string;
  project_id: string;
  length_tenths_mm: number;
  width_tenths_mm: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

/** A fronteira snake_case → camelCase. Nenhuma chave do banco sai daqui. */
function rowToSheet(row: SheetRow): Sheet {
  return {
    id: row.id,
    projectId: row.project_id,
    lengthTenthsMm: row.length_tenths_mm,
    widthTenthsMm: row.width_tenths_mm,
    quantity: row.quantity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Na ordem em que foram cadastradas, como as peças. Quem decide a ordem de
 * consumo é o empacotador — menor primeiro, para a chapa inteira sobreviver ao
 * serviço —, e antecipá-la aqui faria a lista prometer um comportamento que
 * ainda não existe.
 *
 * Desempate por `rowid` pela mesma razão que em peça: no mesmo milissegundo, o
 * `id` é um uuid sorteado, e o `rowid` é a ordem de inserção.
 */
export function listSheets(db: Database.Database, projectId: string): Sheet[] {
  const rows = db
    .prepare('SELECT * FROM sheets WHERE project_id = ? ORDER BY created_at, rowid')
    .all(projectId) as SheetRow[];
  return rows.map(rowToSheet);
}

function getSheetOrThrow(db: Database.Database, id: string): Sheet {
  const row = db.prepare('SELECT * FROM sheets WHERE id = ?').get(id) as SheetRow | undefined;
  if (!row) {
    throw new AppError(404, 'Esta chapa não existe mais.');
  }
  return rowToSheet(row);
}

/** Como em peça, a escrita e o carimbo do projeto são uma transação só. */
export function createSheet(db: Database.Database, projectId: string, data: SheetInput): Sheet {
  const now = new Date().toISOString();
  const sheet: Sheet = { id: randomUUID(), projectId, ...data, createdAt: now, updatedAt: now };

  db.transaction(() => {
    touchProject(db, projectId);
    db.prepare(
      `INSERT INTO sheets (id, project_id, length_tenths_mm, width_tenths_mm, quantity,
                           created_at, updated_at)
       VALUES (@id, @projectId, @lengthTenthsMm, @widthTenthsMm, @quantity, @createdAt,
               @updatedAt)`,
    ).run(sheet);
  })();

  return sheet;
}

export function updateSheet(db: Database.Database, id: string, data: SheetInput): Sheet {
  const current = getSheetOrThrow(db, id);
  const updatedAt = new Date().toISOString();

  db.transaction(() => {
    touchProject(db, current.projectId);
    db.prepare(
      `UPDATE sheets SET length_tenths_mm = @lengthTenthsMm, width_tenths_mm = @widthTenthsMm,
         quantity = @quantity, updated_at = @updatedAt
       WHERE id = @id`,
    ).run({ id, ...data, updatedAt });
  })();

  return { ...current, ...data, updatedAt };
}

export function deleteSheet(db: Database.Database, id: string): void {
  const current = getSheetOrThrow(db, id);

  db.transaction(() => {
    touchProject(db, current.projectId);
    db.prepare('DELETE FROM sheets WHERE id = ?').run(id);
  })();
}
