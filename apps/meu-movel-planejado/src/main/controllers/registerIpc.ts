import type Database from 'better-sqlite3';
import { makeRepositories } from '../infra/database';
import { appInfo } from '../infra/gateways/system/appInfo';
import { dialogs } from '../infra/gateways/system/dialogs';
import { fileSystem } from '../infra/gateways/system/fileSystem';
import { printing } from '../infra/gateways/system/printing';
import { shellGateway } from '../infra/gateways/system/shell';
import { themeMode } from '../infra/gateways/system/themeMode';
import { makeBackupService } from '../services/backupService';
import { makePiecesService } from '../services/piecesService';
import { makePlansService } from '../services/plansService';
import { makeProjectsService } from '../services/projectsService';
import { makeSettingsService } from '../services/settingsService';
import { makeSheetsService } from '../services/sheetsService';
import { registerBackupController } from './backupController';
import { registerPiecesController } from './piecesController';
import { registerPlansController } from './plansController';
import { registerProjectsController } from './projectsController';
import { registerSettingsController } from './settingsController';
import { registerSheetsController } from './sheetsController';

/**
 * Compõe as camadas e registra um controller por domínio — as duas funções que
 * este arquivo acumula por decisão do ADR-0002. A composição é rasa: nenhum
 * service depende de outro, só de `repos` e dos gateways de que precisa.
 *
 * É o arquivo a vigiar — são seis domínios (projects, pieces, sheets, plans,
 * backup, settings) contra os quatro do `meu-negocio-app`. Se doer, o que sai
 * daqui é a composição, não o registro (mesma pendência que o `meu-negocio-app`
 * e o `meu-dinheiro-app` registraram e não executaram).
 */
export function registerIpcHandlers(db: Database.Database): void {
  const repos = makeRepositories(db);

  const projects = makeProjectsService(repos);
  const pieces = makePiecesService(repos);
  const sheets = makeSheetsService(repos);
  const plans = makePlansService(repos, fileSystem, dialogs, printing);
  const backup = makeBackupService(repos, fileSystem, dialogs, shellGateway, appInfo);
  const settings = makeSettingsService(repos, themeMode);

  registerProjectsController(projects);
  registerPiecesController(pieces);
  registerSheetsController(sheets);
  registerPlansController(plans);
  registerBackupController(backup);
  registerSettingsController(settings);
}
