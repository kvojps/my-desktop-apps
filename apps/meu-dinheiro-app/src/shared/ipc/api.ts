import type { BankAccount } from '@shared/types/bank-account';
import type { Category, CategoryTotal } from '@shared/types/category';
import type { DefaultExpense, Expense } from '@shared/types/expense';
import type { DefaultIncome, Income } from '@shared/types/income';
import type { Month, MonthDetail } from '@shared/types/month';
import type { ThemeMode } from '@shared/types/theme';

export type ExportResult =
  { success: true; filePath: string } | { success: false; error: 'canceled' };

export type ImportResult =
  { success: true } | { success: false; error: 'canceled' | 'invalid-format'; message?: string };

export interface ReceiptPayload {
  buffer: ArrayBuffer;
  originalName: string;
  mimeType: string;
}

export interface SetupApi {
  run: (initialMonth: number, initialYear: number) => Promise<{ months: Month[] }>;
}

export interface MonthsApi {
  list: () => Promise<Month[]>;
  get: (id: number) => Promise<MonthDetail>;
  create: (year?: number, month?: number) => Promise<Month>;
  createBatch: (
    fromYear: number,
    fromMonth: number,
    toYear: number,
    toMonth: number,
  ) => Promise<{ created: Month[]; errors: string[] }>;
  delete: (id: number) => Promise<{ message: string }>;
}

export interface DefaultExpensesApi {
  list: () => Promise<DefaultExpense[]>;
  create: (data: {
    name: string;
    dueDay?: number;
    amount: number;
    categoryId?: number | null;
  }) => Promise<DefaultExpense>;
  update: (
    id: number,
    data: { name?: string; dueDay?: number; amount?: number; categoryId?: number | null },
  ) => Promise<DefaultExpense>;
  delete: (id: number) => Promise<{ message: string }>;
}

export interface CategoriesApi {
  list: () => Promise<Category[]>;
  create: (data: { name: string; color: string }) => Promise<Category>;
  update: (id: number, data: { name?: string; color?: string }) => Promise<Category>;
  delete: (id: number) => Promise<{ message: string }>;
}

export interface DefaultIncomesApi {
  list: () => Promise<DefaultIncome[]>;
  create: (data: {
    name: string;
    expectedDay?: number;
    amount: number;
    bankAccountId?: number | null;
  }) => Promise<DefaultIncome>;
  update: (
    id: number,
    data: {
      name?: string;
      expectedDay?: number;
      amount?: number;
      bankAccountId?: number | null;
    },
  ) => Promise<DefaultIncome>;
  delete: (id: number) => Promise<{ message: string }>;
}

export interface BankAccountsApi {
  list: () => Promise<BankAccount[]>;
  create: (data: { name: string; balance?: number }) => Promise<BankAccount>;
  update: (id: number, data: { name?: string; balance?: number }) => Promise<BankAccount>;
  delete: (id: number) => Promise<{ message: string }>;
}

export interface ExpensesApi {
  listForMonth: (monthId: number) => Promise<Expense[]>;
  create: (
    monthId: number,
    data: { name: string; dueDate?: string; amount: number; categoryId?: number | null },
  ) => Promise<Expense>;
  update: (
    id: number,
    data: {
      name?: string;
      dueDate?: string;
      amount?: number;
      notes?: string;
      categoryId?: number | null;
    },
  ) => Promise<Expense>;
  delete: (id: number) => Promise<{ message: string }>;
  pay: (
    id: number,
    payload: {
      receipt?: ReceiptPayload;
      notes?: string;
      paidAt?: string;
      bankAccountId?: number;
    },
  ) => Promise<Expense>;
  unpay: (id: number) => Promise<Expense>;
}

export interface IncomesApi {
  listForMonth: (monthId: number) => Promise<Income[]>;
  create: (
    monthId: number,
    data: { name: string; expectedDate?: string; amount: number; bankAccountId?: number | null },
  ) => Promise<Income>;
  update: (
    id: number,
    data: {
      name?: string;
      expectedDate?: string;
      amount?: number;
      notes?: string;
      bankAccountId?: number | null;
    },
  ) => Promise<Income>;
  delete: (id: number) => Promise<{ message: string }>;
  receive: (
    id: number,
    notes?: string,
    receivedAt?: string,
    bankAccountId?: number,
  ) => Promise<Income>;
  unreceive: (id: number) => Promise<Income>;
}

export interface ReceiptsApi {
  open: (filename: string) => Promise<void>;
}

export interface ReportsApi {
  categoryTotalsForYear: (year: number) => Promise<CategoryTotal[]>;
}

export interface DataApi {
  export: () => Promise<ExportResult>;
  import: () => Promise<ImportResult>;
  openFolder: () => Promise<void>;
}

export interface ThemeApi {
  /**
   * O modo já resolvido pelo main, injetado no preload por
   * `additionalArguments`. É um valor, e não uma chamada, justamente para o
   * renderer poder escolher o tema no primeiro render — um `get()` assíncrono
   * custaria um frame com o tema errado a cada boot.
   */
  initialMode: ThemeMode | null;
  get: () => Promise<ThemeMode>;
  set: (mode: ThemeMode) => Promise<ThemeMode>;
}

export interface ElectronApi {
  setup: SetupApi;
  months: MonthsApi;
  defaultExpenses: DefaultExpensesApi;
  defaultIncomes: DefaultIncomesApi;
  bankAccounts: BankAccountsApi;
  categories: CategoriesApi;
  expenses: ExpensesApi;
  incomes: IncomesApi;
  receipts: ReceiptsApi;
  reports: ReportsApi;
  data: DataApi;
  theme: ThemeApi;
}
