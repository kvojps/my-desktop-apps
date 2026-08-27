import Database from 'better-sqlite3';
import type { DefaultExpense } from '@shared/types/expense';
import { formatDueDate } from '../../../domain/monthNames';
import { AppError } from '../../../utils/errors/AppError';

/** Colunas cruas da tabela; o banco continua em snake_case. */
export interface DefaultExpenseRow {
  id: number;
  name: string;
  due_day: number | null;
  amount: number;
  category_id: number | null;
  created_at: string;
}

/** Colunas extras que só existem na consulta com JOIN. */
interface DefaultExpenseJoinRow extends DefaultExpenseRow {
  category_name: string | null;
  category_color: string | null;
}

export function rowToDefaultExpense(
  row: DefaultExpenseRow | DefaultExpenseJoinRow,
): DefaultExpense {
  const joined = row as DefaultExpenseJoinRow;
  return {
    id: row.id,
    name: row.name,
    dueDay: row.due_day,
    amount: row.amount,
    categoryId: row.category_id,
    categoryName: joined.category_name,
    categoryColor: joined.category_color,
    createdAt: row.created_at,
  };
}

export function listDefaultExpenses(db: Database.Database): DefaultExpense[] {
  const rows = db
    .prepare(
      `SELECT d.*, c.name as category_name, c.color as category_color
       FROM default_expenses d
       LEFT JOIN categories c ON c.id = d.category_id
       ORDER BY d.name`,
    )
    .all() as DefaultExpenseJoinRow[];
  return rows.map(rowToDefaultExpense);
}

function getDefaultExpenseRow(db: Database.Database, id: number): DefaultExpenseRow {
  const existing = db.prepare('SELECT * FROM default_expenses WHERE id = ?').get(id) as
    DefaultExpenseRow | undefined;
  if (!existing) {
    throw new AppError(404, 'Despesa padrão não encontrada');
  }
  return existing;
}

export function getDefaultExpenseById(db: Database.Database, id: number): DefaultExpense {
  return rowToDefaultExpense(getDefaultExpenseRow(db, id));
}

export function createDefaultExpense(
  db: Database.Database,
  data: { name: string; dueDay?: number | null; amount?: number; categoryId?: number | null },
): DefaultExpense {
  const create = db.transaction(() => {
    const result = db
      .prepare(
        'INSERT INTO default_expenses (name, due_day, amount, category_id) VALUES (?, ?, ?, ?)',
      )
      .run(data.name, data.dueDay || null, data.amount || 0, data.categoryId ?? null);

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
        formatDueDate(month.year, month.month, data.dueDay),
        data.amount || 0,
        data.categoryId ?? null,
      );
    }

    return defaultId;
  });

  return getDefaultExpenseById(db, create());
}

export function updateDefaultExpense(
  db: Database.Database,
  id: number,
  data: { name?: string; dueDay?: number | null; amount?: number; categoryId?: number | null },
): DefaultExpense {
  const existing = getDefaultExpenseRow(db, id);

  db.prepare(
    'UPDATE default_expenses SET name = ?, due_day = ?, amount = ?, category_id = ? WHERE id = ?',
  ).run(
    data.name ?? existing.name,
    data.dueDay !== undefined ? data.dueDay : existing.due_day,
    data.amount !== undefined ? data.amount : existing.amount,
    data.categoryId !== undefined ? data.categoryId : existing.category_id,
    id,
  );

  return getDefaultExpenseById(db, id);
}

export function deleteDefaultExpense(db: Database.Database, id: number) {
  getDefaultExpenseRow(db, id);
  db.prepare('DELETE FROM default_expenses WHERE id = ?').run(id);
}
