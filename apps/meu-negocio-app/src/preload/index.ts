import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronApi } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { CreateOrderData, OrderStatus, UpdateOrderData } from '@shared/types/order';
import type { Product } from '@shared/types/product';
import type { CompanySettings } from '@shared/types/settings';
import type { ThemeMode } from '@shared/types/theme';

const INITIAL_THEME_MODE_FLAG = '--initial-theme-mode=';

/**
 * O modo que o main já resolveu (banco ou sistema operacional) e passou por
 * `webPreferences.additionalArguments`. Chega aqui de forma síncrona, antes do
 * primeiro render, que é o que evita o frame de tema errado no boot.
 */
function readInitialThemeMode(): ThemeMode | null {
  const arg = process.argv.find((value) => value.startsWith(INITIAL_THEME_MODE_FLAG));
  const mode = arg?.slice(INITIAL_THEME_MODE_FLAG.length);
  return mode === 'light' || mode === 'dark' ? mode : null;
}

const api: ElectronApi = {
  onDataChanged: (listener) => {
    const handler = () => listener();
    ipcRenderer.on(IPC_CHANNELS.dataChanged, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.dataChanged, handler);
  },
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
    openFolder: () => ipcRenderer.invoke(IPC_CHANNELS.dataOpenFolder),
  },
  app: {
    getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.appGetInfo),
  },
  theme: {
    initialMode: readInitialThemeMode(),
    get: () => ipcRenderer.invoke(IPC_CHANNELS.themeGet),
    set: (mode: ThemeMode) => ipcRenderer.invoke(IPC_CHANNELS.themeSet, mode),
  },
};

contextBridge.exposeInMainWorld('api', api);
