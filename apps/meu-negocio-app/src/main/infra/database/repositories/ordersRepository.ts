import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { CreateOrderData, OrderItem, UpdateOrderData } from '@shared/types/order';
import type { OrderEntity, OrderItemEntity, OrderStatusEntity } from '../../../domain/order';

interface OrderRow {
  id: string;
  customer_name: string;
  status: OrderStatusEntity;
  manual_total: number | null;
  amount_paid: number;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  stock_applied: number;
}

function rowToItem(row: OrderItemRow): OrderItemEntity {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    unitCost: row.unit_cost,
    stockApplied: row.stock_applied,
  };
}

function buildOrder(row: OrderRow, items: OrderItemEntity[]): OrderEntity {
  return {
    id: row.id,
    customerName: row.customer_name,
    status: row.status,
    items,
    manualTotal: row.manual_total ?? undefined,
    amountPaid: row.amount_paid,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function makeOrdersRepository(db: Database.Database) {
  function getItemsForOrder(orderId: string): OrderItemEntity[] {
    const rows = db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(orderId) as OrderItemRow[];
    return rows.map(rowToItem);
  }

  function findById(id: string): OrderEntity | null {
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
    if (!row) return null;
    return buildOrder(row, getItemsForOrder(id));
  }

  function insertItems(orderId: string, items: OrderItem[]): void {
    const insertItem = db.prepare(
      `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, unit_cost)
       VALUES (@id, @orderId, @productId, @productName, @quantity, @unitPrice, @unitCost)`,
    );
    for (const item of items) {
      insertItem.run({
        id: item.id,
        orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
      });
    }
  }

  return {
    list(): OrderEntity[] {
      const orderRows = db
        .prepare('SELECT * FROM orders ORDER BY created_at ASC')
        .all() as OrderRow[];
      const itemRows = db.prepare('SELECT * FROM order_items').all() as OrderItemRow[];

      const itemsByOrder = new Map<string, OrderItemEntity[]>();
      for (const row of itemRows) {
        const items = itemsByOrder.get(row.order_id) ?? [];
        items.push(rowToItem(row));
        itemsByOrder.set(row.order_id, items);
      }

      return orderRows.map((row) => buildOrder(row, itemsByOrder.get(row.id) ?? []));
    },

    findById,

    create(data: CreateOrderData): OrderEntity {
      const now = new Date().toISOString();
      const order = {
        ...data,
        id: randomUUID(),
        // Sem data informada, a venda é de agora — o comportamento de sempre.
        createdAt: data.createdAt ?? now,
        updatedAt: now,
      };

      const insertTransaction = db.transaction(() => {
        db.prepare(
          `INSERT INTO orders (id, customer_name, status, manual_total, amount_paid, created_at, updated_at)
           VALUES (@id, @customerName, @status, @manualTotal, @amountPaid, @createdAt, @updatedAt)`,
        ).run({
          id: order.id,
          customerName: order.customerName,
          status: order.status,
          manualTotal: order.manualTotal ?? null,
          amountPaid: order.amountPaid,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        });
        insertItems(order.id, order.items);
      });
      insertTransaction();

      // Reconsulta em vez de devolver `order`: os itens recém-inseridos ganham
      // `stockApplied` (default 0 no schema) que `data.items` não carrega.
      const created = findById(order.id);
      if (!created) {
        throw new Error(`Order not found after insert: ${order.id}`);
      }

      return created;
    },

    update(id: string, data: UpdateOrderData): OrderEntity | null {
      const existing = findById(id);
      if (!existing) return null;

      const updatedAt = new Date().toISOString();
      const createdAt = data.createdAt ?? existing.createdAt;

      const updateTransaction = db.transaction(() => {
        db.prepare(
          `UPDATE orders SET customer_name = @customerName, manual_total = @manualTotal, created_at = @createdAt, updated_at = @updatedAt WHERE id = @id`,
        ).run({
          id,
          customerName: data.customerName,
          manualTotal: data.manualTotal ?? null,
          createdAt,
          updatedAt,
        });
        db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
        insertItems(id, data.items);
      });
      updateTransaction();

      // Mesmo motivo do `create`: os itens recriados por `insertItems` zeram
      // `stockApplied`, e só a reconsulta reflete isso na entidade devolvida.
      const updated = findById(id);
      if (!updated) {
        throw new Error(`Order not found after update: ${id}`);
      }

      return updated;
    },

    /**
     * Só grava a coluna de status. A transição válida, a conferência de
     * estoque e a baixa/estorno são regra de negócio e rodam no
     * `ordersService`, dentro de `repos.transaction` (ticket 5).
     */
    setStatus(id: string, newStatus: OrderStatusEntity): OrderEntity | null {
      const existing = findById(id);
      if (!existing) return null;

      const updatedAt = new Date().toISOString();
      db.prepare('UPDATE orders SET status = @status, updated_at = @updatedAt WHERE id = @id').run({
        id,
        status: newStatus,
        updatedAt,
      });

      return findById(id);
    },

    setPaymentAmount(id: string, amountPaid: number): OrderEntity | null {
      const existing = findById(id);
      if (!existing) return null;

      const updatedAt = new Date().toISOString();
      db.prepare(
        'UPDATE orders SET amount_paid = @amountPaid, updated_at = @updatedAt WHERE id = @id',
      ).run({ id, amountPaid, updatedAt });

      return findById(id);
    },

    /** Quanto deste item já foi baixado do estoque. Escrito pelo `ordersService`. */
    setItemStockApplied(itemId: string, stockApplied: number): void {
      db.prepare('UPDATE order_items SET stock_applied = ? WHERE id = ?').run(stockApplied, itemId);
    },

    /**
     * Só apaga a venda (os itens caem por `ON DELETE CASCADE`). Devolver o
     * estoque de uma venda concluída antes de apagar é decisão do
     * `ordersService`, na mesma transação. Devolve a venda que existia, ou
     * `null` — sem decidir 404.
     */
    delete(id: string): OrderEntity | null {
      const existing = findById(id);
      if (!existing) return null;

      db.prepare('DELETE FROM orders WHERE id = ?').run(id);
      return existing;
    },
  };
}

export type OrdersRepository = ReturnType<typeof makeOrdersRepository>;
