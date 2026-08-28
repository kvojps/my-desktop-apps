import type Database from 'better-sqlite3';
import type { ReceiptPayload } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import { makeRepositories } from '../infra/database';
import { getUploadsDir } from '../infra/database/connection';
import { backupArchive } from '../infra/gateways/backupArchive';
import { makeReceiptsGateway } from '../infra/gateways/receipts';
import { dialogs } from '../infra/gateways/system/dialogs';
import { shellGateway } from '../infra/gateways/system/shell';
import { themeMode } from '../infra/gateways/system/themeMode';
import { makeBankAccountsService } from '../services/bankAccountsService';
import { makeBackupService } from '../services/backupService';
import { makeCategoriesService } from '../services/categoriesService';
import { makeDefaultExpensesService } from '../services/defaultExpensesService';
import { makeDefaultIncomesService } from '../services/defaultIncomesService';
import { makeExpensesService } from '../services/expensesService';
import { makeIncomesService } from '../services/incomesService';
import { makeMonthsService } from '../services/monthsService';
import { makeReportsService } from '../services/reportsService';
import { makeSettingsService } from '../services/settingsService';
import { makeSetupService } from '../services/setupService';
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
import { createExpenseSchema, payExpenseSchema, updateExpenseSchema } from './schemas/expenses.schema';
import { createIncomeSchema, receiveIncomeSchema, updateIncomeSchema } from './schemas/incomes.schema';
import { createMonthSchema, createMonthsBatchSchema } from './schemas/months.schema';
import { setupSchema } from './schemas/setup.schema';
import { themeModeSchema } from './schemas/theme.schema';

/**
 * Monta as camadas e registra os canais. Enquanto o ticket 06 (controllers) não
 * chega, `registerIpc.ts` ainda faz as vezes de controller: validação inline com
 * zod e saída como entidade (são iguais em runtime ao tipo de `@shared`). O que
 * mudou no ticket 05 é que os handlers falam com **services**, não com `repos`, e
 * o `null` de "não encontrado" vira `AppError(404)` dentro do service — não mais
 * aqui.
 *
 * **Retorna a composição** (`{ months }` no mínimo): carve-out do ADR-0002 (spec
 * desta pasta, decisão 5). O `index.ts` precisa chamar
 * `services.months.ensureCurrentMonth()` no boot e no `browser-window-focus`, e
 * agora isso acontece *depois* de registrar os canais. Ver comentário no `index.ts`.
 */
