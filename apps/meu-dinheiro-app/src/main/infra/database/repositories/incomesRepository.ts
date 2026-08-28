import Database from 'better-sqlite3';
import type { IncomeEntity } from '../../../domain/income';

/** Colunas cruas da tabela; o banco continua em snake_case. */
export interface IncomeRow {
  id: number;
  month_id: number;
  name: string;
  expected_date: string | null;
  amount: number;
  is_received: number;
  received_at: string | null;
  notes: string | null;
  bank_account_id: number | null;
  created_at: string;
}

/** Coluna extra que só existe nas consultas com JOIN. */
interface IncomeJoinRow extends IncomeRow {
  bank_account_name: string | null;
}

export function rowToIncome(row: IncomeRow | IncomeJoinRow): IncomeEntity {
  const joined = row as IncomeJoinRow;
  return {
    id: row.id,
    monthId: row.month_id,
    name: row.name,
    expectedDate: row.expected_date,
    amount: row.amount,
    // SQLite guarda 0/1; o domínio fala booleano.
    isReceived: row.is_received === 1,
    receivedAt: row.received_at,
    notes: row.notes,
    bankAccountId: row.bank_account_id,
    bankAccountName: joined.bank_account_name,
    createdAt: row.created_at,
  };
}

const WITH_JOINS = `SELECT i.*, ba.name as bank_account_name
   FROM incomes i
   LEFT JOIN bank_accounts ba ON ba.id = i.bank_account_id`;

function selectIncomeRow(db: Database.Database, id: number): IncomeRow | undefined {
  return db.prepare('SELECT * FROM incomes WHERE id = ?').get(id) as IncomeRow | undefined;
}

function todayLocalDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

export function makeIncomesRepository(db: Database.Database) {
  function findById(id: number): IncomeEntity | null {
    const row = selectIncomeRow(db, id);
    return row ? rowToIncome(row) : null;
  }

  return {
    listForMonth(monthId: number): IncomeEntity[] {
      const rows = db
        .prepare(`${WITH_JOINS} WHERE i.month_id = ? ORDER BY i.expected_date, i.name`)
        .all(monthId) as IncomeJoinRow[];
      return rows.map(rowToIncome);
    },

    /** Todas as entradas, para o backup. Sem JOINs — só as colunas próprias. */
    listAll(): IncomeEntity[] {
      const rows = db
        .prepare('SELECT * FROM incomes ORDER BY month_id')
        .all() as IncomeRow[];
      return rows.map(rowToIncome);
    },

    findById,

    /**
     * Insere a entrada. A conferência de que o Mês existe é do `incomesService`
     * (`AppError(404)`); aqui a integridade é a FK `month_id`.
     */
    create(
      monthId: number,
      data: {
        name: string;
        expectedDate?: string | null;
        amount?: number;
        bankAccountId?: number | null;
      },
    ): IncomeEntity {
      const result = db
        .prepare(
          'INSERT INTO incomes (month_id, name, expected_date, amount, bank_account_id) VALUES (?, ?, ?, ?, ?)',
        )
        .run(
          monthId,
          data.name,
          data.expectedDate || null,
          data.amount || 0,
          data.bankAccountId || null,
        );

      const created = findById(result.lastInsertRowid as number);
      if (!created) throw new Error('Income not found after insert');
      return created;
    },

    update(
      id: number,
      data: {
        name?: string;
        expectedDate?: string | null;
        amount?: number;
        notes?: string | null;
        bankAccountId?: number | null;
      },
    ): IncomeEntity | null {
      const existing = selectIncomeRow(db, id);
      if (!existing) return null;

      db.prepare(
        'UPDATE incomes SET name = ?, expected_date = ?, amount = ?, notes = ?, bank_account_id = ? WHERE id = ?',
      ).run(
        data.name ?? existing.name,
        data.expectedDate !== undefined ? data.expectedDate : existing.expected_date,
        data.amount !== undefined ? data.amount : existing.amount,
        data.notes !== undefined ? data.notes : existing.notes,
        data.bankAccountId !== undefined ? data.bankAccountId : existing.bank_account_id,
        id,
      );

      return findById(id);
    },

    delete(id: number): IncomeEntity | null {
      const existing = selectIncomeRow(db, id);
      if (!existing) return null;
      db.prepare('DELETE FROM incomes WHERE id = ?').run(id);
      return rowToIncome(existing);
    },

    /**
     * Marca a entrada como recebida. O crédito da Conta bancária e a atomicidade
     * são compostos pelo `incomesService`. Devolve `null` se a entrada sumiu.
     */
    receive(
      id: number,
      notes: string | undefined,
      receivedAt: string | undefined,
      bankAccountId: number | undefined,
    ): IncomeEntity | null {
      const existing = selectIncomeRow(db, id);
      if (!existing) return null;

      db.prepare(
        'UPDATE incomes SET is_received = 1, received_at = ?, notes = ?, bank_account_id = ? WHERE id = ?',
      ).run(
        receivedAt || todayLocalDate(),
        notes !== undefined ? notes : existing.notes,
        bankAccountId ?? null,
        id,
      );

      return findById(id);
    },

    unreceive(id: number): IncomeEntity | null {
      const existing = selectIncomeRow(db, id);
      if (!existing) return null;

      // bank_account_id não é limpo: representa a Conta associada à entrada, não
      // só a que recebeu o crédito, e serve de sugestão no próximo recebimento.
      db.prepare('UPDATE incomes SET is_received = 0, received_at = NULL WHERE id = ?').run(id);

      return findById(id);
    },

    /**
     * NULL da coluna que referencia uma Conta removida. Sem transação própria: o
     * `bankAccountsService` compõe (`repos.transaction`) junto do `delete`
     * (spec desta pasta, decisão 7).
     */
    clearBankAccount(bankAccountId: number): void {
      db.prepare('UPDATE incomes SET bank_account_id = NULL WHERE bank_account_id = ?').run(
        bankAccountId,
      );
    },
  };
}

export type IncomesRepository = ReturnType<typeof makeIncomesRepository>;
