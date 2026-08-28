import type Database from 'better-sqlite3';
import type { ReceiptPayload } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import { getUploadsDir } from '../infra/database/connection';
import { makeRepositories } from '../infra/database';
import { runSetup } from '../infra/database/repositories/setupRepository';
import { openReceiptFile, saveReceiptFile } from '../infra/gateways/receipts';
import { THEME_MODE_KEY, applyThemeMode, getThemeMode } from '../infra/gateways/system/themeMode';
import { AppError } from '../utils/errors/AppError';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { registerBackupHandlers } from './backupHandlers';
import { handle } from './handle';
import { createBankAccountSchema, updateBankAccountSchema } from './schemas/bankAccounts.schema';
import { createCategorySchema, updateCategorySchema } from './schemas/categories.schema';
import {
  createDefaultExpenseSchema,
  updateDefaultExpenseSchema,
} from './schemas/defaultExpenses.schema';
import {
  createDefaultIncomeSchema,
  updateDefaultIncomeSchema,
} from './schemas/defaultIncomes.schema';
import {
  createExpenseSchema,
  payExpenseSchema,
  updateExpenseSchema,
} from './schemas/expenses.schema';
import {
  createIncomeSchema,
  receiveIncomeSchema,
  updateIncomeSchema,
} from './schemas/incomes.schema';
import { createMonthSchema, createMonthsBatchSchema } from './schemas/months.schema';
import { setupSchema } from './schemas/setup.schema';
import { themeModeSchema } from './schemas/theme.schema';

/**
 * `registerIpc.ts` ainda faz as vezes de controller: validação inline e saída
 * como entidade. Enquanto o service não existe (ticket 05), é aqui que o `null`
 * de "não encontrado" devolvido pelos repositórios volta a virar `AppError(404)`,
 * preservando o comportamento observável de antes da unidade de trabalho.
 */