export function registerIpcHandlers(db: Database.Database) {
  const uploadsDir = getUploadsDir();
  const repos = makeRepositories(db);
  const receipts = makeReceiptsGateway(uploadsDir);

  const bankAccountsService = makeBankAccountsService(repos);
  const monthsService = makeMonthsService(repos);
  const expensesService = makeExpensesService(repos, bankAccountsService, receipts);
  const incomesService = makeIncomesService(repos, bankAccountsService);
  const defaultExpensesService = makeDefaultExpensesService(repos);
  const defaultIncomesService = makeDefaultIncomesService(repos);
  const categoriesService = makeCategoriesService(repos);
  const reportsService = makeReportsService(repos);
  const setupService = makeSetupService(repos);
  const settingsService = makeSettingsService(repos, themeMode);
  // Ordem topológica: `backupService` recebe o `monthsService` já pronto.
  const backupService = makeBackupService(
    repos,
    monthsService,
    backupArchive,
    dialogs,
    shellGateway,
    uploadsDir,
  );

  registerBackupHandlers(backupService);

  handle(IPC_CHANNELS.setupRun, (_e, initialMonth: number, initialYear: number) => {
    const body = parseOrThrow(setupSchema, { initialMonth, initialYear });
    return { months: setupService.run(body.initialYear, body.initialMonth) };
  });

  handle(IPC_CHANNELS.monthsList, () => monthsService.list());
  handle(IPC_CHANNELS.monthsGet, (_e, id: number) => monthsService.getDetail(parseId(id)));
  handle(IPC_CHANNELS.monthsCreate, (_e, year?: number, month?: number) => {
    const body = parseOrThrow(createMonthSchema, { year, month });
    return body.year && body.month
      ? monthsService.create(body.year, body.month)
      : monthsService.createNext();
  });
  handle(
    IPC_CHANNELS.monthsCreateBatch,
    (_e, fromYear: number, fromMonth: number, toYear: number, toMonth: number) => {
      const body = parseOrThrow(createMonthsBatchSchema, { fromYear, fromMonth, toYear, toMonth });
      return monthsService.createBatch(body.fromYear, body.fromMonth, body.toYear, body.toMonth);
    },
  );
  handle(IPC_CHANNELS.monthsDelete, (_e, id: number) => {
    monthsService.delete(parseId(id));
    return { message: 'Month deleted' };
  });

  handle(IPC_CHANNELS.defaultExpensesList, () => defaultExpensesService.list());
  handle(IPC_CHANNELS.defaultExpensesCreate, (_e, data: unknown) =>
    defaultExpensesService.create(parseOrThrow(createDefaultExpenseSchema, data)),
  );
  handle(IPC_CHANNELS.defaultExpensesUpdate, (_e, id: number, data: unknown) =>
    defaultExpensesService.update(parseId(id), parseOrThrow(updateDefaultExpenseSchema, data)),
  );
  handle(IPC_CHANNELS.defaultExpensesDelete, (_e, id: number) => {
    defaultExpensesService.delete(parseId(id));
    return { message: 'Default expense deleted' };
  });

  handle(IPC_CHANNELS.defaultIncomesList, () => defaultIncomesService.list());
  handle(IPC_CHANNELS.defaultIncomesCreate, (_e, data: unknown) =>
    defaultIncomesService.create(parseOrThrow(createDefaultIncomeSchema, data)),
  );
  handle(IPC_CHANNELS.defaultIncomesUpdate, (_e, id: number, data: unknown) =>
    defaultIncomesService.update(parseId(id), parseOrThrow(updateDefaultIncomeSchema, data)),
  );
  handle(IPC_CHANNELS.defaultIncomesDelete, (_e, id: number) => {
    defaultIncomesService.delete(parseId(id));
    return { message: 'Default income deleted' };
  });

  handle(IPC_CHANNELS.bankAccountsList, () => bankAccountsService.list());
  handle(IPC_CHANNELS.bankAccountsCreate, (_e, data: unknown) =>
    bankAccountsService.create(parseOrThrow(createBankAccountSchema, data)),
  );
  handle(IPC_CHANNELS.bankAccountsUpdate, (_e, id: number, data: unknown) =>
    bankAccountsService.update(parseId(id), parseOrThrow(updateBankAccountSchema, data)),
  );
  handle(IPC_CHANNELS.bankAccountsDelete, (_e, id: number) => {
    bankAccountsService.delete(parseId(id));
    return { message: 'Bank account deleted' };
  });

  handle(IPC_CHANNELS.categoriesList, () => categoriesService.list());
  handle(IPC_CHANNELS.categoriesCreate, (_e, data: unknown) =>
    categoriesService.create(parseOrThrow(createCategorySchema, data)),
  );
  handle(IPC_CHANNELS.categoriesUpdate, (_e, id: number, data: unknown) =>
    categoriesService.update(parseId(id), parseOrThrow(updateCategorySchema, data)),
  );
  handle(IPC_CHANNELS.categoriesDelete, (_e, id: number) => {
    categoriesService.delete(parseId(id));
    return { message: 'Category deleted' };
  });

  handle(IPC_CHANNELS.expensesListForMonth, (_e, monthId: number) =>
    expensesService.listForMonth(parseId(monthId)),
  );
  handle(IPC_CHANNELS.expensesCreate, (_e, monthId: number, data: unknown) =>
    expensesService.create(parseId(monthId), parseOrThrow(createExpenseSchema, data)),
  );
  handle(IPC_CHANNELS.expensesUpdate, (_e, id: number, data: unknown) =>
    expensesService.update(parseId(id), parseOrThrow(updateExpenseSchema, data)),
  );
  handle(IPC_CHANNELS.expensesDelete, (_e, id: number) => {
    expensesService.delete(parseId(id));
    return { message: 'Expense deleted' };
  });
  handle(
    IPC_CHANNELS.expensesPay,
    (
      _e,
      id: number,
      payload: { receipt?: ReceiptPayload; notes?: string; paidAt?: string; bankAccountId?: number },
    ) => {
      const body = parseOrThrow(payExpenseSchema, {
        notes: payload?.notes,
        paidAt: payload?.paidAt,
        bankAccountId: payload?.bankAccountId,
      });
      return expensesService.pay(parseId(id), {
        paidAt: body.paidAt,
        bankAccountId: body.bankAccountId,
        notes: body.notes,
        receipt: payload?.receipt,
      });
    },
  );
  handle(IPC_CHANNELS.expensesUnpay, (_e, id: number) => expensesService.unpay(parseId(id)));

  handle(IPC_CHANNELS.incomesListForMonth, (_e, monthId: number) =>
    incomesService.listForMonth(parseId(monthId)),
  );
  handle(IPC_CHANNELS.incomesCreate, (_e, monthId: number, data: unknown) =>
    incomesService.create(parseId(monthId), parseOrThrow(createIncomeSchema, data)),
  );
  handle(IPC_CHANNELS.incomesUpdate, (_e, id: number, data: unknown) =>
    incomesService.update(parseId(id), parseOrThrow(updateIncomeSchema, data)),
  );
  handle(IPC_CHANNELS.incomesDelete, (_e, id: number) => {
    incomesService.delete(parseId(id));
    return { message: 'Income deleted' };
  });
  handle(
    IPC_CHANNELS.incomesReceive,
    (_e, id: number, notes?: string, receivedAt?: string, bankAccountId?: number) => {
      const body = parseOrThrow(receiveIncomeSchema, { notes, receivedAt, bankAccountId });
      return incomesService.receive(parseId(id), {
        notes: body.notes ?? undefined,
        receivedAt: body.receivedAt,
        bankAccountId: body.bankAccountId,
      });
    },
  );
  handle(IPC_CHANNELS.incomesUnreceive, (_e, id: number) => incomesService.unreceive(parseId(id)));

  handle(IPC_CHANNELS.reportsCategoryTotalsForYear, (_e, year: number) =>
    reportsService.categoryTotalsForYear(parseId(year)),
  );

  handle(IPC_CHANNELS.receiptsOpen, (_e, filename: string) =>
    expensesService.openReceipt(filename),
  );

  handle(IPC_CHANNELS.themeGet, () => settingsService.getThemeMode());
  handle(IPC_CHANNELS.themeSet, (_e, mode: unknown) =>
    settingsService.setThemeMode(parseOrThrow(themeModeSchema, mode)),
  );

  return { months: monthsService };
}
