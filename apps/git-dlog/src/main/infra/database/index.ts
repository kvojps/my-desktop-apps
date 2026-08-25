import type Database from 'better-sqlite3';
import { makeScanPathsRepository } from './repositories/scanPathsRepository';
import { makeSettingsRepository } from './repositories/settingsRepository';

/**
 * A unidade de trabalho: os repositórios prontos mais a transação, e é só isto
 * que o service recebe. É o que permite ao service orquestrar persistência sem
 * nunca importar `better-sqlite3` (README §2.2, ADR-0002).
 *
 * `transaction()` nasce sem call site algum no `git-dlog` — o app não tem
 * nenhum `db.transaction` fora do runner de migração. É esperado: o primeiro
 * uso real chega no `meu-negocio-app`, e a peça existe aqui para o contrato ser
 * o mesmo nos quatro apps.
 */
export function makeRepositories(db: Database.Database) {
  return {
    scanPaths: makeScanPathsRepository(db),
    settings: makeSettingsRepository(db),
    transaction: <T>(fn: () => T): T => db.transaction(fn)(),
  };
}

export type Repositories = ReturnType<typeof makeRepositories>;
