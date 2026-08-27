import type Database from 'better-sqlite3';

/**
 * Migrações incrementais do banco.
 *
 * `SCHEMA`, em `connection.ts`, cobre instalações novas; aqui ficam as
 * alterações em bancos que já existem. Cada migração roda uma vez por banco,
 * na ordem do array, e o `id` da última aplicada fica gravado em
 * `PRAGMA user_version`.
 *
 * Duas regras, ambas por causa dos bancos que já estão instalados na máquina
 * dos usuários (todos com `user_version = 0`, o que faz a lista inteira rodar
 * neles na primeira atualização):
 *
 * 1. Cada `up` precisa ser idempotente — verifique antes de alterar
 *    (`pragma_table_info`, `sqlite_master`), nunca um `ALTER TABLE` seco.
 * 2. `id` é sequencial e definitivo: não reordene, não reaproveite e não
 *    edite uma migração já publicada. Corrija com uma nova.
 */
interface Migration {
  id: number;
  name: string;
  up: (db: Database.Database) => void;
}

/** Helper de idempotência: a coluna já existe nesta tabela? */
export function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return columns.some((c) => c.name === column);
}

/** Helper de idempotência: a tabela já existe? */
export function hasTable(db: Database.Database, table: string): boolean {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
}

// Para os pedidos já concluídos não há como saber quanto foi realmente baixado:
// assume-se a quantidade cheia, que é o que acontece sempre que o estoque cobria
// o pedido — o caso normal.
function backfillStockAppliedForCompletedOrders(db: Database.Database): void {
  db.prepare(
    `UPDATE order_items SET stock_applied = quantity
     WHERE order_id IN (SELECT id FROM orders WHERE status = 'completed')`,
  ).run();
}

function backfillAmountPaidForCompletedOrders(db: Database.Database): void {
  const completedOrders = db
    .prepare(
      `SELECT o.id AS id, o.manual_total AS manual_total,
         COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS items_total
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.status = 'completed'
       GROUP BY o.id`,
    )
    .all() as {
    id: string;
    manual_total: number | null;
    items_total: number;
  }[];

  const updateAmountPaid = db.prepare('UPDATE orders SET amount_paid = @amountPaid WHERE id = @id');
  for (const row of completedOrders) {
    const total = row.manual_total ?? row.items_total;
    updateAmountPaid.run({ id: row.id, amountPaid: total });
  }
}

const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: 'order_items.unit_cost',
    up: (db) => {
      if (!hasColumn(db, 'order_items', 'unit_cost')) {
        db.exec('ALTER TABLE order_items ADD COLUMN unit_cost REAL NOT NULL DEFAULT 0');
      }
    },
  },
  {
    id: 2,
    name: 'orders.amount_paid',
    up: (db) => {
      if (!hasColumn(db, 'orders', 'amount_paid')) {
        db.exec('ALTER TABLE orders ADD COLUMN amount_paid REAL NOT NULL DEFAULT 0');
        backfillAmountPaidForCompletedOrders(db);
      }
    },
  },
  {
    id: 3,
    name: 'order_items.stock_applied',
    up: (db) => {
      if (!hasColumn(db, 'order_items', 'stock_applied')) {
        db.exec('ALTER TABLE order_items ADD COLUMN stock_applied INTEGER NOT NULL DEFAULT 0');
        backfillStockAppliedForCompletedOrders(db);
      }
    },
  },
];

export function runMigrations(db: Database.Database): void {
  const current = db.pragma('user_version', { simple: true }) as number;

  for (const migration of MIGRATIONS) {
    if (migration.id <= current) continue;

    const apply = db.transaction(() => {
      migration.up(db);
      // PRAGMA não aceita parâmetro vinculado; o id vem do array acima, nunca
      // de entrada externa.
      db.pragma(`user_version = ${migration.id}`);
    });
    apply();
  }
}
