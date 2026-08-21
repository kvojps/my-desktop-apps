import type { ExportResult, ImportResult } from '@shared/ipc/api';
import type { BankAccount } from '@shared/types/bank-account';
import type { Category, CategoryTotal } from '@shared/types/category';
import type { DefaultExpense, Expense } from '@shared/types/expense';
import type { DefaultIncome, Income } from '@shared/types/income';
import type { Month, MonthDetail } from '@shared/types/month';
import type { ThemeMode } from '@shared/types/theme';

function unwrapIpcError(err: unknown): never {
  if (err instanceof Error) {
    const match = err.message.match(
      /Error invoking remote method '[^']+':\s*(?:[A-Za-z]*Error:\s*)?(.*)/s,
    );
    throw new Error(match ? match[1] : err.message);
  }
  throw err;
}

async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    return unwrapIpcError(err);
  }
}

export const api = {
  /**
   * Assina o aviso de mudança de dados e devolve a função de cancelamento.
   * Não passa por `call`: não é `invoke` e não produz erro de IPC.
   */
  onDataChanged(listener: () => void) {
    return window.api.onDataChanged(listener);
  },

  setup(initialMonth: number, initialYear: number) {
    return call(() => window.api.setup.run(initialMonth, initialYear));
  },

  getMonths() {
    return call<Month[]>(() => window.api.months.list());
  },

  deleteMonth(id: number) {
    return call(() => window.api.months.delete(id));
  },

  createMonth(year?: number, month?: number) {
    return call(() => window.api.months.create(year, month));
  },

  createMonthsBatch(fromYear: number, fromMonth: number, toYear: number, toMonth: number) {
    return call(() => window.api.months.createBatch(fromYear, fromMonth, toYear, toMonth));
  },

  getMonth(id: number) {
    return call<MonthDetail>(() => window.api.months.get(id));
  },

  getDefaultExpenses() {
    return call<DefaultExpense[]>(() => window.api.defaultExpenses.list());
  },

  createDefaultExpense(data: {
    name: string;
    dueDay?: number;
    amount: number;
    categoryId?: number | null;
  }) {
    return call(() => window.api.defaultExpenses.create(data));
  },

  updateDefaultExpense(
    id: number,
    data: { name?: string; dueDay?: number; amount?: number; categoryId?: number | null },
  ) {
    return call(() => window.api.defaultExpenses.update(id, data));
  },

  deleteDefaultExpense(id: number) {
    return call(() => window.api.defaultExpenses.delete(id));
  },

  getBankAccounts() {
    return call<BankAccount[]>(() => window.api.bankAccounts.list());
  },

  createBankAccount(data: { name: string; balance?: number }) {
    return call(() => window.api.bankAccounts.create(data));
  },

  updateBankAccount(id: number, data: { name?: string; balance?: number }) {
    return call(() => window.api.bankAccounts.update(id, data));
  },

  deleteBankAccount(id: number) {
    return call(() => window.api.bankAccounts.delete(id));
  },

  getCategories() {
    return call<Category[]>(() => window.api.categories.list());
  },

  createCategory(data: { name: string; color: string }) {
    return call(() => window.api.categories.create(data));
  },

  updateCategory(id: number, data: { name?: string; color?: string }) {
    return call(() => window.api.categories.update(id, data));
  },

  deleteCategory(id: number) {
    return call(() => window.api.categories.delete(id));
  },

  createExpense(
    monthId: number,
    data: { name: string; dueDate?: string; amount: number; categoryId?: number | null },
  ) {
    return call<Expense>(() => window.api.expenses.create(monthId, data));
  },

  updateExpense(
    id: number,
    data: {
      name?: string;
      dueDate?: string;
      amount?: number;
      notes?: string;
      categoryId?: number | null;
    },
  ) {
    return call<Expense>(() => window.api.expenses.update(id, data));
  },

  deleteExpense(id: number) {
    return call(() => window.api.expenses.delete(id));
  },

  async payExpense(
    id: number,
    file?: File,
    notes?: string,
    paidAt?: string,
    bankAccountId?: number,
  ) {
    const receipt = file
      ? { buffer: await file.arrayBuffer(), originalName: file.name, mimeType: file.type }
      : undefined;
    return call<Expense>(() =>
      window.api.expenses.pay(id, {
        receipt,
        notes,
        paidAt,
        bankAccountId,
      }),
    );
  },

  unpayExpense(id: number) {
    return call<Expense>(() => window.api.expenses.unpay(id));
  },

  getDefaultIncomes() {
    return call<DefaultIncome[]>(() => window.api.defaultIncomes.list());
  },

  createDefaultIncome(data: {
    name: string;
    expectedDay?: number;
    amount: number;
    bankAccountId?: number | null;
  }) {
    return call(() => window.api.defaultIncomes.create(data));
  },

  updateDefaultIncome(
    id: number,
    data: {
      name?: string;
      expectedDay?: number;
      amount?: number;
      bankAccountId?: number | null;
    },
  ) {
    return call(() => window.api.defaultIncomes.update(id, data));
  },

  deleteDefaultIncome(id: number) {
    return call(() => window.api.defaultIncomes.delete(id));
  },

  createIncome(
    monthId: number,
    data: { name: string; expectedDate?: string; amount: number; bankAccountId?: number | null },
  ) {
    return call<Income>(() => window.api.incomes.create(monthId, data));
  },

  updateIncome(
    id: number,
    data: {
      name?: string;
      expectedDate?: string;
      amount?: number;
      notes?: string;
      bankAccountId?: number | null;
    },
  ) {
    return call<Income>(() => window.api.incomes.update(id, data));
  },

  deleteIncome(id: number) {
    return call(() => window.api.incomes.delete(id));
  },

  receiveIncome(id: number, notes?: string, receivedAt?: string, bankAccountId?: number) {
    return call<Income>(() => window.api.incomes.receive(id, notes, receivedAt, bankAccountId));
  },

  unreceiveIncome(id: number) {
    return call<Income>(() => window.api.incomes.unreceive(id));
  },

  openReceipt(filename: string) {
    return call(() => window.api.receipts.open(filename));
  },

  getCategoryTotalsForYear(year: number) {
    return call<CategoryTotal[]>(() => window.api.reports.categoryTotalsForYear(year));
  },

  exportData() {
    return call<ExportResult>(() => window.api.data.export());
  },

  importData() {
    return call<ImportResult>(() => window.api.data.import());
  },

  openDataFolder() {
    return call<void>(() => window.api.data.openFolder());
  },

  /**
   * Leitura síncrona, sem `call`: o valor já veio resolvido do main por
   * argumento de linha de comando, não por IPC. É o que permite o primeiro
   * render já sair no tema certo.
   */
  initialThemeMode(): ThemeMode | null {
    return window.api.theme.initialMode;
  },

  getThemeMode() {
    return call<ThemeMode>(() => window.api.theme.get());
  },

  setThemeMode(mode: ThemeMode) {
    return call<ThemeMode>(() => window.api.theme.set(mode));
  },
};
