import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronApi } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { CreateOrderData, OrderStatus, UpdateOrderData } from '@shared/types/order';
import type { Product } from '@shared/types/product';
import type { CompanySettings } from '@shared/types/settings';

const api: ElectronApi = {
  products: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.productsGetAll),
    add: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
      ipcRenderer.invoke(IPC_CHANNELS.productsAdd, data),
    update: (id: string, data: Partial<Product>) =>
      ipcRenderer.invoke(IPC_CHANNELS.productsUpdate, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.productsDelete, id),
  },
  orders: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.ordersGetAll),
    add: (data: CreateOrderData) => ipcRenderer.invoke(IPC_CHANNELS.ordersAdd, data),
    update: (id: string, data: UpdateOrderData) =>
      ipcRenderer.invoke(IPC_CHANNELS.ordersUpdate, id, data),
    setStatus: (id: string, newStatus: OrderStatus) =>
      ipcRenderer.invoke(IPC_CHANNELS.ordersSetStatus, id, newStatus),
    setPaymentAmount: (id: string, amountPaid: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.ordersSetPaymentAmount, id, amountPaid),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.ordersDelete, id),
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.settingsGet),
    update: (data: CompanySettings) => ipcRenderer.invoke(IPC_CHANNELS.settingsUpdate, data),
  },
  data: {
    export: () => ipcRenderer.invoke(IPC_CHANNELS.dataExport),
    import: () => ipcRenderer.invoke(IPC_CHANNELS.dataImport),
  },
  app: {
    getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.appGetInfo),
  },
};

contextBridge.exposeInMainWorld('api', api);
