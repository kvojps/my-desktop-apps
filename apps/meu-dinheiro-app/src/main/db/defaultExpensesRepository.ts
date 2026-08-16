import Database from 'better-sqlite3';
import { formatDueDate } from '../constants/monthNames';
import { AppError } from '../errors/AppError';

export interface DefaultExpenseRow {
  id: number;
  name: string;
  due_day: number | null;
  amount: number;
  category_id: number | null;
  created_at: string;
}

export function listDefaultExpenses(db: Database.Database) {
  return db
    .prepare(
      `SELECT d.*, c.name as category_name, c.color as category_color
       FROM default_expenses d
       LEFT JOIN categories c ON c.id = d.category_id
       ORDER BY d.name`,
    )
    .all() as (DefaultExpenseRow & {
    category_name: string | null;
    category_color: string | null;
  })[];
}

export function createDefaultExpense(
  db: Database.Database,
  data: { name: string; due_day?: number | null; amount?: number; category_id?: number | null },
): DefaultExpenseRow {
  const create = db.transaction(() => {
    const result = db
      .prepare(
        'INSERT INTO default_expenses (name, due_day, amount, category_id) VALUES (?, ?, ?, ?)',
      )
      .run(data.name, data.due_day || null, data.amount || 0, data.category_id ?? null);

    const defaultId = result.lastInsertRowid as number;

    const months = db.prepare('SELECT * FROM months').all() as {
      id: number;
      year: number;
      month: number;
    }[];
    const insertExpense = db.prepare(
      'INSERT INTO expenses (month_id, name, due_date, amount, category_id) VALUES (?, ?, ?, ?, ?)',
    );
    for (const month of months) {
      insertExpense.run(
        month.id,
        data.name,
        formatDueDate(month.year, month.month, data.due_day),
        data.amount || 0,
        data.category_id ?? null,
      );
    }

    return defaultId;
  });

  const defaultId = create();
  return db
    .prepare('SELECT * FROM default_expenses WHERE id = ?')
    .get(defaultId) as DefaultExpenseRow;
}

export function getDefaultExpenseById(db: Database.Database, id: number): DefaultExpenseRow {
  const existing = db.prepare('SELECT * FROM default_expenses WHERE id = ?').get(id) as
    DefaultExpenseRow | undefined;
  if (!existing) {
    throw new AppError(404, 'Default expense not found');
  }
  return existing;
}

export function updateDefaultExpense(
  db: Database.Database,
  id: number,
  data: { name?: string; due_day?: number | null; amount?: number; category_id?: number | null },
): DefaultExpenseRow {
  const existing = getDefaultExpenseById(db, id);

  db.prepare(
    'UPDATE default_expenses SET name = ?, due_day = ?, amount = ?, category_id = ? WHERE id = ?',
  ).run(
    data.name ?? existing.name,
    data.due_day !== undefined ? data.due_day : existing.due_day,
    data.amount !== undefined ? data.amount : existing.amount,
    data.category_id !== undefined ? data.category_id : existing.category_id,
    id,
  );

  return getDefaultExpenseById(db, id);
}

export function deleteDefaultExpense(db: Database.Database, id: number) {
  getDefaultExpenseById(db, id);
  db.prepare('DELETE FROM default_expenses WHERE id = ?').run(id);
}
