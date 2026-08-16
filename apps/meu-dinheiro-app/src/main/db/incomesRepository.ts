import Database from 'better-sqlite3';
import { AppError } from '../errors/AppError';
import * as bankAccountsRepository from './bankAccountsRepository';

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

export function listIncomesForMonth(db: Database.Database, monthId: number) {
  return db
    .prepare(
      `SELECT i.*, ba.name as bank_account_name
       FROM incomes i
       LEFT JOIN bank_accounts ba ON ba.id = i.bank_account_id
       WHERE i.month_id = ?
       ORDER BY i.expected_date, i.name`,
    )
    .all(monthId) as (IncomeRow & { bank_account_name: string | null })[];
}

export function getIncomeById(db: Database.Database, id: number): IncomeRow {
  const income = db.prepare('SELECT * FROM incomes WHERE id = ?').get(id) as IncomeRow | undefined;
  if (!income) {
    throw new AppError(404, 'Income not found');
  }
  return income;
}

export function createIncome(
  db: Database.Database,
  monthId: number,
  data: {
    name: string;
    expected_date?: string | null;
    amount?: number;
    bank_account_id?: number | null;
  },
): IncomeRow {
  const month = db.prepare('SELECT id FROM months WHERE id = ?').get(monthId);
  if (!month) {
    throw new AppError(404, 'Month not found');
  }

  const result = db
    .prepare(
      'INSERT INTO incomes (month_id, name, expected_date, amount, bank_account_id) VALUES (?, ?, ?, ?, ?)',
    )
    .run(
      monthId,
      data.name,
      data.expected_date || null,
      data.amount || 0,
      data.bank_account_id || null,
    );

  return db.prepare('SELECT * FROM incomes WHERE id = ?').get(result.lastInsertRowid) as IncomeRow;
}

export function updateIncome(
  db: Database.Database,
  id: number,
  data: {
    name?: string;
    expected_date?: string | null;
    amount?: number;
    notes?: string | null;
    bank_account_id?: number | null;
  },
): IncomeRow {
  const existing = getIncomeById(db, id);

  db.prepare(
    'UPDATE incomes SET name = ?, expected_date = ?, amount = ?, notes = ?, bank_account_id = ? WHERE id = ?',
  ).run(
    data.name ?? existing.name,
    data.expected_date !== undefined ? data.expected_date : existing.expected_date,
    data.amount !== undefined ? data.amount : existing.amount,
    data.notes !== undefined ? data.notes : existing.notes,
    data.bank_account_id !== undefined ? data.bank_account_id : existing.bank_account_id,
    id,
  );

  return getIncomeById(db, id);
}

export function deleteIncome(db: Database.Database, id: number) {
  getIncomeById(db, id);
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
): IncomeRow {
  const existing = getIncomeById(db, id);

  const run = db.transaction(() => {
    if (bankAccountId) {
      bankAccountsRepository.creditBankAccount(db, bankAccountId, existing.amount);
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

export function unreceiveIncome(db: Database.Database, id: number): IncomeRow {
  const existing = getIncomeById(db, id);

  const run = db.transaction(() => {
    if (existing.bank_account_id) {
      bankAccountsRepository.debitBankAccount(db, existing.bank_account_id, existing.amount);
    }
    // bank_account_id não é limpo: representa a conta associada à entrada,
    // não só a conta que recebeu o crédito, e serve de sugestão no próximo recebimento.
    db.prepare('UPDATE incomes SET is_received = 0, received_at = NULL WHERE id = ?').run(id);
  });
  run();

  return getIncomeById(db, id);
}
