import Database from 'better-sqlite3';
import type { Income } from '@shared/types/income';
import { AppError } from '../errors/AppError';
import { creditBankAccount, debitBankAccount } from './bankAccountsRepository';

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

export function rowToIncome(row: IncomeRow | IncomeJoinRow): Income {
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

export function listIncomesForMonth(db: Database.Database, monthId: number): Income[] {
  const rows = db
    .prepare(`${WITH_JOINS} WHERE i.month_id = ? ORDER BY i.expected_date, i.name`)
    .all(monthId) as IncomeJoinRow[];
  return rows.map(rowToIncome);
}

function getIncomeRow(db: Database.Database, id: number): IncomeRow {
  const income = db.prepare('SELECT * FROM incomes WHERE id = ?').get(id) as IncomeRow | undefined;
  if (!income) {
    throw new AppError(404, 'Entrada não encontrada');
  }
  return income;
}

export function getIncomeById(db: Database.Database, id: number): Income {
  return rowToIncome(getIncomeRow(db, id));
}

export function createIncome(
  db: Database.Database,
  monthId: number,
  data: {
    name: string;
    expectedDate?: string | null;
    amount?: number;
    bankAccountId?: number | null;
  },
): Income {
  const month = db.prepare('SELECT id FROM months WHERE id = ?').get(monthId);
  if (!month) {
    throw new AppError(404, 'Mês não encontrado');
  }

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

  return getIncomeById(db, result.lastInsertRowid as number);
}

export function updateIncome(
  db: Database.Database,
  id: number,
  data: {
    name?: string;
    expectedDate?: string | null;
    amount?: number;
    notes?: string | null;
    bankAccountId?: number | null;
  },
): Income {
  const existing = getIncomeRow(db, id);

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

  return getIncomeById(db, id);
}

export function deleteIncome(db: Database.Database, id: number) {
  getIncomeRow(db, id);
  db.prepare('DELETE FROM incomes WHERE id = ?').run(id);
}

function todayLocalDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

export function receiveIncome(
  db: Database.Database,
  id: number,
  notes: string | undefined,
  receivedAt: string | undefined,
  bankAccountId: number | undefined,
): Income {
  const existing = getIncomeRow(db, id);

  const run = db.transaction(() => {
    if (bankAccountId) {
      creditBankAccount(db, bankAccountId, existing.amount);
    }
    db.prepare(
      'UPDATE incomes SET is_received = 1, received_at = ?, notes = ?, bank_account_id = ? WHERE id = ?',
    ).run(
      receivedAt || todayLocalDate(),
      notes !== undefined ? notes : existing.notes,
      bankAccountId ?? null,
      id,
    );
  });
  run();

  return getIncomeById(db, id);
}

export function unreceiveIncome(db: Database.Database, id: number): Income {
  const existing = getIncomeRow(db, id);

  const run = db.transaction(() => {
    if (existing.bank_account_id) {
      debitBankAccount(db, existing.bank_account_id, existing.amount);
    }
    // bank_account_id não é limpo: representa a conta associada à entrada,
    // não só a conta que recebeu o crédito, e serve de sugestão no próximo recebimento.
    db.prepare('UPDATE incomes SET is_received = 0, received_at = NULL WHERE id = ?').run(id);
  });
  run();

  return getIncomeById(db, id);
}
