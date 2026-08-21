export const IPC_CHANNELS = {
  setupRun: 'setup:run',

  monthsList: 'months:list',
  monthsGet: 'months:get',
  monthsCreate: 'months:create',
  monthsCreateBatch: 'months:createBatch',
  monthsDelete: 'months:delete',

  defaultExpensesList: 'defaultExpenses:list',
  defaultExpensesCreate: 'defaultExpenses:create',
  defaultExpensesUpdate: 'defaultExpenses:update',
  defaultExpensesDelete: 'defaultExpenses:delete',

  defaultIncomesList: 'defaultIncomes:list',
  defaultIncomesCreate: 'defaultIncomes:create',
  defaultIncomesUpdate: 'defaultIncomes:update',
  defaultIncomesDelete: 'defaultIncomes:delete',

  bankAccountsList: 'bankAccounts:list',
  bankAccountsCreate: 'bankAccounts:create',
  bankAccountsUpdate: 'bankAccounts:update',
  bankAccountsDelete: 'bankAccounts:delete',

  categoriesList: 'categories:list',
  categoriesCreate: 'categories:create',
  categoriesUpdate: 'categories:update',
  categoriesDelete: 'categories:delete',

  expensesListForMonth: 'expenses:listForMonth',
  expensesCreate: 'expenses:create',
  expensesUpdate: 'expenses:update',
  expensesDelete: 'expenses:delete',
  expensesPay: 'expenses:pay',
  expensesUnpay: 'expenses:unpay',

  incomesListForMonth: 'incomes:listForMonth',
  incomesCreate: 'incomes:create',
  incomesUpdate: 'incomes:update',
  incomesDelete: 'incomes:delete',
  incomesReceive: 'incomes:receive',
  incomesUnreceive: 'incomes:unreceive',

  reportsCategoryTotalsForYear: 'reports:categoryTotalsForYear',

  receiptsOpen: 'receipts:open',

  dataExport: 'data:export',
  dataImport: 'data:import',
  dataOpenFolder: 'data:openFolder',

  themeGet: 'theme:get',
  themeSet: 'theme:set',

  /**
   * Evento (main → renderer), não `invoke`: avisa que algo no banco mudou.
   * É o único canal desta lista que não tem handler do lado do main.
   */
  dataChanged: 'data:changed',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/**
 * As leituras puras. Todo canal fora desta lista é tratado como escrita e
 * dispara `dataChanged` ao terminar.
 *
 * A lista enumera as **leituras** de propósito: esquecer de classificar um
 * canal novo custa uma recarga a mais, nunca um valor velho na tela. O tipo
 * `IpcChannel` garante que renomear um canal quebre aqui no `tsc`, e não em
 * silêncio no runtime.
 */
export const READ_ONLY_CHANNELS: ReadonlySet<IpcChannel> = new Set([
  IPC_CHANNELS.monthsList,
  IPC_CHANNELS.monthsGet,
  IPC_CHANNELS.defaultExpensesList,
  IPC_CHANNELS.defaultIncomesList,
  IPC_CHANNELS.bankAccountsList,
  IPC_CHANNELS.categoriesList,
  IPC_CHANNELS.expensesListForMonth,
  IPC_CHANNELS.incomesListForMonth,
  IPC_CHANNELS.reportsCategoryTotalsForYear,
  IPC_CHANNELS.themeGet,
]);

/**
 * Se um canal, ao terminar com sucesso, deve avisar o renderer de que os dados
 * mudaram. Pura de propósito: é o coração do mecanismo de invalidação e
 * precisa ser testável sem Electron.
 */
export function shouldNotifyDataChanged(channel: string): boolean {
  return !READ_ONLY_CHANNELS.has(channel as IpcChannel);
}
