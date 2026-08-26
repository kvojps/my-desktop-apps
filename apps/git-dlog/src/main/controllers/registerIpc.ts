import type Database from 'better-sqlite3';
import { makeRepositories } from '../infra/database';
import { dialogs } from '../infra/gateways/system/dialogs';
import { fileSystem } from '../infra/gateways/system/fileSystem';
import { safeStorageVault } from '../infra/gateways/system/safeStorage';
import { shellGateway } from '../infra/gateways/system/shell';
import { theme } from '../infra/gateways/system/theme';
import { makePrsService } from '../services/prsService';
import { makeReposService } from '../services/reposService';
import { makeScanPathsService } from '../services/scanPathsService';
import { makeSettingsService } from '../services/settingsService';
import { makeSystemService } from '../services/systemService';
import { registerPrsController } from './prsController';
import { registerReposController } from './reposController';
import { registerScanPathsController } from './scanPathsController';
import { registerSystemController } from './systemController';

/**
 * Monta as camadas e registra os canais — as duas funções que este arquivo
 * acumula por decisão (ADR-0002). A composição vem em ordem topológica: o
 * `prsService` recebe o `settingsService` porque o token é guardado lá, e o
 * `reposService` recebe o `prsService` porque a busca do remoto sequencia as
 * duas fases de rede.
 *
 * É o arquivo a vigiar quando os apps maiores chegarem; se doer, o que sai
 * daqui é a composição, não o registro.
 */
export function registerIpcHandlers(db: Database.Database): void {
  const repos = makeRepositories(db);

  const settingsService = makeSettingsService(repos, safeStorageVault, theme);
  const scanPathsService = makeScanPathsService(repos, fileSystem);
  const prsService = makePrsService(settingsService);
  const reposService = makeReposService(repos, prsService);
  const systemService = makeSystemService(shellGateway, dialogs);

  registerScanPathsController(scanPathsService);
  registerReposController(reposService);
  registerPrsController(prsService);
  registerSystemController(systemService, settingsService);
}
