import type Database from 'better-sqlite3';
import type { ReceiptPayload } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import * as bankAccountsRepository from '../db/bankAccountsRepository';
import * as categoriesRepository from '../db/categoriesRepository';
import { getUploadsDir } from '../db/connection';
import * as defaultExpensesRepository from '../db/defaultExpensesRepository';
import * as defaultIncomesRepository from '../db/defaultIncomesRepository';
import * as expensesRepository from '../db/expensesRepository';
import * as incomesRepository from '../db/incomesRepository';
import * as monthsRepository from '../db/monthsRepository';
import { runSetup } from '../db/setupRepository';
import { openReceiptFile, saveReceiptFile } from '../files/receiptsStorage';
import { createBankAccountSchema, updateBankAccountSchema } from '../schemas/bankAccounts.schema';
import { createCategorySchema, updateCategorySchema } from '../schemas/categories.schema';
import {
  createDefaultExpenseSchema,
  updateDefaultExpenseSchema,
} from '../schemas/defaultExpenses.schema';
import {
  createDefaultIncomeSchema,
  updateDefaultIncomeSchema,
} from '../schemas/defaultIncomes.schema';
import {
  createExpenseSchema,
  payExpenseSchema,
  updateExpenseSchema,
} from '../schemas/expenses.schema';
import {
  createIncomeSchema,
  receiveIncomeSchema,
  updateIncomeSchema,
} from '../schemas/incomes.schema';
import { createMonthSchema, createMonthsBatchSchema } from '../schemas/months.schema';
import { setupSchema } from '../schemas/setup.schema';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { registerBackupHandlers } from './backupHandlers';
import { handle } from './handle';

