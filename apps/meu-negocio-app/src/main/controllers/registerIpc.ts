import type Database from 'better-sqlite3';
import { app } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { AppInfo } from '@shared/types/appInfo';
import { makeRepositories } from '../infra/database';
import { getDbPath } from '../infra/database/connection';
import { dialogs } from '../infra/gateways/system/dialogs';
import { fileSystem } from '../infra/gateways/system/fileSystem';
import { shellGateway } from '../infra/gateways/system/shell';
import { themeMode } from '../infra/gateways/system/themeMode';
import { makeBackupService } from '../services/backupService';
import { makeOrdersService } from '../services/ordersService';
import { makeProductsService } from '../services/productsService';
import { makeSettingsService } from '../services/settingsService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { registerBackupHandlers } from './backupHandlers';
import { handle } from './handle';
import {
  createOrderSchema,
  orderStatusSchema,
  paymentAmountSchema,
  updateOrderSchema,
} from './schemas/orders.schema';
import { createProductSchema, updateProductSchema } from './schemas/products.schema';
import { companySettingsSchema } from './schemas/settings.schema';
import { themeModeSchema } from './schemas/theme.schema';

export function registerIpcHandlers(db: Database.Database): void {
  const repos = makeRepositories(db);

  const ordersService = makeOrdersService(repos);
  const productsService = makeProductsService(repos);
  const settingsService = makeSettingsService(repos, themeMode);
  const backupService = makeBackupService(repos, fileSystem, dialogs, shellGateway);

  registerBackupHandlers(backupService);

  // Os handlers de products devolvem ProductEntity direto pelo IPC, sem o
  // mapper entity → response (controllers/responses/, ticket 6). Hoje
  // ProductEntity é estruturalmente igual ao Product de shared/types/, então
  // nada vaza de fato — mas nada garante que sigam iguais (domain/product.ts).
  handle(IPC_CHANNELS.productsGetAll, () => productsService.list());
  handle(IPC_CHANNELS.productsAdd, (_event, data: unknown) =>
    productsService.create(parseOrThrow(createProductSchema, data)),
  );
  handle(IPC_CHANNELS.productsUpdate, (_event, id: unknown, data: unknown) =>
    productsService.update(parseId(id), parseOrThrow(updateProductSchema, data)),
  );
  handle(IPC_CHANNELS.productsDelete, (_event, id: unknown) => {
    productsService.delete(parseId(id));
  });

  // Os handlers de orders devolvem OrderEntity direto pelo IPC — inclui
  // `items[].stockApplied`, escrituração interna que o README.md §2.5 cita
  // como o caso que motiva o mapper entity → response. Esse mapper
  // (controllers/responses/, ticket 6) ainda não existe: até lá, a travessia
  // é silenciosa — o campo chega ao renderer sem que nada o filtre.
  handle(IPC_CHANNELS.ordersGetAll, () => ordersService.list());
  handle(IPC_CHANNELS.ordersAdd, (_event, data: unknown) =>
    ordersService.create(parseOrThrow(createOrderSchema, data)),
  );
  handle(IPC_CHANNELS.ordersUpdate, (_event, id: unknown, data: unknown) =>
    ordersService.update(parseId(id), parseOrThrow(updateOrderSchema, data)),
  );
  handle(IPC_CHANNELS.ordersSetStatus, (_event, id: unknown, newStatus: unknown) =>
    ordersService.setStatus(parseId(id), parseOrThrow(orderStatusSchema, newStatus)),
  );
  handle(IPC_CHANNELS.ordersSetPaymentAmount, (_event, id: unknown, amountPaid: unknown) =>
    ordersService.setPaymentAmount(parseId(id), parseOrThrow(paymentAmountSchema, amountPaid)),
  );
  handle(IPC_CHANNELS.ordersDelete, (_event, id: unknown) =>
    ordersService.delete(parseId(id)),
  );

  handle(IPC_CHANNELS.settingsGet, () => settingsService.getSettings());
  handle(IPC_CHANNELS.settingsUpdate, (_event, data: unknown) =>
    settingsService.updateSettings(parseOrThrow(companySettingsSchema, data)),
  );

  handle(IPC_CHANNELS.appGetInfo, (): AppInfo => ({
    version: app.getVersion(),
    dbPath: getDbPath(),
  }));

  handle(IPC_CHANNELS.themeGet, () => settingsService.getThemeMode());
  handle(IPC_CHANNELS.themeSet, (_event, mode: unknown) => {
    const value = parseOrThrow(themeModeSchema, mode);
    settingsService.saveThemeMode(value);
    return value;
  });
}
