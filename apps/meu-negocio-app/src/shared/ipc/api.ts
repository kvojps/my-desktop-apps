import type { AppInfo } from '@shared/types/appInfo';
import type { BackupData } from '@shared/types/backup';
import type { CreateOrderData, Order, OrderStatus, UpdateOrderData } from '@shared/types/order';
import type { Product } from '@shared/types/product';
import type { CompanySettings } from '@shared/types/settings';

export type { BackupData };

export interface ProductsApi {
  getAll: () => Promise<Product[]>;
  add: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  update: (id: string, data: Partial<Product>) => Promise<Product>;
  delete: (id: string) => Promise<void>;
}

export interface SetOrderStatusResult {
  order: Order;
  updatedProducts: Product[];
}

export interface DeleteOrderResult {
  /** Produtos que tiveram o estoque devolvido, quando a venda estava concluída. */
  updatedProducts: Product[];
}

export interface OrdersApi {
  getAll: () => Promise<Order[]>;
  add: (data: CreateOrderData) => Promise<Order>;
  update: (id: string, data: UpdateOrderData) => Promise<Order>;
  setStatus: (id: string, newStatus: OrderStatus) => Promise<SetOrderStatusResult>;
  setPaymentAmount: (id: string, amountPaid: number) => Promise<Order>;
  delete: (id: string) => Promise<DeleteOrderResult>;
}

export interface SettingsApi {
  get: () => Promise<CompanySettings>;
  update: (data: CompanySettings) => Promise<CompanySettings>;
}

export type ExportResult =
  { success: true; filePath: string } | { success: false; error: 'canceled' };

export type ImportResult =
  | { success: true }
  | {
      success: false;
      error: 'canceled' | 'read-failed' | 'invalid-json' | 'invalid-format';
    };

export interface DataApi {
  export: () => Promise<ExportResult>;
  import: () => Promise<ImportResult>;
}

export interface AppInfoApi {
  getInfo: () => Promise<AppInfo>;
}

export interface ElectronApi {
  products: ProductsApi;
  orders: OrdersApi;
  settings: SettingsApi;
  data: DataApi;
  app: AppInfoApi;
}
