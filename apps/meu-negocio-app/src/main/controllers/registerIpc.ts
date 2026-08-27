import type Database from 'better-sqlite3';
import { makeRepositories } from '../infra/database';
import { appInfo } from '../infra/gateways/system/appInfo';
import { dialogs } from '../infra/gateways/system/dialogs';
import { fileSystem } from '../infra/gateways/system/fileSystem';
import { shellGateway } from '../infra/gateways/system/shell';
import { themeMode } from '../infra/gateways/system/themeMode';
import { makeBackupService } from '../services/backupService';
import { makeOrdersService } from '../services/ordersService';
import { makeProductsService } from '../services/productsService';
import { makeSettingsService } from '../services/settingsService';
import { registerBackupController } from './backupController';
import { registerOrdersController } from './ordersController';
import { registerProductsController } from './productsController';
import { registerSettingsController } from './settingsController';

/**
 * Monta as camadas e registra os canais — as duas funções que este arquivo
 * acumula por decisão (ADR-0002). A composição é rasa: nenhum service depende de
 * outro, só de `repos` e dos gateways de que precisa.
 *
 * É o arquivo a vigiar quando os apps maiores chegarem — são quatro domínios
 * (orders, products, settings, backup) contra os do `git-dlog`, e o risco já
 * está registrado na spec. Se doer, o que sai daqui é a composição, não o
 * registro.
 */
export function registerIpcHandlers(db: Database.Database): void {
  const repos = makeRepositories(db);

  const ordersService = makeOrdersService(repos);
  const productsService = makeProductsService(repos);
  const settingsService = makeSettingsService(repos, themeMode, appInfo);
  const backupService = makeBackupService(repos, fileSystem, dialogs, shellGateway);

  registerOrdersController(ordersService);
  registerProductsController(productsService);
  registerSettingsController(settingsService);
  registerBackupController(backupService);
}
