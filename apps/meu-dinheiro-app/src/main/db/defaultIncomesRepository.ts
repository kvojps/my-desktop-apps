import Database from 'better-sqlite3';
import { formatDueDate } from '../constants/monthNames';
import { AppError } from '../errors/AppError';

export interface DefaultIncomeRow {
  id: number;
  name: string;
  expected_day: number | null;
  amount: number;
  bank_account_id: number | null;
  created_at: string;
}

export function listDefaultIncomes(db: Database.Database) {
  return db
    .prepare(
      `SELECT di.*, ba.name as bank_account_name
       FROM default_incomes di
       LEFT JOIN bank_accounts ba ON ba.id = di.bank_account_id
       ORDER BY di.name`,
    )
    .all() as (DefaultIncomeRow & { bank_account_name: string | null })[];
}

export function createDefaultIncome(
  db: Database.Database,
  data: {
    name: string;
    expected_day?: number | null;
    amount?: number;
    bank_account_id?: number | null;
  },
): DefaultIncomeRow {
  const create = db.transaction(() => {
    const result = db
      .prepare(
        'INSERT INTO default_incomes (name, expected_day, amount, bank_account_id) VALUES (?, ?, ?, ?)',
      )
      .run(data.name, data.expected_day || null, data.amount || 0, data.bank_account_id || null);

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
        formatDueDate(month.year, month.month, data.expected_day),
        data.amount || 0,
        data.bank_account_id || null,
      );
    }

    return defaultId;
  });

  const defaultId = create();
  return db
    .prepare('SELECT * FROM default_incomes WHERE id = ?')
    .get(defaultId) as DefaultIncomeRow;
}

export function getDefaultIncomeById(db: Database.Database, id: number): DefaultIncomeRow {
  const existing = db.prepare('SELECT * FROM default_incomes WHERE id = ?').get(id) as
    DefaultIncomeRow | undefined;
  if (!existing) {
    throw new AppError(404, 'Default income not found');
  }
  return existing;
}

export function updateDefaultIncome(
  db: Database.Database,
  id: number,
  data: {
    name?: string;
    expected_day?: number | null;
    amount?: number;
    bank_account_id?: number | null;
  },
): DefaultIncomeRow {
  const existing = getDefaultIncomeById(db, id);

  db.prepare(
    'UPDATE default_incomes SET name = ?, expected_day = ?, amount = ?, bank_account_id = ? WHERE id = ?',
  ).run(
    data.name ?? existing.name,
    data.expected_day !== undefined ? data.expected_day : existing.expected_day,
    data.amount !== undefined ? data.amount : existing.amount,
    data.bank_account_id !== undefined ? data.bank_account_id : existing.bank_account_id,
    id,
  );

  return getDefaultIncomeById(db, id);
}

export function deleteDefaultIncome(db: Database.Database, id: number) {
  getDefaultIncomeById(db, id);
  db.prepare('DELETE FROM default_incomes WHERE id = ?').run(id);
}
