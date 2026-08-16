import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Product } from '@shared/types/product';
import { AppError } from '../errors/AppError';

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

function rowToProduct(row: ProductRow): Product {
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

export function getAllProducts(db: Database.Database): Product[] {
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at ASC').all() as ProductRow[];
  return rows.map(rowToProduct);
}

export function getProductById(db: Database.Database, id: string): Product | undefined {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined;
  return row ? rowToProduct(row) : undefined;
}

export function addProduct(
  db: Database.Database,
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
): Product {
  const now = new Date().toISOString();
  const product: Product = {
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
}

export function updateProduct(db: Database.Database, id: string, data: Partial<Product>): Product {
  const existing = getProductById(db, id);
  if (!existing) {
    throw new AppError(404, `Produto não encontrado: ${id}`);
  }

  const updated: Product = {
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
}

export function deleteProduct(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
}

export interface StockAdjustment {
  product: Product;
  /**
   * Variação que o estoque de fato sofreu. Difere de `delta` quando a baixa
   * pedida é maior que o saldo disponível — o estoque para em zero em vez de
   * ficar negativo, e quem chamou precisa saber disso para conseguir desfazer
   * a operação depois.
   */
  appliedDelta: number;
}

export function adjustProductStock(
  db: Database.Database,
  productId: string,
  delta: number,
): StockAdjustment | undefined {
  const existing = getProductById(db, productId);
  if (!existing) return undefined;

  const stock = Math.max(0, existing.stock + delta);
  const updated: Product = {
    ...existing,
    stock,
    updatedAt: new Date().toISOString(),
  };

  db.prepare('UPDATE products SET stock = @stock, updated_at = @updatedAt WHERE id = @id').run(
    updated,
  );

  return { product: updated, appliedDelta: stock - existing.stock };
}
