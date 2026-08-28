import type Database from 'better-sqlite3';
import { z } from 'zod';
import type { Repositories } from '../index';

/**
 * Linhas cruas do backup, já normalizadas (chaves legadas resolvidas). É o que
 * `importData` grava e o que `parseBackupData` devolve — as duas metades do
 * formato têm de bater, e o `tsc` segura isso porque `parseBackupData` devolve
 * `BackupData` sem cast.
 */
export interface BackupData {
  categories: { id: number; name: string; color: string }[];
  default_expenses: {
    name: string;
    due_day: number | null;
    amount: number;
    category_id?: number | null;
  }[];
  default_incomes: {
    name: string;
    expected_day: number | null;
    amount: number;
    bank_account_id?: number | null;
  }[];
  bank_accounts: { id: number; name: string; balance: number }[];
  months: { id: number; label: string; year: number; month: number }[];
  expenses: {
    id: number;
    month_id: number;
    name: string;
    due_date: string | null;
    amount: number;
    is_paid: number;
    paid_at: string | null;
    receipt: string | null;
    notes: string | null;
    bank_account_id?: number | null;
    category_id?: number | null;
  }[];
  incomes: {
    id: number;
    month_id: number;
    name: string;
    expected_date: string | null;
    amount: number;
    is_received: number;
    received_at: string | null;
    notes: string | null;
    bank_account_id?: number | null;
  }[];
}

/** O que vai para o `data.json` do `.zip` — `BackupData` mais o cabeçalho. */
export interface BackupFile extends BackupData {
  version: number;
  exported_at: string;
}

/**
 * Lê as sete tabelas pela unidade de trabalho e as devolve na forma plana
 * `snake_case` do arquivo de backup — a mesma que versões anteriores gravavam,
 * para os `.zip` já exportados continuarem válidos. O `backupService` orquestra
 * o disco e o diálogo em volta disto (spec desta pasta, decisão 12).
 */
export function exportData(repos: Repositories): BackupFile {
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    categories: repos.categories.list().map((c) => ({ id: c.id, name: c.name, color: c.color })),
    default_expenses: repos.defaultExpenses.list().map((d) => ({
      name: d.name,
      due_day: d.dueDay,
      amount: d.amount,
      category_id: d.categoryId ?? null,
    })),
    default_incomes: repos.defaultIncomes.list().map((d) => ({
      name: d.name,
      expected_day: d.expectedDay,
      amount: d.amount,
      bank_account_id: d.bankAccountId ?? null,
    })),
    bank_accounts: repos.bankAccounts
      .list()
      .map((b) => ({ id: b.id, name: b.name, balance: b.balance })),
    months: repos.months
      .listAll()
      .map((m) => ({ id: m.id, label: m.label, year: m.year, month: m.month })),
    expenses: repos.expenses.listAll().map((e) => ({
      id: e.id,
      month_id: e.monthId,
      name: e.name,
      due_date: e.dueDate,
      amount: e.amount,
      is_paid: e.isPaid ? 1 : 0,
      paid_at: e.paidAt,
      receipt: e.receipt,
      notes: e.notes,
      bank_account_id: e.bankAccountId ?? null,
      category_id: e.categoryId ?? null,
    })),
    incomes: repos.incomes.listAll().map((i) => ({
      id: i.id,
      month_id: i.monthId,
      name: i.name,
      expected_date: i.expectedDate,
      amount: i.amount,
      is_received: i.isReceived ? 1 : 0,
      received_at: i.receivedAt,
      notes: i.notes,
      bank_account_id: i.bankAccountId ?? null,
    })),
  };
}

const rowNumber = z.number();
const nullableString = z.string().nullish().transform((v) => v ?? null);
const nullableNumber = z.number().nullish().transform((v) => v ?? null);

const backupSchema = z.object({
  categories: z.array(z.object({ id: rowNumber, name: z.string(), color: z.string() })),
  default_expenses: z.array(
    z.object({
      name: z.string(),
      due_day: nullableNumber,
      amount: z.number(),
      category_id: z.number().nullish(),
    }),
  ),
  default_incomes: z.array(
    z.object({
      name: z.string(),
      expected_day: nullableNumber,
      amount: z.number(),
      bank_account_id: z.number().nullish(),
    }),
  ),
  bank_accounts: z.array(z.object({ id: rowNumber, name: z.string(), balance: z.number() })),
  months: z.array(
    z.object({ id: rowNumber, label: z.string(), year: rowNumber, month: rowNumber }),
  ),
  expenses: z.array(
    z.object({
      id: rowNumber,
      month_id: rowNumber,
      name: z.string(),
      due_date: nullableString,
      amount: z.number(),
      is_paid: z.number(),
      paid_at: nullableString,
      receipt: nullableString,
      notes: nullableString,
      bank_account_id: z.number().nullish(),
      category_id: z.number().nullish(),
    }),
  ),
  incomes: z.array(
    z.object({
      id: rowNumber,
      month_id: rowNumber,
      name: z.string(),
      expected_date: nullableString,
      amount: z.number(),
      is_received: z.number(),
      received_at: nullableString,
      notes: nullableString,
      bank_account_id: z.number().nullish(),
    }),
  ),
});

