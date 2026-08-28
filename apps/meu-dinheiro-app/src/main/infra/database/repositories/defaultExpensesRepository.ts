import Database from 'better-sqlite3';
import type { DefaultExpense } from '@shared/types/expense';
import { formatDueDate } from '../../../domain/monthNames';

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

function selectDefaultExpenseRow(db: Database.Database, id: number): DefaultExpenseRow | undefined {
  return db.prepare('SELECT * FROM default_expenses WHERE id = ?').get(id) as
    DefaultExpenseRow | undefined;
}

export function makeDefaultExpensesRepository(db: Database.Database) {
  function findById(id: number): DefaultExpense | null {
    const row = selectDefaultExpenseRow(db, id);
    return row ? rowToDefaultExpense(row) : null;
  }

  return {
    list(): DefaultExpense[] {
      const rows = db
        .prepare(
          `SELECT d.*, c.name as category_name, c.color as category_color
           FROM default_expenses d
           LEFT JOIN categories c ON c.id = d.category_id
           ORDER BY d.name`,
        )
        .all() as DefaultExpenseJoinRow[];
      return rows.map(rowToDefaultExpense);
    },

    findById,

    /**
     * Insere o padrão e a cascata (uma cópia) para dentro de todo mês já
     * existente, numa transação só. A composição pelo service — mesmo `db.transaction`,
     * autorado lá — é o ticket 05.
     */
    create(data: {
      name: string;
      dueDay?: number | null;
      amount?: number;
      categoryId?: number | null;
    }): DefaultExpense {
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

      const created = findById(create());
      if (!created) throw new Error('Default expense not found after insert');
      return created;
    },

    update(
      id: number,
      data: { name?: string; dueDay?: number | null; amount?: number; categoryId?: number | null },
    ): DefaultExpense | null {
      const existing = selectDefaultExpenseRow(db, id);
      if (!existing) return null;

      db.prepare(
        'UPDATE default_expenses SET name = ?, due_day = ?, amount = ?, category_id = ? WHERE id = ?',
      ).run(
        data.name ?? existing.name,
        data.dueDay !== undefined ? data.dueDay : existing.due_day,
        data.amount !== undefined ? data.amount : existing.amount,
        data.categoryId !== undefined ? data.categoryId : existing.category_id,
        id,
      );

      return findById(id);
    },

    delete(id: number): DefaultExpense | null {
      const existing = selectDefaultExpenseRow(db, id);
      if (!existing) return null;
      db.prepare('DELETE FROM default_expenses WHERE id = ?').run(id);
      return rowToDefaultExpense(existing);
    },

    /**
     * NULL da coluna que referencia uma categoria removida. Sem transação
     * própria: o service compõe (`repos.transaction`) junto do
     * `repos.categories.delete` no ticket 05 (`../spec.md`, decisão 7).
     */
    clearCategory(categoryId: number): void {
      db.prepare('UPDATE default_expenses SET category_id = NULL WHERE category_id = ?').run(
        categoryId,
      );
    },
  };
}

export type DefaultExpensesRepository = ReturnType<typeof makeDefaultExpensesRepository>;
