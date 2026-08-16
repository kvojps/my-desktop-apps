import type Database from 'better-sqlite3';
import { app, ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { AppInfo } from '@shared/types/appInfo';
import { getDbPath } from '../db/connection';
import {
  addOrder,
  deleteOrder,
  getAllOrders,
  setOrderPaymentAmount,
  setOrderStatus,
  updateOrder,
} from '../db/ordersRepository';
import { addProduct, deleteProduct, getAllProducts, updateProduct } from '../db/productsRepository';
import { getSettings, updateSettings } from '../db/settingsRepository';
import {
  createOrderSchema,
  orderStatusSchema,
  paymentAmountSchema,
  updateOrderSchema,
} from '../schemas/orders.schema';
import { createProductSchema, updateProductSchema } from '../schemas/products.schema';
import { companySettingsSchema } from '../schemas/settings.schema';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { registerBackupHandlers } from './backupHandlers';

export function registerIpcHandlers(db: Database.Database): void {
  registerBackupHandlers(db);

  ipcMain.handle(IPC_CHANNELS.productsGetAll, () => getAllProducts(db));
  ipcMain.handle(IPC_CHANNELS.productsAdd, (_event, data: unknown) =>
    addProduct(db, parseOrThrow(createProductSchema, data)),
  );
  ipcMain.handle(IPC_CHANNELS.productsUpdate, (_event, id: unknown, data: unknown) =>
    updateProduct(db, parseId(id), parseOrThrow(updateProductSchema, data)),
  );
  ipcMain.handle(IPC_CHANNELS.productsDelete, (_event, id: unknown) =>
    deleteProduct(db, parseId(id)),
  );

  ipcMain.handle(IPC_CHANNELS.ordersGetAll, () => getAllOrders(db));
  ipcMain.handle(IPC_CHANNELS.ordersAdd, (_event, data: unknown) =>
    addOrder(db, parseOrThrow(createOrderSchema, data)),
  );
  ipcMain.handle(IPC_CHANNELS.ordersUpdate, (_event, id: unknown, data: unknown) =>
    updateOrder(db, parseId(id), parseOrThrow(updateOrderSchema, data)),
  );
  ipcMain.handle(IPC_CHANNELS.ordersSetStatus, (_event, id: unknown, newStatus: unknown) =>
    setOrderStatus(db, parseId(id), parseOrThrow(orderStatusSchema, newStatus)),
  );
  ipcMain.handle(IPC_CHANNELS.ordersSetPaymentAmount, (_event, id: unknown, amountPaid: unknown) =>
    setOrderPaymentAmount(db, parseId(id), parseOrThrow(paymentAmountSchema, amountPaid)),
  );
  ipcMain.handle(IPC_CHANNELS.ordersDelete, (_event, id: unknown) => deleteOrder(db, parseId(id)));

  ipcMain.handle(IPC_CHANNELS.settingsGet, () => getSettings(db));
  ipcMain.handle(IPC_CHANNELS.settingsUpdate, (_event, data: unknown) =>
    updateSettings(db, parseOrThrow(companySettingsSchema, data)),
  );

  ipcMain.handle(IPC_CHANNELS.appGetInfo, (): AppInfo => ({
    version: app.getVersion(),
    dbPath: getDbPath(),
  }));
}
