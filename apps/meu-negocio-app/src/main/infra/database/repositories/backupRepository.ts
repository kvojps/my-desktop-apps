import type Database from 'better-sqlite3';
import type { BackupData } from '@shared/types/backup';
import type { Repositories } from '../index';

// v2 passou a gravar amount_paid nos pedidos; a v1 omitia o campo.
export const BACKUP_VERSION = 2;

export function exportData(repos: Repositories): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    products: repos.products.list(),
    orders: repos.orders.list(),
    settings: repos.settings.getSettings(),
  };
}

/**
 * Continua sobre `db` cru, não `repos`: é apagar e reescrever quatro tabelas
 * inteiras numa única transação, não uma sequência de verbos de uma entidade —
 * não há `create`/`update` de repositório que caiba aqui.
 */
export function importData(db: Database.Database, data: BackupData): void {
  const insertProduct = db.prepare(
    `INSERT INTO products (id, name, description, category, supplier, cost_price, sale_price, stock, min_stock, created_at, updated_at)
     VALUES (@id, @name, @description, @category, @supplier, @costPrice, @salePrice, @stock, @minStock, @createdAt, @updatedAt)`,
  );

  const insertOrder = db.prepare(
    `INSERT INTO orders (id, customer_name, status, manual_total, amount_paid, created_at, updated_at)
     VALUES (@id, @customerName, @status, @manualTotal, @amountPaid, @createdAt, @updatedAt)`,
  );

  const insertItem = db.prepare(
    `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, unit_cost, stock_applied)
     VALUES (@id, @orderId, @productId, @productName, @quantity, @unitPrice, @unitCost, @stockApplied)`,
  );

  const insertSettings = db.prepare(
    `INSERT INTO settings (id, name, cnpj, phone, address)
     VALUES (1, @name, @cnpj, @phone, @address)`,
  );

  const importTransaction = db.transaction(() => {
    db.prepare('DELETE FROM order_items').run();
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM settings').run();

    for (const product of data.products) {
      insertProduct.run(product);
    }

    for (const order of data.orders) {
      insertOrder.run({
        id: order.id,
        customerName: order.customerName,
        status: order.status,
        manualTotal: order.manualTotal ?? null,
        amountPaid: order.amountPaid,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
      for (const item of order.items) {
        insertItem.run({
          ...item,
          orderId: order.id,
          // O backup não guarda a baixa de estoque; vale a mesma suposição da
          // migração: nos concluídos, saiu a quantidade cheia.
          stockApplied: order.status === 'completed' ? item.quantity : 0,
        });
      }
    }

    insertSettings.run(data.settings);
  });

  importTransaction();
}
