import Database from 'better-sqlite3';
import type { ExpenseEntity } from '../../../domain/expense';

/** Colunas cruas da tabela; o banco continua em snake_case. */
export interface ExpenseRow {
  id: number;
  month_id: number;
  name: string;
  due_date: string | null;
  amount: number;
  is_paid: number;
  paid_at: string | null;
  receipt: string | null;
  notes: string | null;
  bank_account_id: number | null;
  category_id: number | null;
  created_at: string;
}

/** Colunas extras que só existem nas consultas com JOIN. */
interface ExpenseJoinRow extends ExpenseRow {
  bank_account_name: string | null;
  category_name: string | null;
  category_color: string | null;
}

export function rowToExpense(row: ExpenseRow | ExpenseJoinRow): ExpenseEntity {
  const joined = row as ExpenseJoinRow;
  return {
    id: row.id,
    monthId: row.month_id,
    name: row.name,
    dueDate: row.due_date,
    amount: row.amount,
    // SQLite guarda 0/1; o domínio fala booleano.
    isPaid: row.is_paid === 1,
    paidAt: row.paid_at,
    receipt: row.receipt,
    notes: row.notes,
    bankAccountId: row.bank_account_id,
    bankAccountName: joined.bank_account_name,
    categoryId: row.category_id,
    categoryName: joined.category_name,
    categoryColor: joined.category_color,
    createdAt: row.created_at,
  };
}

const WITH_JOINS = `SELECT e.*, ba.name as bank_account_name, c.name as category_name, c.color as category_color
   FROM expenses e
   LEFT JOIN bank_accounts ba ON ba.id = e.bank_account_id
   LEFT JOIN categories c ON c.id = e.category_id`;

function selectExpenseRow(db: Database.Database, id: number): ExpenseRow | undefined {
  return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as ExpenseRow | undefined;
}

function todayLocalDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

export function makeExpensesRepository(db: Database.Database) {
  function findById(id: number): ExpenseEntity | null {
    const row = selectExpenseRow(db, id);
    return row ? rowToExpense(row) : null;
  }

  return {
    listForMonth(monthId: number): ExpenseEntity[] {
      const rows = db
        .prepare(`${WITH_JOINS} WHERE e.month_id = ? ORDER BY e.due_date, e.name`)
        .all(monthId) as ExpenseJoinRow[];
      return rows.map(rowToExpense);
    },

    /** Todas as despesas, para o backup. Sem JOINs — só as colunas próprias. */
    listAll(): ExpenseEntity[] {
      const rows = db
        .prepare('SELECT * FROM expenses ORDER BY month_id')
        .all() as ExpenseRow[];
      return rows.map(rowToExpense);
    },

    findById,

    /**
     * Só o nome da despesa e o rótulo do Mês, para montar o nome do arquivo de
     * comprovante. Não é `rowToExpense` — é um par de strings em camelCase, sem
     * chave `snake_case` saindo do repositório.
     */
    getForFilename(id: number): { name: string; monthLabel: string } | null {
      const row = db
        .prepare(
          'SELECT e.name as name, m.label as month_label FROM expenses e JOIN months m ON e.month_id = m.id WHERE e.id = ?',
        )
        .get(id) as { name: string; month_label: string } | undefined;
      return row ? { name: row.name, monthLabel: row.month_label } : null;
    },

    /**
     * Insere a despesa. A conferência de que o Mês existe é do `expensesService`
     * (`AppError(404)`); aqui a integridade é a FK `month_id`.
     */
    create(
      monthId: number,
      data: {
        name: string;
        dueDate?: string | null;
        amount?: number;
        categoryId?: number | null;
      },
    ): ExpenseEntity {
      const result = db
        .prepare(
          'INSERT INTO expenses (month_id, name, due_date, amount, category_id) VALUES (?, ?, ?, ?, ?)',
        )
        .run(monthId, data.name, data.dueDate || null, data.amount || 0, data.categoryId ?? null);

      const created = findById(result.lastInsertRowid as number);
      if (!created) throw new Error('Expense not found after insert');
      return created;
    },

    update(
      id: number,
      data: {
        name?: string;
        dueDate?: string | null;
        amount?: number;
        notes?: string | null;
        categoryId?: number | null;
      },
    ): ExpenseEntity | null {
      const existing = selectExpenseRow(db, id);
      if (!existing) return null;

      db.prepare(
        'UPDATE expenses SET name = ?, due_date = ?, amount = ?, notes = ?, category_id = ? WHERE id = ?',
      ).run(
        data.name ?? existing.name,
        data.dueDate !== undefined ? data.dueDate : existing.due_date,
        data.amount !== undefined ? data.amount : existing.amount,
        data.notes !== undefined ? data.notes : existing.notes,
        data.categoryId !== undefined ? data.categoryId : existing.category_id,
        id,
      );

      return findById(id);
    },

    /** Apaga a despesa. O comprovante em disco é apagado pelo `expensesService`. */
    delete(id: number): ExpenseEntity | null {
      const existing = selectExpenseRow(db, id);
      if (!existing) return null;
      db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
      return rowToExpense(existing);
    },

    /**
     * Marca a despesa como paga. O débito da Conta bancária e a atomicidade
     * (`repos.transaction`) são compostos pelo `expensesService`. Devolve `null`
     * se a despesa sumiu.
     */
    pay(
      id: number,
      receipt: string | undefined,
      notes: string | undefined,
      paidAt: string | undefined,
      bankAccountId: number | undefined,
    ): ExpenseEntity | null {
      const existing = selectExpenseRow(db, id);
      if (!existing) return null;

      db.prepare(
        'UPDATE expenses SET is_paid = 1, paid_at = ?, receipt = ?, notes = ?, bank_account_id = ? WHERE id = ?',
      ).run(
        paidAt || todayLocalDate(),
        receipt ?? existing.receipt,
        notes !== undefined ? notes : existing.notes,
        bankAccountId ?? null,
        id,
      );

      return findById(id);
    },

    /**
     * Desmarca o pagamento. O crédito de volta na Conta e a exclusão do
     * comprovante são do `expensesService`.
     */
    unpay(id: number): ExpenseEntity | null {
      const existing = selectExpenseRow(db, id);
      if (!existing) return null;

      db.prepare(
        'UPDATE expenses SET is_paid = 0, paid_at = NULL, receipt = NULL, bank_account_id = NULL WHERE id = ?',
      ).run(id);

      return findById(id);
    },

    /**
     * NULL das colunas que referenciam uma linha removida. Sem transação
     * própria: o `categoriesService`/`bankAccountsService` compõem
     * (`repos.transaction`) junto do `delete` da linha (spec desta pasta, decisão 7).
     */
    clearCategory(categoryId: number): void {
      db.prepare('UPDATE expenses SET category_id = NULL WHERE category_id = ?').run(categoryId);
    },

    clearBankAccount(bankAccountId: number): void {
      db.prepare('UPDATE expenses SET bank_account_id = NULL WHERE bank_account_id = ?').run(
        bankAccountId,
      );
    },
  };
}

export type ExpensesRepository = ReturnType<typeof makeExpensesRepository>;
