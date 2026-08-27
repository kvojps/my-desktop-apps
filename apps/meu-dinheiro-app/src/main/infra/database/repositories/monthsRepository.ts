import Database from 'better-sqlite3';
import type { Month, MonthDetail } from '@shared/types/month';
import { formatDueDate, monthLabel } from '../../../domain/monthNames';
import { AppError } from '../../../utils/errors/AppError';
import { getAppSetting, setAppSetting } from './appSettingsRepository';
import { rowToExpense } from './expensesRepository';
import { rowToIncome } from './incomesRepository';

/**
 * Última competência (AAAA-MM) que o app já tratou como "mês corrente".
 * Enquanto a marca for a competência de hoje, o mês corrente não é recriado -
 * é o que faz uma exclusão intencional ser respeitada.
 */
export const LAST_CURRENT_MONTH_KEY = 'last_current_month';

function competencyKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function currentCompetency() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function rememberCurrentCompetency(db: Database.Database, year: number, month: number) {
  const current = currentCompetency();
  if (year === current.year && month === current.month) {
    setAppSetting(db, LAST_CURRENT_MONTH_KEY, competencyKey(year, month));
  }
}

/** Colunas cruas da tabela; o banco continua em snake_case. */
export interface MonthRow {
  id: number;
  label: string;
  year: number;
  month: number;
  created_at: string;
}

/** Agregados que só a listagem calcula, somados pelo próprio SQL. */
interface MonthTotalsRow {
  total_expenses: number;
  paid_expenses: number;
  paid_amount: number;
  unpaid_amount: number;
  total_amount: number;
  overdue_expenses: number;
  overdue_amount: number;
  total_incomes: number;
  received_incomes: number;
  received_income: number;
  pending_income: number;
  total_income: number;
}

export function rowToMonth(row: MonthRow): Month {
  return {
    id: row.id,
    label: row.label,
    year: row.year,
    month: row.month,
    createdAt: row.created_at,
  };
}

function rowToMonthWithTotals(row: MonthRow & MonthTotalsRow): Month {
  return {
    ...rowToMonth(row),
    totalExpenses: row.total_expenses,
    paidExpenses: row.paid_expenses,
    paidAmount: row.paid_amount,
    unpaidAmount: row.unpaid_amount,
    totalAmount: row.total_amount,
    overdueExpenses: row.overdue_expenses,
    overdueAmount: row.overdue_amount,
    totalIncomes: row.total_incomes,
    receivedIncomes: row.received_incomes,
    receivedIncome: row.received_income,
    pendingIncome: row.pending_income,
    totalIncome: row.total_income,
  };
}

interface DefaultExpenseRow {
  id: number;
  name: string;
  due_day: number | null;
  amount: number;
  category_id: number | null;
}

interface DefaultIncomeRow {
  id: number;
  name: string;
  expected_day: number | null;
  amount: number;
  bank_account_id: number | null;
}

function insertExpensesFromDefaults(
  db: Database.Database,
  monthId: number,
  year: number,
  month: number,
) {
  const defaults = db.prepare('SELECT * FROM default_expenses').all() as DefaultExpenseRow[];
  const insertExpense = db.prepare(
    'INSERT INTO expenses (month_id, name, due_date, amount, category_id) VALUES (?, ?, ?, ?, ?)',
  );
  for (const def of defaults) {
    insertExpense.run(
      monthId,
      def.name,
      formatDueDate(year, month, def.due_day),
      def.amount,
      def.category_id,
    );
  }
}

function insertIncomesFromDefaults(
  db: Database.Database,
  monthId: number,
  year: number,
  month: number,
) {
  const defaults = db.prepare('SELECT * FROM default_incomes').all() as DefaultIncomeRow[];
  const insertIncome = db.prepare(
    'INSERT INTO incomes (month_id, name, expected_date, amount, bank_account_id) VALUES (?, ?, ?, ?, ?)',
  );
  for (const def of defaults) {
    insertIncome.run(
      monthId,
      def.name,
      formatDueDate(year, month, def.expected_day),
      def.amount,
      def.bank_account_id,
    );
  }
}

export function findMonthByYearMonth(db: Database.Database, year: number, month: number) {
  return db.prepare('SELECT id FROM months WHERE year = ? AND month = ?').get(year, month) as
    { id: number } | undefined;
}

export function createMonthWithDefaults(db: Database.Database, year: number, month: number): Month {
  const label = monthLabel(year, month);

  const create = db.transaction(() => {
    const result = db
      .prepare('INSERT INTO months (label, year, month) VALUES (?, ?, ?)')
      .run(label, year, month);
    const monthId = result.lastInsertRowid as number;
    insertExpensesFromDefaults(db, monthId, year, month);
    insertIncomesFromDefaults(db, monthId, year, month);
    return monthId;
  });

  const monthId = create();
  rememberCurrentCompetency(db, year, month);
  return rowToMonth(db.prepare('SELECT * FROM months WHERE id = ?').get(monthId) as MonthRow);
}

/**
 * Cria o mês corrente no máximo uma vez por competência. Roda no boot do app
 * (não a cada listagem), então excluir o mês corrente não o traz de volta.
 * Retorna o mês criado, ou null quando nada foi feito.
 */
export function ensureCurrentMonthExists(db: Database.Database): Month | null {
  const { year, month } = currentCompetency();
  const key = competencyKey(year, month);

  if (getAppSetting(db, LAST_CURRENT_MONTH_KEY) === key) return null;

  if (findMonthByYearMonth(db, year, month)) {
    setAppSetting(db, LAST_CURRENT_MONTH_KEY, key);
    return null;
  }

  return createMonthWithDefaults(db, year, month);
}

