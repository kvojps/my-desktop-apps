import Database from 'better-sqlite3';
import type { MonthDetailEntity, MonthEntity } from '../../../domain/month';
import { monthLabel } from '../../../domain/monthNames';
import { rowToExpense } from './expensesRepository';
import { rowToIncome } from './incomesRepository';

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

export function rowToMonth(row: MonthRow): MonthEntity {
  return {
    id: row.id,
    label: row.label,
    year: row.year,
    month: row.month,
    createdAt: row.created_at,
  };
}

function rowToMonthWithTotals(row: MonthRow & MonthTotalsRow): MonthEntity {
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

/**
 * Compõe o nó aninhado `MonthDetailEntity` a partir das linhas de cada tabela —
 * um mapper por nó-objeto (`rowToMonth` / `rowToExpense` / `rowToIncome`), sem
 * atravessar o objeto inteiro por identidade estrutural (README §2.5).
 */
export function buildMonthDetail(
  monthRow: MonthRow,
  expenseRows: Parameters<typeof rowToExpense>[0][],
  incomeRows: Parameters<typeof rowToIncome>[0][],
): MonthDetailEntity {
  return {
    ...rowToMonth(monthRow),
    expenses: expenseRows.map(rowToExpense),
    incomes: incomeRows.map(rowToIncome),
  };
}

/**
 * Verbos de persistência do Mês. A competência, o rollover Dez→Jan, a cópia dos
 * padrões e a marcação da Competência corrente/excluída moram no `monthsService`
 * (spec desta pasta, decisões 5, 6, 8) — aqui ficou só o SQL.
 */
export function makeMonthsRepository(db: Database.Database) {
  return {
    /** O agregado de Realizado/Previsto por Mês, para a tela de Histórico. */
    list(): MonthEntity[] {
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
    },

    /**
     * Todos os Meses, sem os agregados: a cascata de padrões e o backup precisam
     * só de `id`/`label`/`year`/`month`, não das 12 subconsultas de totais.
     */
    listAll(): MonthEntity[] {
      const rows = db
        .prepare('SELECT * FROM months ORDER BY year, month')
        .all() as MonthRow[];
      return rows.map(rowToMonth);
    },

    /** Era `getMonthWithExpenses`; devolve `null` em vez de lançar 404 — o 404 é do service. */
    findById(id: number): MonthDetailEntity | null {
      const month = db.prepare('SELECT * FROM months WHERE id = ?').get(id) as MonthRow | undefined;
      if (!month) return null;

      const expenseRows = db
        .prepare(
          `SELECT e.*, ba.name as bank_account_name, c.name as category_name, c.color as category_color
           FROM expenses e
           LEFT JOIN bank_accounts ba ON ba.id = e.bank_account_id
           LEFT JOIN categories c ON c.id = e.category_id
           WHERE e.month_id = ?
           ORDER BY e.due_date, e.name`,
        )
        .all(id) as Parameters<typeof rowToExpense>[0][];

      const incomeRows = db
        .prepare(
          `SELECT i.*, ba.name as bank_account_name
           FROM incomes i
           LEFT JOIN bank_accounts ba ON ba.id = i.bank_account_id
           WHERE i.month_id = ?
           ORDER BY i.expected_date, i.name`,
        )
        .all(id) as Parameters<typeof rowToIncome>[0][];

      return buildMonthDetail(month, expenseRows, incomeRows);
    },

    /** O Mês de uma dada Competência (ano + mês), ou `null`. */
    findByCompetency(year: number, month: number): MonthEntity | null {
      const row = db
        .prepare('SELECT * FROM months WHERE year = ? AND month = ?')
        .get(year, month) as MonthRow | undefined;
      return row ? rowToMonth(row) : null;
    },

    /** O Mês de Competência mais recente, ou `null` quando não há nenhum. */
    latest(): MonthEntity | null {
      const row = db
        .prepare('SELECT * FROM months ORDER BY year DESC, month DESC LIMIT 1')
        .get() as MonthRow | undefined;
      return row ? rowToMonth(row) : null;
    },

    /** Guarda de integridade barata para `expensesService`/`incomesService`. */
    exists(id: number): boolean {
      return !!db.prepare('SELECT 1 FROM months WHERE id = ?').get(id);
    },

    /**
     * Insere só o Mês — sem a cópia dos padrões, que o `monthsService` compõe em
     * volta dentro de `repos.transaction`.
     */
    create(year: number, month: number): MonthEntity {
      const result = db
        .prepare('INSERT INTO months (label, year, month) VALUES (?, ?, ?)')
        .run(monthLabel(year, month), year, month);
      return rowToMonth(
        db.prepare('SELECT * FROM months WHERE id = ?').get(result.lastInsertRowid) as MonthRow,
      );
    },

    /** Apaga o Mês (as despesas e entradas vão por cascata do banco). Devolve `null` — sem decidir 404. */
    delete(id: number): MonthEntity | null {
      const existing = db.prepare('SELECT * FROM months WHERE id = ?').get(id) as
        | MonthRow
        | undefined;
      if (!existing) return null;

      db.prepare('DELETE FROM months WHERE id = ?').run(id);
      return rowToMonth(existing);
    },
  };
}

export type MonthsRepository = ReturnType<typeof makeMonthsRepository>;