/**
 * O portão de entrada da importação, do lado da persistência: dado o `data.json`
 * já desserializado, ele é uma cópia íntegra das nossas tabelas? Responde só
 * `BackupData` ou `null` — o texto de erro que o usuário lê é escolha do
 * `backupService`.
 *
 * A tolerância a backups legados mora aqui: `.zip` exportados antes da
 * renomeação "contas" → "despesas" trazem `accounts`/`default_accounts`, e os
 * anteriores às Contas bancárias / Categorias / Entradas simplesmente não têm
 * essas chaves. O `backupService` não conhece zod (README §2.2) e o arquivo é
 * disco que a própria camada lê, não entrada do renderer.
 */
export function parseBackupData(input: unknown): BackupData | null {
  if (typeof input !== 'object' || input === null) return null;
  const raw = input as Record<string, unknown>;

  if (!raw.version || !raw.months || !(raw.expenses ?? raw.accounts)) return null;

  const parsed = backupSchema.safeParse({
    categories: raw.categories ?? [],
    default_expenses: raw.default_expenses ?? raw.default_accounts ?? [],
    default_incomes: raw.default_incomes ?? [],
    bank_accounts: raw.bank_accounts ?? [],
    months: raw.months,
    expenses: raw.expenses ?? raw.accounts,
    incomes: raw.incomes ?? [],
  });

  return parsed.success ? parsed.data : null;
}

/**
 * Continua sobre `db` cru, não sobre `repos`: apagar e reescrever sete tabelas
 * inteiras numa única transação não é uma sequência de verbos de entidade — não
 * há `create`/`update` de repositório que caiba aqui. É por isso que
 * `makeRepositories` a embrulha em `importBackup` em vez de compô-la no service.
 */
export function importData(db: Database.Database, data: BackupData): void {
  db.pragma('foreign_keys = OFF');
  try {
    const run = db.transaction(() => {
      db.exec('DELETE FROM expenses');
      db.exec('DELETE FROM incomes');
      db.exec('DELETE FROM default_expenses');
      db.exec('DELETE FROM default_incomes');
      db.exec('DELETE FROM bank_accounts');
      db.exec('DELETE FROM months');
      db.exec('DELETE FROM categories');

      const insertCategory = db.prepare('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)');
      for (const cat of data.categories) {
        insertCategory.run(cat.id, cat.name, cat.color);
      }

      const insertDefault = db.prepare(
        'INSERT INTO default_expenses (name, due_day, amount, category_id) VALUES (?, ?, ?, ?)',
      );
      for (const exp of data.default_expenses) {
        insertDefault.run(exp.name, exp.due_day, exp.amount, exp.category_id ?? null);
      }

      const insertDefaultIncome = db.prepare(
        'INSERT INTO default_incomes (name, expected_day, amount, bank_account_id) VALUES (?, ?, ?, ?)',
      );
      for (const inc of data.default_incomes) {
        insertDefaultIncome.run(inc.name, inc.expected_day, inc.amount, inc.bank_account_id ?? null);
      }

      const insertBankAccount = db.prepare(
        'INSERT INTO bank_accounts (id, name, balance) VALUES (?, ?, ?)',
      );
      for (const acc of data.bank_accounts) {
        insertBankAccount.run(acc.id, acc.name, acc.balance);
      }

      const insertMonth = db.prepare(
        'INSERT INTO months (id, label, year, month) VALUES (?, ?, ?, ?)',
      );
      for (const m of data.months) {
        insertMonth.run(m.id, m.label, m.year, m.month);
      }

      const insertExpense = db.prepare(
        `INSERT INTO expenses (id, month_id, name, due_date, amount, is_paid, paid_at, receipt, notes, bank_account_id, category_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const e of data.expenses) {
        insertExpense.run(
          e.id,
          e.month_id,
          e.name,
          e.due_date,
          e.amount,
          e.is_paid,
          e.paid_at,
          e.receipt,
          e.notes,
          e.bank_account_id ?? null,
          e.category_id ?? null,
        );
      }

      const insertIncome = db.prepare(
        `INSERT INTO incomes (id, month_id, name, expected_date, amount, is_received, received_at, notes, bank_account_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const i of data.incomes) {
        insertIncome.run(
          i.id,
          i.month_id,
          i.name,
          i.expected_date,
          i.amount,
          i.is_received,
          i.received_at,
          i.notes,
          i.bank_account_id ?? null,
        );
      }
    });

    run();
  } finally {
    db.pragma('foreign_keys = ON');
  }
}
