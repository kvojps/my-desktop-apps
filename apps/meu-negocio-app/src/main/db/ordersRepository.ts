import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type {
  CreateOrderData,
  Order,
  OrderItem,
  OrderStatus,
  UpdateOrderData,
} from '@shared/types/order';
import type { Product } from '@shared/types/product';
import { AppError } from '../errors/AppError';
import { adjustProductStock, getProductById } from './productsRepository';

interface OrderRow {
  id: string;
  customer_name: string;
  status: OrderStatus;
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
}

/**
 * Colunas de controle de estoque do item. Ficam fora de `OrderItem` de
 * propósito: são escrituração interna do processo principal, não fazem parte do
 * pedido que o renderer manipula.
 */
interface StockLedgerRow {
  id: string;
  product_id: string;
  quantity: number;
  stock_applied: number;
}

function rowToItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    unitCost: row.unit_cost,
  };
}

function buildOrder(row: OrderRow, items: OrderItem[]): Order {
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

function getItemsForOrder(db: Database.Database, orderId: string): OrderItem[] {
  const rows = db
    .prepare('SELECT * FROM order_items WHERE order_id = ?')
    .all(orderId) as OrderItemRow[];
  return rows.map(rowToItem);
}

export function getAllOrders(db: Database.Database): Order[] {
  const orderRows = db.prepare('SELECT * FROM orders ORDER BY created_at ASC').all() as OrderRow[];
  const itemRows = db.prepare('SELECT * FROM order_items').all() as OrderItemRow[];

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const row of itemRows) {
    const items = itemsByOrder.get(row.order_id) ?? [];
    items.push(rowToItem(row));
    itemsByOrder.set(row.order_id, items);
  }

  return orderRows.map((row) => buildOrder(row, itemsByOrder.get(row.id) ?? []));
}

function getOrderById(db: Database.Database, id: string): Order | undefined {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
  if (!row) return undefined;
  return buildOrder(row, getItemsForOrder(db, id));
}

function insertItems(db: Database.Database, orderId: string, items: OrderItem[]): void {
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

export function addOrder(db: Database.Database, data: CreateOrderData): Order {
  const now = new Date().toISOString();
  const order: Order = {
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
    insertItems(db, order.id, order.items);
  });
  insertTransaction();

  return order;
}

export function updateOrder(db: Database.Database, id: string, data: UpdateOrderData): Order {
  const existing = getOrderById(db, id);
  if (!existing) {
    throw new Error(`Order not found: ${id}`);
  }

  // A edição troca todos os itens do pedido. Numa venda concluída isso apagaria
  // o registro do que já saiu do estoque, deixando o saldo sem como voltar.
  if (existing.status === 'completed') {
    throw new AppError(
      409,
      'Não é possível editar uma venda concluída. Reabra o pedido na tela de Vendas para poder editá-lo.',
    );
  }
  if (existing.status === 'cancelled') {
    throw new AppError(409, 'Não é possível editar um pedido cancelado.');
  }

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
    insertItems(db, id, data.items);
  });
  updateTransaction();

  return { ...existing, ...data, createdAt, updatedAt };
}

function getStockLedger(db: Database.Database, orderId: string): StockLedgerRow[] {
  return db
    .prepare('SELECT id, product_id, quantity, stock_applied FROM order_items WHERE order_id = ?')
    .all(orderId) as StockLedgerRow[];
}

/**
 * Descreve o que falta em estoque para concluir o pedido. Soma por produto,
 * porque o mesmo produto pode aparecer em mais de um item.
 */
function findStockShortages(db: Database.Database, orderId: string): string[] {
  const requiredByProduct = new Map<string, number>();
  for (const row of getStockLedger(db, orderId)) {
    requiredByProduct.set(
      row.product_id,
      (requiredByProduct.get(row.product_id) ?? 0) + row.quantity,
    );
  }

  const shortages: string[] = [];
  for (const [productId, required] of requiredByProduct) {
    const product = getProductById(db, productId);
    // Produto removido do catálogo não tem saldo a conferir nem a movimentar.
    if (!product) continue;
    if (product.stock < required) {
      shortages.push(`${product.name} (necessário ${required}, disponível ${product.stock})`);
    }
  }

  return shortages;
}