export function registerIpcHandlers(db: Database.Database): void {
  const uploadsDir = getUploadsDir();
  const repos = makeRepositories(db);

  registerBackupHandlers(db, repos, uploadsDir);

  handle(IPC_CHANNELS.setupRun, (_e, initialMonth: number, initialYear: number) => {
    const body = parseOrThrow(setupSchema, { initialMonth, initialYear });
    return { months: runSetup(db, body.initialYear, body.initialMonth) };
  });

  handle(IPC_CHANNELS.monthsList, () => repos.months.list());
  handle(IPC_CHANNELS.monthsGet, (_e, id: number) => {
    const month = repos.months.findById(parseId(id));
    if (!month) throw new AppError(404, 'Mês não encontrado');
    return month;
  });
  handle(IPC_CHANNELS.monthsCreate, (_e, year?: number, month?: number) => {
    const body = parseOrThrow(createMonthSchema, { year, month });
    return repos.months.createNext(body.year, body.month);
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
      return repos.months.createBatch(body.fromYear, body.fromMonth, body.toYear, body.toMonth);
    },
  );
  handle(IPC_CHANNELS.monthsDelete, (_e, id: number) => {
    if (!repos.months.delete(parseId(id))) throw new AppError(404, 'Mês não encontrado');
    return { message: 'Month deleted' };
  });

  handle(IPC_CHANNELS.defaultExpensesList, () => repos.defaultExpenses.list());
  handle(IPC_CHANNELS.defaultExpensesCreate, (_e, data: unknown) => {
    const body = parseOrThrow(createDefaultExpenseSchema, data);
    return repos.defaultExpenses.create(body);
  });
  handle(IPC_CHANNELS.defaultExpensesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateDefaultExpenseSchema, data);
    const updated = repos.defaultExpenses.update(parseId(id), body);
    if (!updated) throw new AppError(404, 'Despesa padrão não encontrada');
    return updated;
  });
  handle(IPC_CHANNELS.defaultExpensesDelete, (_e, id: number) => {
    if (!repos.defaultExpenses.delete(parseId(id))) {
      throw new AppError(404, 'Despesa padrão não encontrada');
    }
    return { message: 'Default expense deleted' };
  });

  handle(IPC_CHANNELS.defaultIncomesList, () => repos.defaultIncomes.list());
  handle(IPC_CHANNELS.defaultIncomesCreate, (_e, data: unknown) => {
    const body = parseOrThrow(createDefaultIncomeSchema, data);
    return repos.defaultIncomes.create(body);
  });
  handle(IPC_CHANNELS.defaultIncomesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateDefaultIncomeSchema, data);
    const updated = repos.defaultIncomes.update(parseId(id), body);
    if (!updated) throw new AppError(404, 'Entrada padrão não encontrada');
    return updated;
  });
  handle(IPC_CHANNELS.defaultIncomesDelete, (_e, id: number) => {
    if (!repos.defaultIncomes.delete(parseId(id))) {
      throw new AppError(404, 'Entrada padrão não encontrada');
    }
    return { message: 'Default income deleted' };
  });

  handle(IPC_CHANNELS.bankAccountsList, () => repos.bankAccounts.list());
  handle(IPC_CHANNELS.bankAccountsCreate, (_e, data: unknown) => {
    const body = parseOrThrow(createBankAccountSchema, data);
    return repos.bankAccounts.create(body);
  });
  handle(IPC_CHANNELS.bankAccountsUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateBankAccountSchema, data);
    const updated = repos.bankAccounts.update(parseId(id), body);
    if (!updated) throw new AppError(404, 'Conta bancária não encontrada');
    return updated;
  });
  handle(IPC_CHANNELS.bankAccountsDelete, (_e, id: number) => {
    if (!repos.bankAccounts.delete(parseId(id))) {
      throw new AppError(404, 'Conta bancária não encontrada');
    }
    return { message: 'Bank account deleted' };
  });

  handle(IPC_CHANNELS.categoriesList, () => repos.categories.list());
  handle(IPC_CHANNELS.categoriesCreate, (_e, data: unknown) => {
    const body = parseOrThrow(createCategorySchema, data);
    return repos.categories.create(body);
  });
  handle(IPC_CHANNELS.categoriesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateCategorySchema, data);
    const updated = repos.categories.update(parseId(id), body);
    if (!updated) throw new AppError(404, 'Categoria não encontrada');
    return updated;
  });
  handle(IPC_CHANNELS.categoriesDelete, (_e, id: number) => {
    if (!repos.categories.delete(parseId(id))) throw new AppError(404, 'Categoria não encontrada');
    return { message: 'Category deleted' };
  });

  handle(IPC_CHANNELS.expensesListForMonth, (_e, monthId: number) =>
    repos.expenses.listForMonth(parseId(monthId)),
  );
  handle(IPC_CHANNELS.expensesCreate, (_e, monthId: number, data: unknown) => {
    const body = parseOrThrow(createExpenseSchema, data);
    return repos.expenses.create(parseId(monthId), body);
  });
  handle(IPC_CHANNELS.expensesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateExpenseSchema, data);
    const updated = repos.expenses.update(parseId(id), body);
    if (!updated) throw new AppError(404, 'Despesa não encontrada');
    return updated;
  });
  handle(IPC_CHANNELS.expensesDelete, (_e, id: number) => {
    if (!repos.expenses.delete(uploadsDir, parseId(id))) {
      throw new AppError(404, 'Despesa não encontrada');
    }
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
        const expense = repos.expenses.getForFilename(expenseId);
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

      const paid = repos.expenses.pay(
        expenseId,
        receiptFilename,
        body.notes,
        body.paidAt,
        body.bankAccountId,
      );
      if (!paid) throw new AppError(404, 'Despesa não encontrada');
      return paid;
    },
  );
  handle(IPC_CHANNELS.expensesUnpay, (_e, id: number) => {
    const unpaid = repos.expenses.unpay(uploadsDir, parseId(id));
    if (!unpaid) throw new AppError(404, 'Despesa não encontrada');
    return unpaid;
  });

  handle(IPC_CHANNELS.incomesListForMonth, (_e, monthId: number) =>
    repos.incomes.listForMonth(parseId(monthId)),
  );
  handle(IPC_CHANNELS.incomesCreate, (_e, monthId: number, data: unknown) => {
    const body = parseOrThrow(createIncomeSchema, data);
    return repos.incomes.create(parseId(monthId), body);
  });
  handle(IPC_CHANNELS.incomesUpdate, (_e, id: number, data: unknown) => {
    const body = parseOrThrow(updateIncomeSchema, data);
    const updated = repos.incomes.update(parseId(id), body);
    if (!updated) throw new AppError(404, 'Entrada não encontrada');
    return updated;
  });
  handle(IPC_CHANNELS.incomesDelete, (_e, id: number) => {
    if (!repos.incomes.delete(parseId(id))) throw new AppError(404, 'Entrada não encontrada');
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
      const received = repos.incomes.receive(
        parseId(id),
        body.notes ?? undefined,
        body.receivedAt,
        body.bankAccountId,
      );
      if (!received) throw new AppError(404, 'Entrada não encontrada');
      return received;
    },
  );
  handle(IPC_CHANNELS.incomesUnreceive, (_e, id: number) => {
    const unreceived = repos.incomes.unreceive(parseId(id));
    if (!unreceived) throw new AppError(404, 'Entrada não encontrada');
    return unreceived;
  });

  handle(IPC_CHANNELS.reportsCategoryTotalsForYear, (_e, year: number) =>
    repos.categories.totalsForYear(parseId(year)),
  );

  handle(IPC_CHANNELS.receiptsOpen, (_e, filename: string) =>
    openReceiptFile(uploadsDir, filename),
  );

  handle(IPC_CHANNELS.themeGet, () => getThemeMode());
  handle(IPC_CHANNELS.themeSet, (_e, mode: unknown) => {
    const value = parseOrThrow(themeModeSchema, mode);
    repos.appSettings.setAppSetting(THEME_MODE_KEY, value);
    applyThemeMode(value);
    return value;
  });
}
