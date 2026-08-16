import type { CreateOrderData, OrderStatus, UpdateOrderData } from '@shared/types/order';
import type { Product } from '@shared/types/product';
import type { CompanySettings } from '@shared/types/settings';

function unwrapIpcError(err: unknown): never {
  if (err instanceof Error) {
    const match = err.message.match(
      /Error invoking remote method '[^']+':\s*(?:[A-Za-z]*Error:\s*)?(.*)/s,
    );
    throw new Error(match ? match[1] : err.message);
  }
  throw err;
}

async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    return unwrapIpcError(err);
  }
}

/**
 * Fachada tipada sobre o `window.api` exposto no preload. Toda chamada ao main
 * passa por aqui: é o único lugar que conhece o formato do erro que atravessa o
 * IPC, e o resto do renderer fala com métodos comuns.
 */
export const api = {
  getProducts() {
    return call(() => window.api.products.getAll());
  },

  addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    return call(() => window.api.products.add(data));
  },

  updateProduct(id: string, data: Partial<Product>) {
    return call(() => window.api.products.update(id, data));
  },

  deleteProduct(id: string) {
    return call(() => window.api.products.delete(id));
  },

  getOrders() {
    return call(() => window.api.orders.getAll());
  },

  addOrder(data: CreateOrderData) {
    return call(() => window.api.orders.add(data));
  },

  updateOrder(id: string, data: UpdateOrderData) {
    return call(() => window.api.orders.update(id, data));
  },

  setOrderStatus(id: string, newStatus: OrderStatus) {
    return call(() => window.api.orders.setStatus(id, newStatus));
  },

  setOrderPaymentAmount(id: string, amountPaid: number) {
    return call(() => window.api.orders.setPaymentAmount(id, amountPaid));
  },

  deleteOrder(id: string) {
    return call(() => window.api.orders.delete(id));
  },

  getSettings() {
    return call(() => window.api.settings.get());
  },

  updateSettings(data: CompanySettings) {
    return call(() => window.api.settings.update(data));
  },

  getAppInfo() {
    return call(() => window.api.app.getInfo());
  },

  exportData() {
    return call(() => window.api.data.export());
  },

  importData() {
    return call(() => window.api.data.import());
  },

  openDataFolder() {
    return call(() => window.api.data.openFolder());
  },
};