/**
 * Baixa do estoque a quantidade de cada item e registra quanto saiu de fato —
 * que é menos que o pedido quando o saldo não cobria.
 */
function deductStockForOrder(db: Database.Database, orderId: string): Product[] {
  const updated: Product[] = [];
  const recordApplied = db.prepare('UPDATE order_items SET stock_applied = ? WHERE id = ?');

  for (const row of getStockLedger(db, orderId)) {
    const adjustment = adjustProductStock(db, row.product_id, -row.quantity);
    if (adjustment) updated.push(adjustment.product);
    recordApplied.run(-(adjustment?.appliedDelta ?? 0), row.id);
  }

  return updated;
}

/**
 * Devolve ao estoque exatamente o que a conclusão tirou. Serve tanto para
 * reabrir ou cancelar quanto para excluir uma venda.
 */
function restoreStockForOrder(db: Database.Database, orderId: string): Product[] {
  const updated: Product[] = [];
  const clearApplied = db.prepare('UPDATE order_items SET stock_applied = 0 WHERE id = ?');

  for (const row of getStockLedger(db, orderId)) {
    const adjustment = adjustProductStock(db, row.product_id, row.stock_applied);
    if (adjustment) updated.push(adjustment.product);
    clearApplied.run(row.id);
  }

  return updated;
}

export interface DeleteOrderResult {
  updatedProducts: Product[];
}

export function deleteOrder(db: Database.Database, id: string): DeleteOrderResult {
  const existing = getOrderById(db, id);
  if (!existing) return { updatedProducts: [] };

  const updatedProducts: Product[] = [];

  const deleteTransaction = db.transaction(() => {
    // Excluir uma venda concluída precisa devolver o estoque que ela baixou,
    // senão as unidades somem do saldo para sempre.
    if (existing.status === 'completed') {
      updatedProducts.push(...restoreStockForOrder(db, id));
    }
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  });
  deleteTransaction();

  return { updatedProducts };
}

export interface SetOrderStatusResult {
  order: Order;
  updatedProducts: Product[];
}

export function setOrderStatus(
  db: Database.Database,
  id: string,
  newStatus: OrderStatus,
): SetOrderStatusResult {
  const existing = getOrderById(db, id);
  if (!existing) {
    throw new Error(`Order not found: ${id}`);
  }

  const updatedProducts: Product[] = [];

  const statusTransaction = db.transaction(() => {
    const wasCompleted = existing.status === 'completed';
    const isNowCompleted = newStatus === 'completed';

    if (wasCompleted !== isNowCompleted) {
      if (isNowCompleted) {
        const shortages = findStockShortages(db, id);
        if (shortages.length > 0) {
          throw new AppError(
            409,
            `Estoque insuficiente para concluir o pedido: ${shortages.join('; ')}. ` +
              'Reponha o estoque ou ajuste as quantidades do pedido.',
          );
        }
      }

      updatedProducts.push(
        ...(isNowCompleted ? deductStockForOrder(db, id) : restoreStockForOrder(db, id)),
      );
    }

    const updatedAt = new Date().toISOString();
    db.prepare('UPDATE orders SET status = @status, updated_at = @updatedAt WHERE id = @id').run({
      id,
      status: newStatus,
      updatedAt,
    });
  });
  statusTransaction();

  const order = getOrderById(db, id);
  if (!order) {
    throw new Error(`Order not found after update: ${id}`);
  }

  return { order, updatedProducts };
}

export function setOrderPaymentAmount(
  db: Database.Database,
  id: string,
  amountPaid: number,
): Order {
  const existing = getOrderById(db, id);
  if (!existing) {
    throw new Error(`Order not found: ${id}`);
  }

  const updatedAt = new Date().toISOString();
  db.prepare(
    'UPDATE orders SET amount_paid = @amountPaid, updated_at = @updatedAt WHERE id = @id',
  ).run({ id, amountPaid, updatedAt });

  const order = getOrderById(db, id);
  if (!order) {
    throw new Error(`Order not found after update: ${id}`);
  }

  return order;
}
