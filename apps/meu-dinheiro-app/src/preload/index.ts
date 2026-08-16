import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronApi, ReceiptPayload } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';

const api: ElectronApi = {
  setup: {
    run: (initialMonth, initialYear) =>
      ipcRenderer.invoke(IPC_CHANNELS.setupRun, initialMonth, initialYear),
  },
  months: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.monthsList),
    get: (id) => ipcRenderer.invoke(IPC_CHANNELS.monthsGet, id),
    create: (year, month) => ipcRenderer.invoke(IPC_CHANNELS.monthsCreate, year, month),
    createBatch: (fromYear, fromMonth, toYear, toMonth) =>
      ipcRenderer.invoke(IPC_CHANNELS.monthsCreateBatch, fromYear, fromMonth, toYear, toMonth),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.monthsDelete, id),
  },
  defaultExpenses: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.defaultExpensesList),
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.defaultExpensesCreate, data),
    update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.defaultExpensesUpdate, id, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.defaultExpensesDelete, id),
  },
  defaultIncomes: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.defaultIncomesList),
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.defaultIncomesCreate, data),
    update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.defaultIncomesUpdate, id, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.defaultIncomesDelete, id),
  },
  bankAccounts: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.bankAccountsList),
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.bankAccountsCreate, data),
    update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.bankAccountsUpdate, id, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.bankAccountsDelete, id),
  },
  categories: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.categoriesList),
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.categoriesCreate, data),
    update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.categoriesUpdate, id, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.categoriesDelete, id),
  },
  expenses: {
    listForMonth: (monthId) => ipcRenderer.invoke(IPC_CHANNELS.expensesListForMonth, monthId),
    create: (monthId, data) => ipcRenderer.invoke(IPC_CHANNELS.expensesCreate, monthId, data),
    update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.expensesUpdate, id, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.expensesDelete, id),
    pay: (
      id,
      payload: {
        receipt?: ReceiptPayload;
        notes?: string;
        paidAt?: string;
        bankAccountId?: number;
      },
    ) => ipcRenderer.invoke(IPC_CHANNELS.expensesPay, id, payload),
    unpay: (id) => ipcRenderer.invoke(IPC_CHANNELS.expensesUnpay, id),
  },
  incomes: {
    listForMonth: (monthId) => ipcRenderer.invoke(IPC_CHANNELS.incomesListForMonth, monthId),
    create: (monthId, data) => ipcRenderer.invoke(IPC_CHANNELS.incomesCreate, monthId, data),
    update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.incomesUpdate, id, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.incomesDelete, id),
    receive: (id, notes, receivedAt, bankAccountId) =>
      ipcRenderer.invoke(IPC_CHANNELS.incomesReceive, id, notes, receivedAt, bankAccountId),
    unreceive: (id) => ipcRenderer.invoke(IPC_CHANNELS.incomesUnreceive, id),
  },
  receipts: {
    open: (filename) => ipcRenderer.invoke(IPC_CHANNELS.receiptsOpen, filename),
  },
  reports: {
    categoryTotalsForYear: (year) =>
      ipcRenderer.invoke(IPC_CHANNELS.reportsCategoryTotalsForYear, year),
  },
  data: {
    export: () => ipcRenderer.invoke(IPC_CHANNELS.dataExport),
    import: () => ipcRenderer.invoke(IPC_CHANNELS.dataImport),
    openFolder: () => ipcRenderer.invoke(IPC_CHANNELS.dataOpenFolder),
  },
};

contextBridge.exposeInMainWorld('api', api);
