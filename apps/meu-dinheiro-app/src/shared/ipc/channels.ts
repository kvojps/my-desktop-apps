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
} as const;
