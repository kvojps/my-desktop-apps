import type Database from 'better-sqlite3';
import { makeAppSettingsRepository } from './repositories/appSettingsRepository';
import { type BackupData, importData } from './repositories/backupRepository';
import { makeBankAccountsRepository } from './repositories/bankAccountsRepository';
import { makeCategoriesRepository } from './repositories/categoriesRepository';
import { makeDefaultExpensesRepository } from './repositories/defaultExpensesRepository';
import { makeDefaultIncomesRepository } from './repositories/defaultIncomesRepository';
import { makeExpensesRepository } from './repositories/expensesRepository';
import { makeIncomesRepository } from './repositories/incomesRepository';
import { makeMonthsRepository } from './repositories/monthsRepository';

/**
 * A unidade de trabalho: os repositórios prontos mais a transação, e é só isto
 * que o service recebe. É o que permite ao service orquestrar persistência sem
 * nunca importar `better-sqlite3` (README §2.2, ADR-0002).
 *
 * `transaction()` nasce aqui sem call site real: os ~11 `db.transaction` do app
 * seguem dentro dos repositórios por enquanto (`createMonthWithDefaults`,
 * `createBatch`, `pay`/`unpay`, `receive`/`unreceive`, os `create` de padrão, os
 * `delete` de conta/categoria, `runSetup`). Cada um vira composição autorada
 * pelo `monthsService`/`expensesService`/… sobre `repos.transaction` no ticket 05
 * (`.scratch/dinheiro-camadas-processo-principal/spec.md`, decisões 6 e 7).
 */
export function makeRepositories(db: Database.Database) {
  return {
    months: makeMonthsRepository(db),
    expenses: makeExpensesRepository(db),
    incomes: makeIncomesRepository(db),
    defaultExpenses: makeDefaultExpensesRepository(db),
    defaultIncomes: makeDefaultIncomesRepository(db),
    bankAccounts: makeBankAccountsRepository(db),
    categories: makeCategoriesRepository(db),
    appSettings: makeAppSettingsRepository(db),
    transaction: <T>(fn: () => T): T => db.transaction(fn)(),
    /**
     * Importar backup apaga e reescreve sete tabelas inteiras numa transação só
     * — linhas cruas, não uma sequência de verbos de entidade. Fica aqui, atrás
     * da unidade de trabalho, porque precisa do `db` que o `backupService`
     * (ticket 05) não pode tocar.
     */
    importBackup: (data: BackupData): void => importData(db, data),
  };
}

export type Repositories = ReturnType<typeof makeRepositories>;
