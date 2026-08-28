import Database from 'better-sqlite3';
import type { Category, CategoryTotal } from '@shared/types/category';

/** Colunas cruas da tabela; o banco continua em snake_case. */
export interface CategoryRow {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  };
}

interface CategoryTotalRow {
  category_id: number | null;
  name: string | null;
  color: string | null;
  total: number;
  count: number;
}

function selectCategoryRow(db: Database.Database, id: number): CategoryRow | undefined {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow | undefined;
}

export function makeCategoriesRepository(db: Database.Database) {
  function findById(id: number): Category | null {
    const row = selectCategoryRow(db, id);
    return row ? rowToCategory(row) : null;
  }

  return {
    list(): Category[] {
      const rows = db.prepare('SELECT * FROM categories ORDER BY name').all() as CategoryRow[];
      return rows.map(rowToCategory);
    },

    findById,

    create(data: { name: string; color: string }): Category {
      const result = db
        .prepare('INSERT INTO categories (name, color) VALUES (?, ?)')
        .run(data.name, data.color);
      const created = findById(result.lastInsertRowid as number);
      if (!created) throw new Error('Category not found after insert');
      return created;
    },

    update(id: number, data: { name?: string; color?: string }): Category | null {
      const existing = selectCategoryRow(db, id);
      if (!existing) return null;

      db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ?').run(
        data.name ?? existing.name,
        data.color ?? existing.color,
        id,
      );

      return findById(id);
    },

    /**
     * O NULL das referências (`expenses`/`default_expenses`) ainda roda aqui,
     * dentro do `db.transaction` do próprio verbo — a composição dessa transação
     * pelo service, via `repos.expenses.clearCategory` /
     * `repos.defaultExpenses.clearCategory`, é o ticket 05. Devolve a categoria
     * que existia, ou `null` — sem decidir 404.
     */
    delete(id: number): Category | null {
      const existing = selectCategoryRow(db, id);
      if (!existing) return null;

      const run = db.transaction(() => {
        db.prepare('UPDATE expenses SET category_id = NULL WHERE category_id = ?').run(id);
        db.prepare('UPDATE default_expenses SET category_id = NULL WHERE category_id = ?').run(id);
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      });
      run();

      return rowToCategory(existing);
    },

    /** O SQL `GROUP BY categoria` do relatório de Histórico (`../spec.md`, decisão 9). */
    totalsForYear(year: number): CategoryTotal[] {
      const rows = db
        .prepare(
          `SELECT c.id as category_id, c.name as name, c.color as color,
                  COALESCE(SUM(e.amount), 0) as total, COUNT(e.id) as count
           FROM expenses e
           JOIN months m ON m.id = e.month_id
           LEFT JOIN categories c ON c.id = e.category_id
           WHERE m.year = ?
           GROUP BY c.id
           ORDER BY total DESC`,
        )
        .all(year) as CategoryTotalRow[];

      return rows.map((row) => ({
        categoryId: row.category_id,
        name: row.name,
        color: row.color,
        total: row.total,
        count: row.count,
      }));
    },
  };
}

export type CategoriesRepository = ReturnType<typeof makeCategoriesRepository>;
