import type Database from 'better-sqlite3';
import { makeBackupRepository } from './repositories/backupRepository';
import { makePiecesRepository } from './repositories/piecesRepository';
import { makePlansRepository } from './repositories/plansRepository';
import { makeProjectsRepository } from './repositories/projectsRepository';
import { makeSettingsRepository } from './repositories/settingsRepository';
import { makeSheetsRepository } from './repositories/sheetsRepository';

/**
 * A unidade de trabalho: os seis repositórios prontos mais `transaction()`, e é
 * só isto que o service recebe. É o que permite ao service orquestrar
 * persistência sem nunca importar `better-sqlite3` (README §2.2, ADR-0002).
 *
 * `transaction()` é a costura de composição. Cada `db.transaction` que morava
 * dentro de um repositório — as três escritas de peça, as três de chapa (a
 * escrita mais o `projects.touch`, para que um carimbo antigo com peça nova
 * nunca exista), `replaceForProject` (o `DELETE` + os quatro `INSERT` em
 * cascata) e `importRows` (apaga e reescreve tudo) — passa a ser composto por
 * quem chama sobre `repos.transaction(fn)`. Neste ticket quem compõe ainda é o
 * `registerIpc.ts` provisório; o ticket 05 move a composição para os services.
 * Os repositórios terminam com zero `db.transaction`.
 */
export function makeRepositories(db: Database.Database) {
  return {
    projects: makeProjectsRepository(db),
    pieces: makePiecesRepository(db),
    sheets: makeSheetsRepository(db),
    plans: makePlansRepository(db),
    settings: makeSettingsRepository(db),
    backup: makeBackupRepository(db),
    transaction: <T>(fn: () => T): T => db.transaction(fn)(),
  };
}

export type Repositories = ReturnType<typeof makeRepositories>;
