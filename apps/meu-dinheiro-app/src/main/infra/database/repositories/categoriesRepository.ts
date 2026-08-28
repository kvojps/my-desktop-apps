import Database from 'better-sqlite3';
import type { CategoryEntity, CategoryTotalEntity } from '../../../domain/category';

/** Colunas cruas da tabela; o banco continua em snake_case. */
export interface CategoryRow {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export function rowToCategory(row: CategoryRow): CategoryEntity {
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

function rowToCategoryTotal(row: CategoryTotalRow): CategoryTotalEntity {
  return {
    categoryId: row.category_id,
    name: row.name,
    color: row.color,
    total: row.total,
    count: row.count,
  };
}

function selectCategoryRow(db: Database.Database, id: number): CategoryRow | undefined {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow | undefined;
}

export function makeCategoriesRepository(db: Database.Database) {
  function findById(id: number): CategoryEntity | null {
    const row = selectCategoryRow(db, id);
    return row ? rowToCategory(row) : null;
  }

  return {
    list(): CategoryEntity[] {
      const rows = db.prepare('SELECT * FROM categories ORDER BY name').all() as CategoryRow[];
      return rows.map(rowToCategory);
    },

    findById,

    create(data: { name: string; color: string }): CategoryEntity {
      const result = db
        .prepare('INSERT INTO categories (name, color) VALUES (?, ?)')
        .run(data.name, data.color);
      const created = findById(result.lastInsertRowid as number);
      if (!created) throw new Error('Category not found after insert');
      return created;
    },

    update(id: number, data: { name?: string; color?: string }): CategoryEntity | null {
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
     * Apaga a Categoria. O NULL das referências em `expenses`/`default_expenses`
     * e a atomicidade são compostos pelo `categoriesService`
     * (`repos.expenses.clearCategory` / `repos.defaultExpenses.clearCategory`
     * dentro de `repos.transaction`; spec desta pasta, decisão 7). Devolve a
     * Categoria que existia, ou `null` — sem decidir 404.
     */
    delete(id: number): CategoryEntity | null {
      const existing = selectCategoryRow(db, id);
      if (!existing) return null;

      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      return rowToCategory(existing);
    },

    /** O SQL `GROUP BY categoria` do relatório de Histórico (`../spec.md`, decisão 9). */
    totalsForYear(year: number): CategoryTotalEntity[] {
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

      return rows.map(rowToCategoryTotal);
    },
  };
}

export type CategoriesRepository = ReturnType<typeof makeCategoriesRepository>;
