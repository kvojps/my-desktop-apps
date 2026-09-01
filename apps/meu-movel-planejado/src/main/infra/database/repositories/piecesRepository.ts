import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Piece, PieceInput } from '@shared/types/piece';

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

export function makePiecesRepository(db: Database.Database) {
  function findById(id: string): Piece | null {
    const row = db.prepare('SELECT * FROM pieces WHERE id = ?').get(id) as PieceRow | undefined;
    return row ? rowToPiece(row) : null;
  }

  return {
    /**
     * Na ordem em que foram cadastradas. Uma lista de peças é lida contra o
     * desenho do móvel que está na cabeça de quem digitou — reordená-la por
     * medida ou por rótulo tiraria dela justamente essa correspondência.
     *
     * O desempate é por `rowid`, e não por `id`: duas peças cadastradas no mesmo
     * milissegundo têm o mesmo `created_at`, e o `id` é um uuid sorteado —
     * ordenar por ele embaralharia justamente o par que se quer ver junto. O
     * `rowid` é a ordem de inserção.
     */
    listForProject(projectId: string): Piece[] {
      const rows = db
        .prepare('SELECT * FROM pieces WHERE project_id = ? ORDER BY created_at, rowid')
        .all(projectId) as PieceRow[];
      return rows.map(rowToPiece);
    },

    findById,

    /**
     * Só a escrita da peça. Mover o carimbo do projeto na mesma transação — para
     * que um carimbo antigo com peça nova nunca exista — é composição de quem
     * chama; a régua da rejeição (a peça grande demais) também.
     */
    create(projectId: string, data: PieceInput): Piece {
      const now = new Date().toISOString();
      const piece: Piece = { id: randomUUID(), projectId, ...data, createdAt: now, updatedAt: now };

      db.prepare(
        `INSERT INTO pieces (id, project_id, label, length_tenths_mm, width_tenths_mm, quantity,
                             created_at, updated_at)
         VALUES (@id, @projectId, @label, @lengthTenthsMm, @widthTenthsMm, @quantity, @createdAt,
                 @updatedAt)`,
      ).run(piece);

      return piece;
    },

    /** `null` quando a peça não existe mais; o 404 é de quem chama. */
    update(id: string, data: PieceInput): Piece | null {
      const current = findById(id);
      if (!current) return null;

      const updatedAt = new Date().toISOString();
      db.prepare(
        `UPDATE pieces SET label = @label, length_tenths_mm = @lengthTenthsMm,
           width_tenths_mm = @widthTenthsMm, quantity = @quantity, updated_at = @updatedAt
         WHERE id = @id`,
      ).run({ id, ...data, updatedAt });

      return { ...current, ...data, updatedAt };
    },

    /** `false` quando a linha já não existia. */
    delete(id: string): boolean {
      const result = db.prepare('DELETE FROM pieces WHERE id = ?').run(id);
      return result.changes > 0;
    },
  };
}

export type PiecesRepository = ReturnType<typeof makePiecesRepository>;
