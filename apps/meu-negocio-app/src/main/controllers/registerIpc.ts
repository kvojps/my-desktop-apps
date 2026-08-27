import type Database from 'better-sqlite3';
import { app } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { AppInfo } from '@shared/types/appInfo';
import { getDbPath } from '../infra/database/connection';
import { makeRepositories } from '../infra/database';
import { THEME_MODE_KEY, applyThemeMode, getThemeMode } from '../infra/gateways/system/themeMode';
import { AppError } from '../utils/errors/AppError';
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
  registerBackupHandlers(db, repos);

  handle(IPC_CHANNELS.productsGetAll, () => repos.products.list());
  handle(IPC_CHANNELS.productsAdd, (_event, data: unknown) =>
    repos.products.create(parseOrThrow(createProductSchema, data)),
  );
  handle(IPC_CHANNELS.productsUpdate, (_event, id: unknown, data: unknown) => {
    const productId = parseId(id);
    const product = repos.products.update(productId, parseOrThrow(updateProductSchema, data));
    if (!product) throw new AppError(404, `Produto não encontrado: ${productId}`);
    return product;
  });
  handle(IPC_CHANNELS.productsDelete, (_event, id: unknown) => {
    repos.products.delete(parseId(id));
  });

  handle(IPC_CHANNELS.ordersGetAll, () => repos.orders.list());
  handle(IPC_CHANNELS.ordersAdd, (_event, data: unknown) =>
    repos.orders.create(parseOrThrow(createOrderSchema, data)),
  );
  handle(IPC_CHANNELS.ordersUpdate, (_event, id: unknown, data: unknown) => {
    const orderId = parseId(id);
    const order = repos.orders.update(orderId, parseOrThrow(updateOrderSchema, data));
    if (!order) throw new AppError(404, `Pedido não encontrado: ${orderId}`);
    return order;
  });
  handle(IPC_CHANNELS.ordersSetStatus, (_event, id: unknown, newStatus: unknown) => {
    const orderId = parseId(id);
    const result = repos.orders.setStatus(orderId, parseOrThrow(orderStatusSchema, newStatus));
    if (!result) throw new AppError(404, `Pedido não encontrado: ${orderId}`);
    return result;
  });
  handle(IPC_CHANNELS.ordersSetPaymentAmount, (_event, id: unknown, amountPaid: unknown) => {
    const orderId = parseId(id);
    const order = repos.orders.setPaymentAmount(
      orderId,
      parseOrThrow(paymentAmountSchema, amountPaid),
    );
    if (!order) throw new AppError(404, `Pedido não encontrado: ${orderId}`);
    return order;
  });
  handle(
    IPC_CHANNELS.ordersDelete,
    (_event, id: unknown) => repos.orders.delete(parseId(id)) ?? { updatedProducts: [] },
  );

  handle(IPC_CHANNELS.settingsGet, () => repos.settings.getSettings());
  handle(IPC_CHANNELS.settingsUpdate, (_event, data: unknown) =>
    repos.settings.updateSettings(parseOrThrow(companySettingsSchema, data)),
  );

  handle(IPC_CHANNELS.appGetInfo, (): AppInfo => ({
    version: app.getVersion(),
    dbPath: getDbPath(),
  }));

  handle(IPC_CHANNELS.themeGet, () => getThemeMode());
  handle(IPC_CHANNELS.themeSet, (_event, mode: unknown) => {
    const value = parseOrThrow(themeModeSchema, mode);
    repos.appSettings.setAppSetting(THEME_MODE_KEY, value);
    applyThemeMode(value);
    return value;
  });
}
