import type Database from 'better-sqlite3';
import type { ReceiptPayload } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import { setAppSetting } from '../db/appSettingsRepository';
import {
  createBankAccount,
  deleteBankAccount,
  listBankAccounts,
  updateBankAccount,
} from '../db/bankAccountsRepository';
import {
  createCategory,
  deleteCategory,
  getCategoryTotalsForYear,
  listCategories,
  updateCategory,
} from '../db/categoriesRepository';
import { getUploadsDir } from '../db/connection';
import {
  createDefaultExpense,
  deleteDefaultExpense,
  listDefaultExpenses,
  updateDefaultExpense,
} from '../db/defaultExpensesRepository';
import {
  createDefaultIncome,
  deleteDefaultIncome,
  listDefaultIncomes,
  updateDefaultIncome,
} from '../db/defaultIncomesRepository';
import {
  createExpense,
  deleteExpense,
  getExpenseForFilename,
  listExpensesForMonth,
  payExpense,
  unpayExpense,
  updateExpense,
} from '../db/expensesRepository';
import {
  createIncome,
  deleteIncome,
  listIncomesForMonth,
  receiveIncome,
  unreceiveIncome,
  updateIncome,
} from '../db/incomesRepository';
import {
  createMonthsBatch,
  createNextMonth,
  deleteMonth,
  getMonthWithExpenses,
  listMonths,
} from '../db/monthsRepository';
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
import { themeModeSchema } from '../schemas/theme.schema';
import { THEME_MODE_KEY, applyThemeMode, getThemeMode } from '../theme/themeMode';
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

  handle(IPC_CHANNELS.monthsList, () => listMonths(db));
  handle(IPC_CHANNELS.monthsGet, (_e, id: number) => getMonthWithExpenses(db, parseId(id)));
  handle(IPC_CHANNELS.monthsCreate, (_e, year?: number, month?: number) => {
    const body = parseOrThrow(createMonthSchema, { year, month });
    return createNextMonth(db, body.year, body.month);
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
      return createMonthsBatch(db, body.fromYear, body.fromMonth, body.toYear, body.toMonth);
    },
  );
  handle(IPC_CHANNELS.monthsDelete, (_e, id: number) => {
    deleteMonth(db, parseId(id));
    return { message: 'Month deleted' };
  });

  handle(IPC_CHANNELS.defaultExpensesList, () => listDefaultExpenses(db));
  handle(IPC_CHANNELS.defaultExpensesCreate, (_e, data: unknown) => {
    const body = parseOrThrow(createDefaultExpenseSchema, data);
    return createDefaultExpense(db, body);
  });
  handle(IPC_CHANNELS.defaultExpensesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateDefaultExpenseSchema, data);
    return updateDefaultExpense(db, parseId(id), body);
  });
  handle(IPC_CHANNELS.defaultExpensesDelete, (_e, id: number) => {
    deleteDefaultExpense(db, parseId(id));
    return { message: 'Default expense deleted' };
  });

  handle(IPC_CHANNELS.defaultIncomesList, () => listDefaultIncomes(db));
  handle(IPC_CHANNELS.defaultIncomesCreate, (_e, data: unknown) => {
    const body = parseOrThrow(createDefaultIncomeSchema, data);
    return createDefaultIncome(db, body);
  });
  handle(IPC_CHANNELS.defaultIncomesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateDefaultIncomeSchema, data);
    return updateDefaultIncome(db, parseId(id), body);
  });
  handle(IPC_CHANNELS.defaultIncomesDelete, (_e, id: number) => {
    deleteDefaultIncome(db, parseId(id));
    return { message: 'Default income deleted' };
  });

  handle(IPC_CHANNELS.bankAccountsList, () => listBankAccounts(db));
  handle(IPC_CHANNELS.bankAccountsCreate, (_e, data: unknown) => {
    const body = parseOrThrow(createBankAccountSchema, data);
    return createBankAccount(db, body);
  });
  handle(IPC_CHANNELS.bankAccountsUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateBankAccountSchema, data);
    return updateBankAccount(db, parseId(id), body);
  });
  handle(IPC_CHANNELS.bankAccountsDelete, (_e, id: number) => {
    deleteBankAccount(db, parseId(id));
    return { message: 'Bank account deleted' };
  });

  handle(IPC_CHANNELS.categoriesList, () => listCategories(db));
  handle(IPC_CHANNELS.categoriesCreate, (_e, data: unknown) => {
    const body = parseOrThrow(createCategorySchema, data);
    return createCategory(db, body);
  });
  handle(IPC_CHANNELS.categoriesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateCategorySchema, data);
    return updateCategory(db, parseId(id), body);
  });
  handle(IPC_CHANNELS.categoriesDelete, (_e, id: number) => {
    deleteCategory(db, parseId(id));
    return { message: 'Category deleted' };
  });

  handle(IPC_CHANNELS.expensesListForMonth, (_e, monthId: number) =>
    listExpensesForMonth(db, parseId(monthId)),
  );
  handle(IPC_CHANNELS.expensesCreate, (_e, monthId: number, data: unknown) => {
    const body = parseOrThrow(createExpenseSchema, data);
    return createExpense(db, parseId(monthId), body);
  });
  handle(IPC_CHANNELS.expensesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateExpenseSchema, data);
    return updateExpense(db, parseId(id), body);
  });
  handle(IPC_CHANNELS.expensesDelete, (_e, id: number) => {
    deleteExpense(db, uploadsDir, parseId(id));
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
        paidAt?: string;
        bankAccountId?: number;
      },
    ) => {
      const expenseId = parseId(id);
      const body = parseOrThrow(payExpenseSchema, {
        notes: payload?.notes,
        paidAt: payload?.paidAt,
        bankAccountId: payload?.bankAccountId,
      });

      let receiptFilename: string | undefined;
      if (payload?.receipt) {
        const expense = getExpenseForFilename(db, expenseId);
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

      return payExpense(
        db,
        expenseId,
        receiptFilename,
        body.notes,
        body.paidAt,
        body.bankAccountId,
      );
    },
  );
  handle(IPC_CHANNELS.expensesUnpay, (_e, id: number) => unpayExpense(db, uploadsDir, parseId(id)));

  handle(IPC_CHANNELS.incomesListForMonth, (_e, monthId: number) =>
    listIncomesForMonth(db, parseId(monthId)),
  );
  handle(IPC_CHANNELS.incomesCreate, (_e, monthId: number, data: unknown) => {
    const body = parseOrThrow(createIncomeSchema, data);
    return createIncome(db, parseId(monthId), body);
  });
  handle(IPC_CHANNELS.incomesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateIncomeSchema, data);
    return updateIncome(db, parseId(id), body);
  });
  handle(IPC_CHANNELS.incomesDelete, (_e, id: number) => {
    deleteIncome(db, parseId(id));
    return { message: 'Income deleted' };
  });
  handle(
    IPC_CHANNELS.incomesReceive,
    (_e, id: number, notes?: string, receivedAt?: string, bankAccountId?: number) => {
      const body = parseOrThrow(receiveIncomeSchema, {
        notes,
        receivedAt: receivedAt,
        bankAccountId: bankAccountId,
      });
      return receiveIncome(
        db,
        parseId(id),
        body.notes ?? undefined,
        body.receivedAt,
        body.bankAccountId,
      );
    },
  );
  handle(IPC_CHANNELS.incomesUnreceive, (_e, id: number) => unreceiveIncome(db, parseId(id)));

  handle(IPC_CHANNELS.reportsCategoryTotalsForYear, (_e, year: number) =>
    getCategoryTotalsForYear(db, parseId(year)),
  );

  handle(IPC_CHANNELS.receiptsOpen, (_e, filename: string) =>
    openReceiptFile(uploadsDir, filename),
  );

  handle(IPC_CHANNELS.themeGet, () => getThemeMode());
  handle(IPC_CHANNELS.themeSet, (_e, mode: unknown) => {
    const value = parseOrThrow(themeModeSchema, mode);
    setAppSetting(db, THEME_MODE_KEY, value);
    applyThemeMode(value);
    return value;
  });
}
