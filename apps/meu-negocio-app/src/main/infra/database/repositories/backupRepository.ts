import type Database from 'better-sqlite3';
import { z } from 'zod';
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
 * As formas de linha do arquivo de backup. São descritas aqui inteiras, e não
 * reaproveitadas de `controllers/schemas/` (`orderStatusSchema`,
 * `companySettingsSchema`): `infra/` importar de `controllers/` seria a inversão
 * de camada que este arquivo existe para não ter. O preço é o `status` e o
 * `backupSettingsSchema` serem cópia do que aquela pasta valida.
 *
 * O drift dessa cópia é coberto pelo `tsc` no ponto em que importa: o retorno de
 * `parseBackupData` é `BackupData` sem cast, então um campo a menos no schema, ou
 * um `OrderStatus` que suma, para de compilar. O vão é um `OrderStatus` **novo**:
 * o importador o recusaria em silêncio até esta lista acompanhar — mesma classe
 * de retoque manual que a coluna nova em `importData` já pede.
 */
const backupOrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  unitCost: z.number().optional().default(0),
});

const backupOrderSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  items: z.array(backupOrderItemSchema),
  manualTotal: z.number().optional(),
  // Backups da v1 não traziam o valor pago; entram como não pagos.
  amountPaid: z.number().nonnegative().optional().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const backupProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  supplier: z.string(),
  costPrice: z.number(),
  salePrice: z.number(),
  stock: z.number(),
  minStock: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const backupSettingsSchema = z.object({
  name: z.string(),
  cnpj: z.string(),
  phone: z.string(),
  address: z.string(),
});

// Arquivos gerados por versões anteriores continuam válidos para importação.
const backupSchema = z.object({
  version: z.union([z.literal(1), z.literal(BACKUP_VERSION)]),
  exportedAt: z.string(),
  products: z.array(backupProductSchema),
  orders: z.array(backupOrderSchema),
  settings: backupSettingsSchema,
});

/**
 * O portão de entrada da importação, do lado da persistência: dado um JSON já
 * desserializado, ele é uma cópia íntegra das nossas tabelas? Responde só `sim`
 * (a `BackupData`) ou `não` (`null`) — a escolha do texto de erro que o usuário
 * lê fica no `backupService`, que é quem orquestra o fluxo.
 *
 * Mora colado em `importData` de propósito: as duas metades do formato de backup
 * — o que se aceita ler e o que se grava — divergindo em silêncio é a falha que
 * não avisa. O `tsc` segura isso, porque o retorno é `BackupData` sem cast: um
 * campo que o schema pare de exigir deixa de compilar aqui.
 *
 * A validação morava em `controllers/schemas/backup.schema.ts` e era chamada do
 * `backupService` — service não conhece zod (README §2.2), e o arquivo de backup
 * não é entrada vinda do renderer, é disco que a própria camada lê. O schema é
 * frouxo onde precisa ser: backups da v1 não traziam `unitCost` nem `amountPaid`,
 * e entram com zero em vez de invalidar o arquivo inteiro.
 */
export function parseBackupData(input: unknown): BackupData | null {
  const parsed = backupSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
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
