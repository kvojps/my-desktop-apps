import Database from 'better-sqlite3';
import type { DefaultIncomeEntity } from '../../../domain/defaultIncome';

/** Colunas cruas da tabela; o banco continua em snake_case. */
export interface DefaultIncomeRow {
  id: number;
  name: string;
  expected_day: number | null;
  amount: number;
  bank_account_id: number | null;
  created_at: string;
}

/** Coluna extra que só existe na consulta com JOIN. */
interface DefaultIncomeJoinRow extends DefaultIncomeRow {
  bank_account_name: string | null;
}

export function rowToDefaultIncome(
  row: DefaultIncomeRow | DefaultIncomeJoinRow,
): DefaultIncomeEntity {
  const joined = row as DefaultIncomeJoinRow;
  return {
    id: row.id,
    name: row.name,
    expectedDay: row.expected_day,
    amount: row.amount,
    bankAccountId: row.bank_account_id,
    bankAccountName: joined.bank_account_name,
    createdAt: row.created_at,
  };
}

function selectDefaultIncomeRow(db: Database.Database, id: number): DefaultIncomeRow | undefined {
  return db.prepare('SELECT * FROM default_incomes WHERE id = ?').get(id) as
    DefaultIncomeRow | undefined;
}

export function makeDefaultIncomesRepository(db: Database.Database) {
  function findById(id: number): DefaultIncomeEntity | null {
    const row = selectDefaultIncomeRow(db, id);
    return row ? rowToDefaultIncome(row) : null;
  }

  return {
    list(): DefaultIncomeEntity[] {
      const rows = db
        .prepare(
          `SELECT di.*, ba.name as bank_account_name
           FROM default_incomes di
           LEFT JOIN bank_accounts ba ON ba.id = di.bank_account_id
           ORDER BY di.name`,
        )
        .all() as DefaultIncomeJoinRow[];
      return rows.map(rowToDefaultIncome);
    },

    findById,

    /**
     * Insere só o padrão. A cascata (uma cópia para dentro de todo Mês já
     * existente) e a atomicidade são compostas pelo `defaultIncomesService`
     * dentro de `repos.transaction` (spec desta pasta, decisão 6).
     */
    create(data: {
      name: string;
      expectedDay?: number | null;
      amount?: number;
      bankAccountId?: number | null;
    }): DefaultIncomeEntity {
      const result = db
        .prepare(
          'INSERT INTO default_incomes (name, expected_day, amount, bank_account_id) VALUES (?, ?, ?, ?)',
        )
        .run(data.name, data.expectedDay || null, data.amount || 0, data.bankAccountId || null);

      const created = findById(result.lastInsertRowid as number);
      if (!created) throw new Error('Default income not found after insert');
      return created;
    },

    update(
      id: number,
      data: {
        name?: string;
        expectedDay?: number | null;
        amount?: number;
        bankAccountId?: number | null;
      },
    ): DefaultIncomeEntity | null {
      const existing = selectDefaultIncomeRow(db, id);
      if (!existing) return null;

      db.prepare(
        'UPDATE default_incomes SET name = ?, expected_day = ?, amount = ?, bank_account_id = ? WHERE id = ?',
      ).run(
        data.name ?? existing.name,
        data.expectedDay !== undefined ? data.expectedDay : existing.expected_day,
        data.amount !== undefined ? data.amount : existing.amount,
        data.bankAccountId !== undefined ? data.bankAccountId : existing.bank_account_id,
        id,
      );

      return findById(id);
    },

    delete(id: number): DefaultIncomeEntity | null {
      const existing = selectDefaultIncomeRow(db, id);
      if (!existing) return null;
      db.prepare('DELETE FROM default_incomes WHERE id = ?').run(id);
      return rowToDefaultIncome(existing);
    },
  };
}

export type DefaultIncomesRepository = ReturnType<typeof makeDefaultIncomesRepository>;
