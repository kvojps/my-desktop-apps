import Database from 'better-sqlite3';
import type { Category, CategoryTotal } from '@shared/types/category';
import { AppError } from '../../../utils/errors/AppError';

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

export function listCategories(db: Database.Database): Category[] {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all() as CategoryRow[];
  return rows.map(rowToCategory);
}

function getCategoryRow(db: Database.Database, id: number): CategoryRow {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as
    CategoryRow | undefined;
  if (!existing) {
    throw new AppError(404, 'Categoria não encontrada');
  }
  return existing;
}

export function getCategoryById(db: Database.Database, id: number): Category {
  return rowToCategory(getCategoryRow(db, id));
}

export function createCategory(
  db: Database.Database,
  data: { name: string; color: string },
): Category {
  const result = db
    .prepare('INSERT INTO categories (name, color) VALUES (?, ?)')
    .run(data.name, data.color);
  return getCategoryById(db, result.lastInsertRowid as number);
}

export function updateCategory(
  db: Database.Database,
  id: number,
  data: { name?: string; color?: string },
): Category {
  const existing = getCategoryRow(db, id);

  db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ?').run(
    data.name ?? existing.name,
    data.color ?? existing.color,
    id,
  );

  return getCategoryById(db, id);
}

interface CategoryTotalRow {
  category_id: number | null;
  name: string | null;
  color: string | null;
  total: number;
  count: number;
}

export function getCategoryTotalsForYear(db: Database.Database, year: number): CategoryTotal[] {
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
}

export function deleteCategory(db: Database.Database, id: number) {
  getCategoryRow(db, id);
  const run = db.transaction(() => {
    db.prepare('UPDATE expenses SET category_id = NULL WHERE category_id = ?').run(id);
    db.prepare('UPDATE default_expenses SET category_id = NULL WHERE category_id = ?').run(id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  });
  run();
}
