import Database from 'better-sqlite3';
import type { DefaultIncome } from '@shared/types/income';
import { formatDueDate } from '../../../domain/monthNames';
import { AppError } from '../../../utils/errors/AppError';

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

export function rowToDefaultIncome(row: DefaultIncomeRow | DefaultIncomeJoinRow): DefaultIncome {
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

export function listDefaultIncomes(db: Database.Database): DefaultIncome[] {
  const rows = db
    .prepare(
      `SELECT di.*, ba.name as bank_account_name
       FROM default_incomes di
       LEFT JOIN bank_accounts ba ON ba.id = di.bank_account_id
       ORDER BY di.name`,
    )
    .all() as DefaultIncomeJoinRow[];
  return rows.map(rowToDefaultIncome);
}

function getDefaultIncomeRow(db: Database.Database, id: number): DefaultIncomeRow {
  const existing = db.prepare('SELECT * FROM default_incomes WHERE id = ?').get(id) as
    DefaultIncomeRow | undefined;
  if (!existing) {
    throw new AppError(404, 'Entrada padrão não encontrada');
  }
  return existing;
}

export function getDefaultIncomeById(db: Database.Database, id: number): DefaultIncome {
  return rowToDefaultIncome(getDefaultIncomeRow(db, id));
}

export function createDefaultIncome(
  db: Database.Database,
  data: {
    name: string;
    expectedDay?: number | null;
    amount?: number;
    bankAccountId?: number | null;
  },
): DefaultIncome {
  const create = db.transaction(() => {
    const result = db
      .prepare(
        'INSERT INTO default_incomes (name, expected_day, amount, bank_account_id) VALUES (?, ?, ?, ?)',
      )
      .run(data.name, data.expectedDay || null, data.amount || 0, data.bankAccountId || null);

    const defaultId = result.lastInsertRowid as number;

    const months = db.prepare('SELECT * FROM months').all() as {
      id: number;
      year: number;
      month: number;
    }[];
    const insertIncome = db.prepare(
      'INSERT INTO incomes (month_id, name, expected_date, amount, bank_account_id) VALUES (?, ?, ?, ?, ?)',
    );
    for (const month of months) {
      insertIncome.run(
        month.id,
        data.name,
        formatDueDate(month.year, month.month, data.expectedDay),
        data.amount || 0,
        data.bankAccountId || null,
      );
    }

    return defaultId;
  });

  return getDefaultIncomeById(db, create());
}

export function updateDefaultIncome(
  db: Database.Database,
  id: number,
  data: {
    name?: string;
    expectedDay?: number | null;
    amount?: number;
    bankAccountId?: number | null;
  },
): DefaultIncome {
  const existing = getDefaultIncomeRow(db, id);

  db.prepare(
    'UPDATE default_incomes SET name = ?, expected_day = ?, amount = ?, bank_account_id = ? WHERE id = ?',
  ).run(
    data.name ?? existing.name,
    data.expectedDay !== undefined ? data.expectedDay : existing.expected_day,
    data.amount !== undefined ? data.amount : existing.amount,
    data.bankAccountId !== undefined ? data.bankAccountId : existing.bank_account_id,
    id,
  );

  return getDefaultIncomeById(db, id);
}

export function deleteDefaultIncome(db: Database.Database, id: number) {
  getDefaultIncomeRow(db, id);
  db.prepare('DELETE FROM default_incomes WHERE id = ?').run(id);
}
