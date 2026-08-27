import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Product } from '@shared/types/product';
import type { ProductEntity } from '../../../domain/product';

interface ProductRow {
  id: string;
  name: string;
  description: string;
  category: string;
  supplier: string;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
}

function rowToProduct(row: ProductRow): ProductEntity {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    supplier: row.supplier,
    costPrice: row.cost_price,
    salePrice: row.sale_price,
    stock: row.stock,
    minStock: row.min_stock,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function makeProductsRepository(db: Database.Database) {
  function findById(id: string): ProductEntity | null {
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined;
    return row ? rowToProduct(row) : null;
  }

  return {
    list(): ProductEntity[] {
      const rows = db
        .prepare('SELECT * FROM products ORDER BY created_at ASC')
        .all() as ProductRow[];
      return rows.map(rowToProduct);
    },

    findById,

    create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): ProductEntity {
      const now = new Date().toISOString();
      const product: ProductEntity = {
        ...data,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
      };

      db.prepare(
        `INSERT INTO products (id, name, description, category, supplier, cost_price, sale_price, stock, min_stock, created_at, updated_at)
         VALUES (@id, @name, @description, @category, @supplier, @costPrice, @salePrice, @stock, @minStock, @createdAt, @updatedAt)`,
      ).run(product);

      return product;
    },

    update(id: string, data: Partial<Product>): ProductEntity | null {
      const existing = findById(id);
      if (!existing) return null;

      const updated: ProductEntity = {
        ...existing,
        ...data,
        id: existing.id,
        updatedAt: new Date().toISOString(),
      };

      db.prepare(
        `UPDATE products SET name = @name, description = @description, category = @category,
         supplier = @supplier, cost_price = @costPrice, sale_price = @salePrice, stock = @stock,
         min_stock = @minStock, updated_at = @updatedAt WHERE id = @id`,
      ).run(updated);

      return updated;
    },

    delete(id: string): ProductEntity | null {
      const existing = findById(id);
      if (!existing) return null;

      db.prepare('DELETE FROM products WHERE id = ?').run(id);
      return existing;
    },
  };
}

export type ProductsRepository = ReturnType<typeof makeProductsRepository>;
