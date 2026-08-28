import type Database from 'better-sqlite3';
import { makeRepositories } from '../infra/database';
import { getUploadsDir } from '../infra/database/connection';
import { backupArchive } from '../infra/gateways/backupArchive';
import { makeReceiptsGateway } from '../infra/gateways/receipts';
import { dialogs } from '../infra/gateways/system/dialogs';
import { shellGateway } from '../infra/gateways/system/shell';
import { themeMode } from '../infra/gateways/system/themeMode';
import { makeBackupService } from '../services/backupService';
import { makeBankAccountsService } from '../services/bankAccountsService';
import { makeCategoriesService } from '../services/categoriesService';
import { makeDefaultExpensesService } from '../services/defaultExpensesService';
import { makeDefaultIncomesService } from '../services/defaultIncomesService';
import { makeExpensesService } from '../services/expensesService';
import { makeIncomesService } from '../services/incomesService';
import { makeMonthsService } from '../services/monthsService';
import { makeReportsService } from '../services/reportsService';
import { makeSettingsService } from '../services/settingsService';
import { makeSetupService } from '../services/setupService';
import { registerBackupController } from './backupController';
import { registerBankAccountsController } from './bankAccountsController';
import { registerCategoriesController } from './categoriesController';
import { registerDefaultExpensesController } from './defaultExpensesController';
import { registerDefaultIncomesController } from './defaultIncomesController';
import { registerExpensesController } from './expensesController';
import { registerIncomesController } from './incomesController';
import { registerMonthsController } from './monthsController';
import { registerReportsController } from './reportsController';
import { registerSettingsController } from './settingsController';

/**
 * Compõe as camadas em ordem topológica e registra um controller por domínio —
 * as duas funções que este arquivo acumula por decisão do ADR-0002. `receipts` e
 * `uploadsDir` chegam fechados aqui (path puro de `connection.ts`, decisão 13);
 * o `backupService` recebe o `monthsService` já pronto porque o pós-import
 * precisa garantir o Mês corrente (service→service, decisão 12).
 *
 * **Retorna a composição** (`{ months }` no mínimo): carve-out do ADR-0002 (spec
 * de `.scratch/dinheiro-camadas-processo-principal/`, decisão 5). O `index.ts`
 * chama `services.months.ensureCurrentMonth()` no boot e no
 * `browser-window-focus`, agora *depois* de registrar os canais. Ver comentário
 * no `index.ts`.
 *
 * É o arquivo a vigiar — são ~11 domínios contra os 4 do `meu-negocio-app`. Se
 * doer, o que sai daqui é a composição, não o registro (mesma pendência que o
 * `meu-negocio-app` registrou).
 */
export function registerIpcHandlers(db: Database.Database) {
  const uploadsDir = getUploadsDir();
  const repos = makeRepositories(db);
  const receipts = makeReceiptsGateway(uploadsDir);

  const bankAccountsService = makeBankAccountsService(repos);
  const monthsService = makeMonthsService(repos);
  const expensesService = makeExpensesService(repos, bankAccountsService, receipts);
  const incomesService = makeIncomesService(repos, bankAccountsService);
  const defaultExpensesService = makeDefaultExpensesService(repos);
  const defaultIncomesService = makeDefaultIncomesService(repos);
  const categoriesService = makeCategoriesService(repos);
  const reportsService = makeReportsService(repos);
  const setupService = makeSetupService(repos);
  const settingsService = makeSettingsService(repos, themeMode);
  const backupService = makeBackupService(
    repos,
    monthsService,
    backupArchive,
    dialogs,
    shellGateway,
    uploadsDir,
  );

  registerMonthsController(monthsService, setupService);
  registerExpensesController(expensesService);
  registerIncomesController(incomesService);
  registerDefaultExpensesController(defaultExpensesService);
  registerDefaultIncomesController(defaultIncomesService);
  registerBankAccountsController(bankAccountsService);
  registerCategoriesController(categoriesService);
  registerReportsController(reportsService);
  registerBackupController(backupService);
  registerSettingsController(settingsService);

  return { months: monthsService };
}
