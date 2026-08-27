import type Database from 'better-sqlite3';
import { makeAppSettingsRepository } from './repositories/appSettingsRepository';
import { makeOrdersRepository } from './repositories/ordersRepository';
import { makeProductsRepository } from './repositories/productsRepository';
import { makeSettingsRepository } from './repositories/settingsRepository';

/**
 * A unidade de trabalho: os repositórios prontos mais a transação, e é só isto
 * que o service recebe. É o que permite ao service orquestrar persistência sem
 * nunca importar `better-sqlite3` (README §2.2, ADR-0002).
 *
 * Ao contrário do `git-dlog`, `transaction()` já nasce com uso real na base:
 * os 4 `db.transaction` de `ordersRepository.ts` (`create`, `update`, `delete`,
 * `setStatus`) exercitam o mesmo mecanismo. Só não passam por este campo ainda
 * — a composição de `setStatus` continua autorada dentro do repositório, e só
 * migra para uma closure escrita pelo service, passada a `repos.transaction`,
 * no ticket 5.
 */
export function makeRepositories(db: Database.Database) {
  return {
    orders: makeOrdersRepository(db),
    products: makeProductsRepository(db),
    settings: makeSettingsRepository(db),
    appSettings: makeAppSettingsRepository(db),
    transaction: <T>(fn: () => T): T => db.transaction(fn)(),
  };
}

export type Repositories = ReturnType<typeof makeRepositories>;