export function listMonths(db: Database.Database): Month[] {
  const rows = db
    .prepare(
      `
    SELECT m.*,
      (SELECT COUNT(*) FROM expenses e WHERE e.month_id = m.id) as total_expenses,
      (SELECT COALESCE(SUM(CASE WHEN e.is_paid = 1 THEN 1 ELSE 0 END), 0) FROM expenses e WHERE e.month_id = m.id) as paid_expenses,
      (SELECT COALESCE(SUM(CASE WHEN e.is_paid = 1 THEN e.amount ELSE 0 END), 0) FROM expenses e WHERE e.month_id = m.id) as paid_amount,
      (SELECT COALESCE(SUM(CASE WHEN e.is_paid = 0 THEN e.amount ELSE 0 END), 0) FROM expenses e WHERE e.month_id = m.id) as unpaid_amount,
      (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.month_id = m.id) as total_amount,
      (SELECT COALESCE(SUM(CASE WHEN e.is_paid = 0 AND e.due_date IS NOT NULL AND e.due_date < date('now') THEN 1 ELSE 0 END), 0) FROM expenses e WHERE e.month_id = m.id) as overdue_expenses,
      (SELECT COALESCE(SUM(CASE WHEN e.is_paid = 0 AND e.due_date IS NOT NULL AND e.due_date < date('now') THEN e.amount ELSE 0 END), 0) FROM expenses e WHERE e.month_id = m.id) as overdue_amount,
      (SELECT COUNT(*) FROM incomes i WHERE i.month_id = m.id) as total_incomes,
      (SELECT COALESCE(SUM(CASE WHEN i.is_received = 1 THEN 1 ELSE 0 END), 0) FROM incomes i WHERE i.month_id = m.id) as received_incomes,
      (SELECT COALESCE(SUM(CASE WHEN i.is_received = 1 THEN i.amount ELSE 0 END), 0) FROM incomes i WHERE i.month_id = m.id) as received_income,
      (SELECT COALESCE(SUM(CASE WHEN i.is_received = 0 THEN i.amount ELSE 0 END), 0) FROM incomes i WHERE i.month_id = m.id) as pending_income,
      (SELECT COALESCE(SUM(i.amount), 0) FROM incomes i WHERE i.month_id = m.id) as total_income
    FROM months m
    ORDER BY m.year DESC, m.month DESC
  `,
    )
    .all() as (MonthRow & MonthTotalsRow)[];

  return rows.map(rowToMonthWithTotals);
}

export function getMonthWithExpenses(db: Database.Database, id: number): MonthDetail {
  const month = db.prepare('SELECT * FROM months WHERE id = ?').get(id) as MonthRow | undefined;
  if (!month) {
    throw new AppError(404, 'Mês não encontrado');
  }

  const expenses = db
    .prepare(
      `SELECT e.*, ba.name as bank_account_name, c.name as category_name, c.color as category_color
       FROM expenses e
       LEFT JOIN bank_accounts ba ON ba.id = e.bank_account_id
       LEFT JOIN categories c ON c.id = e.category_id
       WHERE e.month_id = ?
       ORDER BY e.due_date, e.name`,
    )
    .all(id) as Parameters<typeof rowToExpense>[0][];

  const incomes = db
    .prepare(
      `SELECT i.*, ba.name as bank_account_name
       FROM incomes i
       LEFT JOIN bank_accounts ba ON ba.id = i.bank_account_id
       WHERE i.month_id = ?
       ORDER BY i.expected_date, i.name`,
    )
    .all(id) as Parameters<typeof rowToIncome>[0][];

  return {
    ...rowToMonth(month),
    expenses: expenses.map(rowToExpense),
    incomes: incomes.map(rowToIncome),
  };
}

export function createNextMonth(db: Database.Database, year?: number, month?: number): Month {
  if (!year || !month) {
    const lastMonth = db
      .prepare('SELECT * FROM months ORDER BY year DESC, month DESC LIMIT 1')
      .get() as { year: number; month: number } | undefined;

    if (!lastMonth) {
      throw new AppError(400, 'Nenhum mês existe ainda. Cadastre o primeiro nas Configurações.');
    }

    year = lastMonth.year;
    month = lastMonth.month + 1;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  if (findMonthByYearMonth(db, year, month)) {
    throw new AppError(400, 'Esse mês já existe');
  }

  return createMonthWithDefaults(db, year, month);
}

export function deleteMonth(db: Database.Database, id: number) {
  const existing = db.prepare('SELECT id, year, month FROM months WHERE id = ?').get(id) as
    { id: number; year: number; month: number } | undefined;
  if (!existing) {
    throw new AppError(404, 'Mês não encontrado');
  }
  db.prepare('DELETE FROM months WHERE id = ?').run(id);
  // Exclusão do mês corrente é intencional: marca a competência para o boot não recriá-la.
  rememberCurrentCompetency(db, existing.year, existing.month);
}

export function createMonthsBatch(
  db: Database.Database,
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
) {
  const created: Month[] = [];
  const errors: string[] = [];
  let year = fromYear;
  let month = fromMonth;

  const run = db.transaction(() => {
    while (year < toYear || (year === toYear && month <= toMonth)) {
      if (findMonthByYearMonth(db, year, month)) {
        errors.push(`${monthLabel(year, month)} já existe`);
      } else {
        created.push(createMonthWithDefaults(db, year, month));
      }

      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
  });

  run();

  return { created, errors };
}
