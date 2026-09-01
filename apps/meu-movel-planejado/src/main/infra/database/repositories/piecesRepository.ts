import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { PIECE_DOES_NOT_FIT_MESSAGE, fitsAnySheet } from '@shared/nesting/fit';
import type { Piece, PieceInput } from '@shared/types/piece';
import { AppError } from '../../../utils/errors/AppError';
import { getProject, touchProject } from './projectsRepository';
import { listSheets } from './sheetsRepository';

interface PieceRow {
  id: string;
  project_id: string;
  label: string;
  length_tenths_mm: number;
  width_tenths_mm: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

/** A fronteira snake_case → camelCase. Nenhuma chave do banco sai daqui. */
function rowToPiece(row: PieceRow): Piece {
  return {
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    lengthTenthsMm: row.length_tenths_mm,
    widthTenthsMm: row.width_tenths_mm,
    quantity: row.quantity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Na ordem em que foram cadastradas. Uma lista de peças é lida contra o desenho
 * do móvel que está na cabeça de quem digitou — reordená-la por medida ou por
 * rótulo tiraria dela justamente essa correspondência.
 *
 * O desempate é por `rowid`, e não por `id`: duas peças cadastradas no mesmo
 * milissegundo têm o mesmo `created_at`, e o `id` é um uuid sorteado — ordenar
 * por ele embaralharia justamente o par que se quer ver junto. O `rowid` é a
 * ordem de inserção.
 */
export function listPieces(db: Database.Database, projectId: string): Piece[] {
  const rows = db
    .prepare('SELECT * FROM pieces WHERE project_id = ? ORDER BY created_at, rowid')
    .all(projectId) as PieceRow[];
  return rows.map(rowToPiece);
}

function getPieceOrThrow(db: Database.Database, id: string): Piece {
  const row = db.prepare('SELECT * FROM pieces WHERE id = ?').get(id) as PieceRow | undefined;
  if (!row) {
    throw new AppError(404, 'Esta peça não existe mais.');
  }
  return rowToPiece(row);
}

/**
 * Peça maior que qualquer chapa do projeto é barrada no cadastro — aqui, na
 * fronteira de confiança, e não só no formulário. O par assimétrico deixaria
 * passar no main o que a tela recusa, como nos limites de medida do ticket 03.
 *
 * A régua é a mesma que o empacotador usa para rejeitar (`shared/nesting/fit`):
 * duas contas concordando por coincidência divergiriam no dia em que a
 * aritmética do kerf mudasse, e o app barraria o cadastro de uma peça que o
 * plano aceita — ou o contrário.
 *
 * Projeto inexistente não é assunto desta régua: `touchProject` devolve o 404
 * logo adiante, e antecipá-lo aqui duplicaria a decisão.
 */
function assertFitsSomeSheet(db: Database.Database, projectId: string, data: PieceInput): void {
  const project = getProject(db, projectId);
  if (!project) return;
  if (fitsAnySheet(data, listSheets(db, projectId), project)) return;
  // 422 e não 404: o dado é que não serve, e `classifyError` o traduz em
  // `invalid-input`, que é o código cuja mensagem chega inteira à tela.
  throw new AppError(422, PIECE_DOES_NOT_FIT_MESSAGE);
}

/**
 * Cadastrar peça também move o carimbo do projeto, e as duas escritas são uma
 * transação só: um carimbo antigo com peça nova é exatamente o estado em que o
 * app diria que o plano continua em dia quando ele não está.
 */
export function createPiece(db: Database.Database, projectId: string, data: PieceInput): Piece {
  assertFitsSomeSheet(db, projectId, data);

  const now = new Date().toISOString();
  const piece: Piece = { id: randomUUID(), projectId, ...data, createdAt: now, updatedAt: now };

  db.transaction(() => {
    touchProject(db, projectId);
    db.prepare(
      `INSERT INTO pieces (id, project_id, label, length_tenths_mm, width_tenths_mm, quantity,
                           created_at, updated_at)
       VALUES (@id, @projectId, @label, @lengthTenthsMm, @widthTenthsMm, @quantity, @createdAt,
               @updatedAt)`,
    ).run(piece);
  })();

  return piece;
}

export function updatePiece(db: Database.Database, id: string, data: PieceInput): Piece {
  const current = getPieceOrThrow(db, id);
  assertFitsSomeSheet(db, current.projectId, data);

  const updatedAt = new Date().toISOString();

  db.transaction(() => {
    touchProject(db, current.projectId);
    db.prepare(
      `UPDATE pieces SET label = @label, length_tenths_mm = @lengthTenthsMm,
         width_tenths_mm = @widthTenthsMm, quantity = @quantity, updated_at = @updatedAt
       WHERE id = @id`,
    ).run({ id, ...data, updatedAt });
  })();

  return { ...current, ...data, updatedAt };
}

export function deletePiece(db: Database.Database, id: string): void {
  const current = getPieceOrThrow(db, id);

  db.transaction(() => {
    touchProject(db, current.projectId);
    db.prepare('DELETE FROM pieces WHERE id = ?').run(id);
  })();
}
