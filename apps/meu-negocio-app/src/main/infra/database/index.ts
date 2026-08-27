import type Database from 'better-sqlite3';
import type { BackupData } from '@shared/types/backup';
import { makeAppSettingsRepository } from './repositories/appSettingsRepository';
import { importData } from './repositories/backupRepository';
import { makeOrdersRepository } from './repositories/ordersRepository';
import { makeProductsRepository } from './repositories/productsRepository';
import { makeSettingsRepository } from './repositories/settingsRepository';

/**
 * A unidade de trabalho: os repositórios prontos mais a transação, e é só isto
 * que o service recebe. É o que permite ao service orquestrar persistência sem
 * nunca importar `better-sqlite3` (README §2.2, ADR-0002).
 *
 * `transaction()` ganha seus call sites reais no `ordersService` (ticket 5): a
 * composição de `setStatus` e de `delete` — checar transição, conferir estoque,
 * baixar/estornar, gravar — foi escrita lá como closure e passada para cá. Os
 * `db.transaction` que sobram em `ordersRepository.ts` (`create`, `update`) são
 * atomicidade de um verbo só, não composição de regra.
 */
export function makeRepositories(db: Database.Database) {
  return {
    orders: makeOrdersRepository(db),
    products: makeProductsRepository(db),
    settings: makeSettingsRepository(db),
    appSettings: makeAppSettingsRepository(db),
    transaction: <T>(fn: () => T): T => db.transaction(fn)(),
    /**
     * Importar backup apaga e reescreve quatro tabelas inteiras numa transação
     * só — linhas cruas, não uma sequência de verbos de uma entidade. Fica
     * aqui, atrás da unidade de trabalho, porque precisa do `db` que o
     * `backupService` não pode tocar.
     */
    importBackup: (data: BackupData): void => importData(db, data),
  };
}

export type Repositories = ReturnType<typeof makeRepositories>;