export function registerIpcHandlers(db: Database.Database): void {
  const uploadsDir = getUploadsDir();

  registerBackupHandlers(db, uploadsDir);

  handle(IPC_CHANNELS.setupRun, (_e, initialMonth: number, initialYear: number) => {
    const body = parseOrThrow(setupSchema, { initialMonth, initialYear });
    return { months: runSetup(db, body.initialYear, body.initialMonth) };
  });

  handle(IPC_CHANNELS.monthsList, () => monthsRepository.listMonths(db));
  handle(IPC_CHANNELS.monthsGet, (_e, id: number) =>
    monthsRepository.getMonthWithExpenses(db, parseId(id)),
  );
  handle(IPC_CHANNELS.monthsCreate, (_e, year?: number, month?: number) => {
    const body = parseOrThrow(createMonthSchema, { year, month });
    return monthsRepository.createNextMonth(db, body.year, body.month);
  });
  handle(
    IPC_CHANNELS.monthsCreateBatch,
    (_e, fromYear: number, fromMonth: number, toYear: number, toMonth: number) => {
      const body = parseOrThrow(createMonthsBatchSchema, {
        fromYear,
        fromMonth,
        toYear,
        toMonth,
      });
      return monthsRepository.createMonthsBatch(
        db,
        body.fromYear,
        body.fromMonth,
        body.toYear,
        body.toMonth,
      );
    },
  );
  handle(IPC_CHANNELS.monthsDelete, (_e, id: number) => {
    monthsRepository.deleteMonth(db, parseId(id));
    return { message: 'Month deleted' };
  });

  handle(IPC_CHANNELS.defaultExpensesList, () => defaultExpensesRepository.listDefaultExpenses(db));
  handle(IPC_CHANNELS.defaultExpensesCreate, (_e, data: unknown) => {
    const body = parseOrThrow(createDefaultExpenseSchema, data);
    return defaultExpensesRepository.createDefaultExpense(db, body);
  });
  handle(IPC_CHANNELS.defaultExpensesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateDefaultExpenseSchema, data);
    return defaultExpensesRepository.updateDefaultExpense(db, parseId(id), body);
  });
  handle(IPC_CHANNELS.defaultExpensesDelete, (_e, id: number) => {
    defaultExpensesRepository.deleteDefaultExpense(db, parseId(id));
    return { message: 'Default expense deleted' };
  });

  handle(IPC_CHANNELS.defaultIncomesList, () => defaultIncomesRepository.listDefaultIncomes(db));
  handle(IPC_CHANNELS.defaultIncomesCreate, (_e, data: unknown) => {
    const body = parseOrThrow(createDefaultIncomeSchema, data);
    return defaultIncomesRepository.createDefaultIncome(db, body);
  });
  handle(IPC_CHANNELS.defaultIncomesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateDefaultIncomeSchema, data);
    return defaultIncomesRepository.updateDefaultIncome(db, parseId(id), body);
  });
  handle(IPC_CHANNELS.defaultIncomesDelete, (_e, id: number) => {
    defaultIncomesRepository.deleteDefaultIncome(db, parseId(id));
    return { message: 'Default income deleted' };
  });

  handle(IPC_CHANNELS.bankAccountsList, () => bankAccountsRepository.listBankAccounts(db));
  handle(IPC_CHANNELS.bankAccountsCreate, (_e, data: unknown) => {
    const body = parseOrThrow(createBankAccountSchema, data);
    return bankAccountsRepository.createBankAccount(db, body);
  });
  handle(IPC_CHANNELS.bankAccountsUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateBankAccountSchema, data);
    return bankAccountsRepository.updateBankAccount(db, parseId(id), body);
  });
  handle(IPC_CHANNELS.bankAccountsDelete, (_e, id: number) => {
    bankAccountsRepository.deleteBankAccount(db, parseId(id));
    return { message: 'Bank account deleted' };
  });

  handle(IPC_CHANNELS.categoriesList, () => categoriesRepository.listCategories(db));
  handle(IPC_CHANNELS.categoriesCreate, (_e, data: unknown) => {
    const body = parseOrThrow(createCategorySchema, data);
    return categoriesRepository.createCategory(db, body);
  });
  handle(IPC_CHANNELS.categoriesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateCategorySchema, data);
    return categoriesRepository.updateCategory(db, parseId(id), body);
  });
  handle(IPC_CHANNELS.categoriesDelete, (_e, id: number) => {
    categoriesRepository.deleteCategory(db, parseId(id));
    return { message: 'Category deleted' };
  });

  handle(IPC_CHANNELS.expensesListForMonth, (_e, monthId: number) =>
    expensesRepository.listExpensesForMonth(db, parseId(monthId)),
  );
  handle(IPC_CHANNELS.expensesCreate, (_e, monthId: number, data: unknown) => {
    const body = parseOrThrow(createExpenseSchema, data);
    return expensesRepository.createExpense(db, parseId(monthId), body);
  });
  handle(IPC_CHANNELS.expensesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateExpenseSchema, data);
    return expensesRepository.updateExpense(db, parseId(id), body);
  });
  handle(IPC_CHANNELS.expensesDelete, (_e, id: number) => {
    expensesRepository.deleteExpense(db, uploadsDir, parseId(id));
    return { message: 'Expense deleted' };
  });
  handle(
    IPC_CHANNELS.expensesPay,
    (
      _e,
      id: number,
      payload: {
        receipt?: ReceiptPayload;
        notes?: string;
        paid_at?: string;
        bank_account_id?: number;
      },
    ) => {
      const expenseId = parseId(id);
      const body = parseOrThrow(payExpenseSchema, {
        notes: payload?.notes,
        paid_at: payload?.paid_at,
        bank_account_id: payload?.bank_account_id,
      });

      let receiptFilename: string | undefined;
      if (payload?.receipt) {
        const expense = expensesRepository.getExpenseForFilename(db, expenseId);
        receiptFilename = saveReceiptFile(
          uploadsDir,
          expense?.month_label ?? 'unknown',
          expense?.name ?? 'unknown',
          expenseId,
          payload.receipt.originalName,
          payload.receipt.mimeType,
          Buffer.from(payload.receipt.buffer),
        );
      }

      return expensesRepository.payExpense(
        db,
        expenseId,
        receiptFilename,
        body.notes,
        body.paid_at,
        body.bank_account_id,
      );
    },
  );
  handle(IPC_CHANNELS.expensesUnpay, (_e, id: number) =>
    expensesRepository.unpayExpense(db, uploadsDir, parseId(id)),
  );

  handle(IPC_CHANNELS.incomesListForMonth, (_e, monthId: number) =>
    incomesRepository.listIncomesForMonth(db, parseId(monthId)),
  );
  handle(IPC_CHANNELS.incomesCreate, (_e, monthId: number, data: unknown) => {
    const body = parseOrThrow(createIncomeSchema, data);
    return incomesRepository.createIncome(db, parseId(monthId), body);
  });
  handle(IPC_CHANNELS.incomesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateIncomeSchema, data);
    return incomesRepository.updateIncome(db, parseId(id), body);
  });
  handle(IPC_CHANNELS.incomesDelete, (_e, id: number) => {
    incomesRepository.deleteIncome(db, parseId(id));
    return { message: 'Income deleted' };
  });
  handle(
    IPC_CHANNELS.incomesReceive,
    (_e, id: number, notes?: string, receivedAt?: string, bankAccountId?: number) => {
      const body = parseOrThrow(receiveIncomeSchema, {
        notes,
        received_at: receivedAt,
        bank_account_id: bankAccountId,
      });
      return incomesRepository.receiveIncome(
        db,
        parseId(id),
        body.notes ?? undefined,
        body.received_at,
        body.bank_account_id,
      );
    },
  );
  handle(IPC_CHANNELS.incomesUnreceive, (_e, id: number) =>
    incomesRepository.unreceiveIncome(db, parseId(id)),
  );

  handle(IPC_CHANNELS.reportsCategoryTotalsForYear, (_e, year: number) =>
    categoriesRepository.getCategoryTotalsForYear(db, parseId(year)),
  );

  handle(IPC_CHANNELS.receiptsOpen, (_e, filename: string) =>
    openReceiptFile(uploadsDir, filename),
  );
}
